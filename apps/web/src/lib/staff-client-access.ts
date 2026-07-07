import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function assertStaffCanAccessClient(clientId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Client access check failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Client not found or not assigned to you");
  }
}
