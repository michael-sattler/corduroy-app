"use server";

import { revalidatePath } from "next/cache";
import { requireClientSession, requireStaffSession } from "@/lib/auth/session";
import { savePlatformImage } from "@/lib/platform-images";
import { createClient } from "@/lib/supabase/server";

function readUploadFile(formData: FormData): File {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Choose an image file to upload.");
  }
  return file;
}

export async function uploadMyClientAvatarAction(
  formData: FormData,
): Promise<{ path: string; version: string }> {
  const { user } = await requireClientSession();
  const file = readUploadFile(formData);
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("client_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("Profile not found");

  const saved = await savePlatformImage("portal-avatar", profile.id, file);

  const { error } = await supabase
    .from("client_users")
    .update({
      avatar_path: saved.path,
      avatar_updated_at: saved.updatedAt,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");

  return { path: saved.path, version: saved.updatedAt };
}

export async function uploadMyStaffAvatarAction(
  formData: FormData,
): Promise<{ path: string; version: string }> {
  const { user } = await requireStaffSession();
  const file = readUploadFile(formData);
  const supabase = await createClient();

  const { data: staffRow, error: staffError } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError) throw new Error(staffError.message);
  if (!staffRow) throw new Error("Staff profile not found");

  const saved = await savePlatformImage("staff-avatar", staffRow.id, file);

  const { error } = await supabase
    .from("staff")
    .update({
      avatar_path: saved.path,
      avatar_updated_at: saved.updatedAt,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");

  return { path: saved.path, version: saved.updatedAt };
}
