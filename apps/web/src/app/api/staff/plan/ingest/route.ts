import { NextResponse } from "next/server";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { ingestPlan } from "@/lib/plan/ingest-plan";
import { validatePlanDocument } from "@/lib/plan/validate-plan-document";
import type { PlanDocument } from "@/lib/plan/types";
import type { PlanIngestRequest } from "@/lib/plan-upload-types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type IngestBody = PlanIngestRequest & {
  document: PlanDocument;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IngestBody;

    if (!body.client_id?.trim()) {
      return NextResponse.json({ error: "client_id is required" }, { status: 400 });
    }

    if (!body.s3_key?.trim()) {
      return NextResponse.json({ error: "s3_key is required" }, { status: 400 });
    }

    if (!body.plan_id?.trim()) {
      return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
    }

    if (!body.document) {
      return NextResponse.json({ error: "document is required" }, { status: 400 });
    }

    const clientId = body.client_id.trim();
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const planDocument = validatePlanDocument(body.document);

    const result = await ingestPlan(
      {
        client_id: clientId,
        s3_key: body.s3_key.trim(),
        plan_id: body.plan_id.trim(),
        plan_title: body.plan_title?.trim() ?? planDocument.plan.title,
        size_bytes: body.size_bytes ?? 0,
      },
      planDocument,
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Plan ingest failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
