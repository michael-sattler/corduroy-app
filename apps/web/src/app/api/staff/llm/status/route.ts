import { NextResponse } from "next/server";
import { requireStaffApiUser, StaffApiAuthError } from "@/lib/auth/staff-api";
import type { StaffLlmStatusResponse } from "@/lib/llm/staff-llm-dialogue-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER = "anthropic";

export async function GET() {
  try {
    await requireStaffApiUser();
  } catch (error) {
    if (error instanceof StaffApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5-20250929";

  if (!apiKey) {
    const response: StaffLlmStatusResponse = {
      state: "preview",
      provider: PROVIDER,
      model: null,
      detail: "No provider key configured — running in preview stub mode.",
    };
    return NextResponse.json(response);
  }

  // Token-free reachability + auth probe.
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const response: StaffLlmStatusResponse = {
        state: "connected",
        provider: PROVIDER,
        model,
      };
      return NextResponse.json(response);
    }

    const response: StaffLlmStatusResponse = {
      state: "error",
      provider: PROVIDER,
      model,
      detail:
        res.status === 401
          ? "Provider rejected the API key (401)."
          : `Provider check failed (${res.status}).`,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: StaffLlmStatusResponse = {
      state: "error",
      provider: PROVIDER,
      model,
      detail:
        error instanceof Error && error.name === "TimeoutError"
          ? "Provider did not respond in time."
          : "Could not reach the provider.",
    };
    return NextResponse.json(response);
  }
}
