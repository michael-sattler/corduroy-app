"use server";

import { revalidatePath } from "next/cache";
import { isStaffEmail } from "@/lib/auth/roles";
import { requireStaffSession } from "@/lib/auth/session";
import { buildClientImpersonateUrl, buildStaffReturnUrl } from "@/lib/masquerade";
import { createImpersonationToken } from "@/lib/impersonation";
import { getSurfacePathPrefix } from "@/lib/surface-path";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function updatePromptAction(
  id: string,
  data: { name: string; body: string },
) {
  const { user } = await requireStaffSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("prompt_library")
    .update({
      name: data.name,
      body: data.body,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/prompts");
}

export async function updateWaitlistEntryAction(
  id: string,
  data: { status: string; notes: string },
) {
  await requireStaffSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("waitlist_entries")
    .update({
      status: data.status.toLowerCase(),
      notes: data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/waitlist");
  revalidatePath(`/admin/waitlist/${id}`);
}

export async function createClientAction(name: string) {
  await requireStaffSession();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Organization name is required");
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("clients")
    .insert({ name: trimmed })
    .select("id, name, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/clients");
  return data;
}

export async function updateClientAction(
  clientId: string,
  data: { name: string },
) {
  await requireStaffSession();

  const trimmed = data.name.trim();
  if (!trimmed) {
    throw new Error("Organization name is required");
  }

  const admin = createServiceRoleClient();
  const { data: client, error } = await admin
    .from("clients")
    .update({ name: trimmed })
    .eq("id", clientId)
    .select("id, name, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  return client;
}

export async function createPortalUserAction(
  clientId: string,
  data: { email: string; password: string; displayName: string },
) {
  await requireStaffSession();

  const email = data.email.trim().toLowerCase();
  const displayName = data.displayName.trim();
  const password = data.password;

  if (!email) throw new Error("Email is required");
  if (!displayName) throw new Error("Display name is required");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const admin = createServiceRoleClient();

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) throw new Error(clientError.message);
  if (!client) throw new Error("Client organization not found");

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "client", client_id: clientId },
      user_metadata: { display_name: displayName },
    });

  if (authError) {
    throw new Error(authError.message);
  }

  const { error: profileError } = await admin.from("client_users").insert({
    user_id: authData.user.id,
    client_id: clientId,
    display_name: displayName,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
}

export async function createStaffUserAction(data: {
  email: string;
  password: string;
  displayName: string;
  role: string;
  approved: boolean;
}) {
  await requireStaffSession();

  const email = data.email.trim().toLowerCase();
  const displayName = data.displayName.trim();
  const password = data.password;
  const role = data.role as "principal" | "advisor" | "admin";

  if (!email) throw new Error("Email is required");
  if (!isStaffEmail(email)) {
    throw new Error("Staff accounts must use a @corduroytech.ai email");
  }
  if (!displayName) throw new Error("Display name is required");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (!["principal", "advisor", "admin"].includes(role)) {
    throw new Error("Invalid staff role");
  }

  const admin = createServiceRoleClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "staff", staff_role: role },
      user_metadata: { display_name: displayName },
    });

  if (authError) {
    throw new Error(authError.message);
  }

  const { error: staffError } = await admin.from("staff").insert({
    user_id: authData.user.id,
    role,
    approved: data.approved,
  });

  if (staffError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw new Error(staffError.message);
  }

  revalidatePath("/admin/staff");
}

export async function updateStaffUserAction(
  staffId: string,
  data: {
    email: string;
    displayName: string;
    password: string;
    role: string;
    approved: boolean;
  },
) {
  await requireStaffSession();

  const email = data.email.trim().toLowerCase();
  const displayName = data.displayName.trim();
  const role = data.role as "principal" | "advisor" | "admin";
  const password = data.password.trim();

  if (!email) throw new Error("Email is required");
  if (!isStaffEmail(email)) {
    throw new Error("Staff accounts must use a @corduroytech.ai email");
  }
  if (!displayName) throw new Error("Display name is required");
  if (!["principal", "advisor", "admin"].includes(role)) {
    throw new Error("Invalid staff role");
  }
  if (password && password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const admin = createServiceRoleClient();

  const { data: staffRow, error: staffLookupError } = await admin
    .from("staff")
    .select("user_id")
    .eq("id", staffId)
    .maybeSingle();

  if (staffLookupError) throw new Error(staffLookupError.message);
  if (!staffRow) throw new Error("Staff user not found");

  const { error: staffError } = await admin
    .from("staff")
    .update({ role, approved: data.approved })
    .eq("id", staffId);

  if (staffError) throw new Error(staffError.message);

  const authUpdate: {
    email: string;
    user_metadata: { display_name: string };
    app_metadata: { role: string; staff_role: string };
    password?: string;
  } = {
    email,
    user_metadata: { display_name: displayName },
    app_metadata: { role: "staff", staff_role: role },
  };

  if (password) {
    authUpdate.password = password;
  }

  const { error: authError } = await admin.auth.admin.updateUserById(
    staffRow.user_id,
    authUpdate,
  );

  if (authError) throw new Error(authError.message);

  revalidatePath("/admin/staff");
}

export async function updatePortalUserAction(
  clientId: string,
  clientUserId: string,
  data: {
    email: string;
    displayName: string;
    password: string;
  },
) {
  await requireStaffSession();

  const email = data.email.trim().toLowerCase();
  const displayName = data.displayName.trim();
  const password = data.password.trim();

  if (!email) throw new Error("Email is required");
  if (!displayName) throw new Error("Display name is required");
  if (password && password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const admin = createServiceRoleClient();

  const { data: profile, error: profileLookupError } = await admin
    .from("client_users")
    .select("user_id, client_id")
    .eq("id", clientUserId)
    .maybeSingle();

  if (profileLookupError) throw new Error(profileLookupError.message);
  if (!profile) throw new Error("Portal user not found");
  if (profile.client_id !== clientId) {
    throw new Error("Portal user does not belong to this organization");
  }

  const { error: profileError } = await admin
    .from("client_users")
    .update({ display_name: displayName })
    .eq("id", clientUserId);

  if (profileError) throw new Error(profileError.message);

  const authUpdate: {
    email: string;
    user_metadata: { display_name: string };
    app_metadata: { role: string; client_id: string };
    password?: string;
  } = {
    email,
    user_metadata: { display_name: displayName },
    app_metadata: { role: "client", client_id: clientId },
  };

  if (password) {
    authUpdate.password = password;
  }

  const { error: authError } = await admin.auth.admin.updateUserById(
    profile.user_id,
    authUpdate,
  );

  if (authError) throw new Error(authError.message);

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
}

export async function startClientImpersonationAction(
  clientUserId: string,
  clientId: string,
): Promise<{ url: string }> {
  const { user, displayName } = await requireStaffSession();
  const pathPrefix = await getSurfacePathPrefix("staff");
  const admin = createServiceRoleClient();

  const { data: profile, error: profileError } = await admin
    .from("client_users")
    .select("id, user_id, client_id, display_name")
    .eq("id", clientUserId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("Portal user not found");
  if (profile.client_id !== clientId) {
    throw new Error("Portal user does not belong to this organization");
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(
    profile.user_id,
  );

  if (authError || !authUser.user) {
    throw new Error("Could not load portal user account");
  }

  const token = createImpersonationToken({
    clientUserId,
    clientId,
    staffUserId: user.id,
    staffEmail: user.email ?? "",
    staffDisplayName: displayName,
    staffReturnUrl: await buildStaffReturnUrl(clientId, pathPrefix),
  });

  const url = await buildClientImpersonateUrl(token);
  return { url };
}
