import { StaffApiHttpError } from "@/lib/admin-api";
import { requireStaffSession } from "@/lib/auth/session";
import { validateObservationInput } from "@/lib/metrics/observation-rules";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const clientId = params.get("client_id")?.trim();
  const vaultObjectId = params.get("vault_object_id")?.trim();

  if (!clientId || !vaultObjectId) {
    return NextResponse.json(
      { error: "client_id and vault_object_id are required" },
      { status: 400 },
    );
  }

  try {
    await assertStaffCanAccessClient(clientId);
    const supabase = await createClient();

    const { data: job, error: jobError } = await supabase
      .from("vault_analysis_jobs")
      .select("id, status, error_message, classification, model_metadata, queued_at, started_at, finished_at")
      .eq("client_id", clientId)
      .eq("vault_object_id", vaultObjectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (jobError) throw new Error(jobError.message);
    if (!job) {
      return NextResponse.json({ job: null, events: [], candidates: [] });
    }

    const [{ data: events, error: eventsError }, { data: candidates, error: candidatesError }] =
      await Promise.all([
        supabase
          .from("vault_analysis_events")
          .select("id, occurred_at, stage, level, message, details")
          .eq("job_id", job.id)
          .order("occurred_at", { ascending: true })
          .order("id", { ascending: true }),
        supabase
          .from("metric_observation_candidates")
          .select("id, client_metric_id, metric_label, value, unit, period_start, period_end, confidence, evidence_excerpt, status")
          .eq("vault_analysis_job_id", job.id)
          .order("created_at", { ascending: true }),
      ]);

    if (eventsError) throw new Error(eventsError.message);
    if (candidatesError) throw new Error(candidatesError.message);

    const candidateRows = candidates ?? [];
    const metricIds = candidateRows
      .map((candidate) => candidate.client_metric_id)
      .filter((id): id is string => Boolean(id));
    const [{ data: priorCandidates, error: priorCandidatesError }, { data: observations, error: observationsError }] =
      metricIds.length > 0
        ? await Promise.all([
            supabase
              .from("metric_observation_candidates")
              .select("id, client_metric_id, value, period_start, period_end, status, vault_analysis_job_id")
              .eq("vault_object_id", vaultObjectId)
              .neq("vault_analysis_job_id", job.id)
              .in("client_metric_id", metricIds)
              .in("status", ["pending_review", "approved"]),
            supabase
              .from("metric_observations")
              .select("id, client_metric_id, value, period_start, period_end, source_document")
              .in("client_metric_id", metricIds)
              .eq("is_ignored", false)
              .like("source_document", `vault:${vaultObjectId};%`),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];
    if (priorCandidatesError) throw new Error(priorCandidatesError.message);
    if (observationsError) throw new Error(observationsError.message);

    const annotatedCandidates = candidateRows.map((candidate) => {
      const samePeriod = (row: {
        client_metric_id: string | null;
        period_start: string;
        period_end: string;
      }) =>
        row.client_metric_id === candidate.client_metric_id &&
        row.period_start === candidate.period_start &&
        row.period_end === candidate.period_end;
      const published = (observations ?? []).find(samePeriod);
      const prior = (priorCandidates ?? []).find(samePeriod);
      return {
        ...candidate,
        duplicate: published
          ? { kind: "published", value: published.value }
          : prior
            ? { kind: "candidate", value: prior.value, status: prior.status }
            : null,
      };
    });

    return NextResponse.json({
      job,
      events: events ?? [],
      candidates: annotatedCandidates,
    });
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Staff vault analysis query failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

type CandidateMetricRow = {
  id: string;
  client_id: string;
  metric_definitions:
    | { kind: string; unit: string; stock_flow: string | null }
    | { kind: string; unit: string; stock_flow: string | null }[]
    | null;
};

export async function PATCH(request: Request) {
  try {
    const { user } = await requireStaffSession();
    const body = (await request.json()) as {
      candidate_id?: unknown;
      decision?: unknown;
      review_note?: unknown;
    };
    const candidateId =
      typeof body.candidate_id === "string" ? body.candidate_id.trim() : "";
    const decision = typeof body.decision === "string" ? body.decision : "";
    const reviewNote =
      typeof body.review_note === "string" ? body.review_note.trim().slice(0, 2000) : "";

    if (!candidateId || !["approve", "reject"].includes(decision)) {
      return NextResponse.json(
        { error: "candidate_id and decision (approve or reject) are required" },
        { status: 400 },
      );
    }

    const admin = createServiceRoleClient();
    const { data: candidate, error: candidateError } = await admin
      .from("metric_observation_candidates")
      .select("id, client_id, client_metric_id, value, unit, period_start, period_end, vault_object_id, status")
      .eq("id", candidateId)
      .maybeSingle();

    if (candidateError) throw new Error(candidateError.message);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    await assertStaffCanAccessClient(candidate.client_id);

    if (candidate.status !== "pending_review") {
      return NextResponse.json(
        { error: "This candidate has already been reviewed." },
        { status: 409 },
      );
    }

    if (decision === "reject") {
      const { error } = await admin
        .from("metric_observation_candidates")
        .update({
          status: "rejected",
          review_note: reviewNote,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", candidate.id)
        .eq("status", "pending_review");
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    if (!candidate.client_metric_id) {
      return NextResponse.json(
        { error: "Map this proposal to a client metric before approving it." },
        { status: 422 },
      );
    }

    const { data: metric, error: metricError } = await admin
      .from("client_metrics")
      .select("id, client_id, metric_definitions ( kind, unit, stock_flow )")
      .eq("id", candidate.client_metric_id)
      .maybeSingle();
    if (metricError) throw new Error(metricError.message);
    if (!metric || metric.client_id !== candidate.client_id) {
      return NextResponse.json({ error: "Candidate metric is not valid." }, { status: 422 });
    }

    const target = metric as CandidateMetricRow;
    const definition = Array.isArray(target.metric_definitions)
      ? (target.metric_definitions[0] ?? null)
      : target.metric_definitions;
    if (!definition) {
      return NextResponse.json({ error: "Metric definition not found." }, { status: 422 });
    }
    if (candidate.unit && candidate.unit !== definition.unit) {
      return NextResponse.json(
        {
          error: `Candidate unit (${candidate.unit}) does not match the metric unit (${definition.unit}).`,
        },
        { status: 422 },
      );
    }

    const validation = validateObservationInput(
      {
        kind: definition.kind,
        unit: definition.unit,
        stock_flow: definition.stock_flow ?? null,
      },
      {
        value: String(candidate.value),
        periodStart: candidate.period_start,
        periodEnd: candidate.period_end,
        sourceDocument: `vault:${candidate.vault_object_id};cand:${candidate.id}`,
      },
    );
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors.join(" ") }, { status: 422 });
    }

    const { error: noteError } = await admin
      .from("metric_observation_candidates")
      .update({ review_note: reviewNote })
      .eq("id", candidate.id)
      .eq("status", "pending_review");
    if (noteError) throw new Error(noteError.message);

    const { error: approvalError } = await admin.rpc(
      "approve_metric_observation_candidate",
      { p_candidate_id: candidate.id, p_reviewer_id: user.id },
    );
    if (approvalError) throw new Error(approvalError.message);

    return NextResponse.json({ ok: true, status: "approved" });
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Staff candidate review failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
