import "server-only";

import { platformImageUrl } from "@/lib/platform-images";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type MessagingContact = {
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Resolves a display name + avatar for an arbitrary auth user id so it can be
 * shown as a contact chip in a messaging pane. Works for both staff and client
 * portal users; returns null when the service-role client is unavailable.
 */
export async function getMessagingContact(
  userId: string,
): Promise<MessagingContact | null> {
  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return null;
  }

  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const authUser = authData?.user ?? null;

  let avatarPath: string | null = null;
  let avatarUpdatedAt: string | null = null;
  let profileName: string | null = null;

  const { data: staffRow } = await admin
    .from("staff")
    .select("avatar_path, avatar_updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (staffRow) {
    avatarPath = staffRow.avatar_path ?? null;
    avatarUpdatedAt = staffRow.avatar_updated_at ?? null;
  } else {
    const { data: clientRow } = await admin
      .from("client_users")
      .select("display_name, avatar_path, avatar_updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (clientRow) {
      profileName = clientRow.display_name ?? null;
      avatarPath = clientRow.avatar_path ?? null;
      avatarUpdatedAt = clientRow.avatar_updated_at ?? null;
    }
  }

  const displayName =
    profileName ??
    (authUser?.user_metadata?.display_name as string | undefined) ??
    authUser?.email ??
    "Corduroy";

  return {
    displayName,
    avatarUrl: platformImageUrl(avatarPath, avatarUpdatedAt),
  };
}
