import { NextResponse } from "next/server";
import { fetchAccessBrokerHealth } from "@/lib/access-broker-status";
import { StaffApiHttpError } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const health = await fetchAccessBrokerHealth();
    return NextResponse.json(health);
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "AccessBroker status unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
