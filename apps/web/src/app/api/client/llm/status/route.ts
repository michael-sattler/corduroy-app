import { NextResponse } from "next/server";
import { probeLlmStatus } from "@/lib/llm/llm-provider";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await probeLlmStatus();
  return NextResponse.json(status);
}
