import { NextResponse } from "next/server";
import { requireStaffApiUser, StaffApiAuthError } from "@/lib/auth/staff-api";
import { probeLlmStatus } from "@/lib/llm/llm-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStaffApiUser();
  } catch (error) {
    if (error instanceof StaffApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const status = await probeLlmStatus();
  return NextResponse.json(status);
}
