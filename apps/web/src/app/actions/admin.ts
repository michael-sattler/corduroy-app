"use server";

import { revalidatePath } from "next/cache";
import { isStaffEmail } from "@/lib/auth/roles";
import { requireStaffSession } from "@/lib/auth/session";
import { buildClientImpersonateUrl, buildStaffReturnUrl } from "@/lib/masquerade";
import { createImpersonationToken } from "@/lib/impersonation";
import { getSurfacePathPrefix } from "@/lib/surface-path";
import { createClient } from "@/lib/supabase/server";
import { savePlatformImage } from "@/lib/platform-images";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { validateObservationInput } from "@/lib/metrics/observation-rules";
import {
  METRIC_FAMILIES,
  METRIC_KINDS,
  METRIC_STOCK_FLOWS,
  METRIC_TIERS,
  METRIC_UNITS,
  METRIC_UPDATE_INTERVALS,
  METRIC_WIDGET_TYPES,
  type MetricDefinitionInput,
} from "@/lib/metric-catalog-types";

function readUploadFile(formData: FormData): File {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Choose an image file to upload.");
  }
  return file;
}

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
  revalidatePath("/dashboard");
  return client;
}

export async function createStaffManagedClientAction(name: string) {
  const { user } = await requireStaffSession();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Organization name is required");
  }

  const admin = createServiceRoleClient();

  const { data: staffRow, error: staffError } = await admin
    .from("staff")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError) throw new Error(staffError.message);
  if (!staffRow) throw new Error("Staff profile not found");

  const { data: client, error: clientError } = await admin
    .from("clients")
    .insert({ name: trimmed })
    .select("id, name, created_at")
    .single();

  if (clientError) throw new Error(clientError.message);

  const { error: assignmentError } = await admin
    .from("staff_assignments")
    .insert({
      staff_id: staffRow.id,
      client_id: client.id,
    });

  if (assignmentError) throw new Error(assignmentError.message);

  revalidatePath("/admin/clients");
  revalidatePath("/dashboard");

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
  revalidatePath("/dashboard");
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
  revalidatePath("/dashboard");
}

export async function uploadClientLogoAction(
  clientId: string,
  formData: FormData,
): Promise<{ path: string; version: string }> {
  await requireStaffSession();

  const file = readUploadFile(formData);
  const saved = await savePlatformImage("client-logo", clientId, file);

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("clients")
    .update({
      logo_path: saved.path,
      logo_updated_at: saved.updatedAt,
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard");

  return { path: saved.path, version: saved.updatedAt };
}

export async function uploadPortalUserAvatarAction(
  clientId: string,
  clientUserId: string,
  formData: FormData,
): Promise<{ path: string; version: string }> {
  await requireStaffSession();

  const file = readUploadFile(formData);
  const admin = createServiceRoleClient();

  const { data: profile, error: profileError } = await admin
    .from("client_users")
    .select("id, client_id")
    .eq("id", clientUserId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("Portal user not found");
  if (profile.client_id !== clientId) {
    throw new Error("Portal user does not belong to this organization");
  }

  const saved = await savePlatformImage("portal-avatar", clientUserId, file);

  const { error } = await admin
    .from("client_users")
    .update({
      avatar_path: saved.path,
      avatar_updated_at: saved.updatedAt,
    })
    .eq("id", clientUserId);

  if (error) {
    if (error.message.includes("avatar_")) {
      throw new Error(
        "Avatar columns are missing. Run migration 20260625160000_platform_image_assets.sql in Supabase.",
      );
    }
    throw new Error(error.message);
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard");

  return { path: saved.path, version: saved.updatedAt };
}

export async function uploadStaffAvatarAction(
  staffId: string,
  formData: FormData,
): Promise<{ path: string; version: string }> {
  await requireStaffSession();

  const file = readUploadFile(formData);
  const admin = createServiceRoleClient();

  const { data: staffRow, error: staffError } = await admin
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .maybeSingle();

  if (staffError) throw new Error(staffError.message);
  if (!staffRow) throw new Error("Staff user not found");

  const saved = await savePlatformImage("staff-avatar", staffId, file);

  const { error } = await admin
    .from("staff")
    .update({
      avatar_path: saved.path,
      avatar_updated_at: saved.updatedAt,
    })
    .eq("id", staffId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/staff");

  return { path: saved.path, version: saved.updatedAt };
}

function assertMetricEnum(
  allowed: readonly string[],
  value: string,
  field: string,
): void {
  if (!allowed.includes(value)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
}

function normalizeMetricInput(data: MetricDefinitionInput) {
  const metric_key = data.metric_key.trim();
  const label = data.label.trim();

  if (!metric_key) throw new Error("Metric key is required");
  if (!/^[a-z0-9_]+$/.test(metric_key)) {
    throw new Error(
      "Metric key must use only lowercase letters, numbers, and underscores",
    );
  }
  if (!label) throw new Error("Label is required");

  assertMetricEnum(METRIC_TIERS, data.tier, "tier");
  assertMetricEnum(METRIC_KINDS, data.kind, "kind");
  assertMetricEnum(METRIC_UNITS, data.unit, "unit");
  assertMetricEnum(METRIC_WIDGET_TYPES, data.widget_type, "widget type");
  assertMetricEnum(
    METRIC_UPDATE_INTERVALS,
    data.update_interval,
    "update interval",
  );

  // family is optional; the core catalog groups by category instead.
  const family =
    typeof data.family === "string" && data.family.trim()
      ? data.family.trim()
      : null;
  if (family) assertMetricEnum(METRIC_FAMILIES, family, "family");

  // category is free text (suggested vocabulary offered in the UI).
  const category =
    typeof data.category === "string" && data.category.trim()
      ? data.category.trim()
      : null;

  // stock_flow only applies to observed metrics.
  let stock_flow =
    typeof data.stock_flow === "string" && data.stock_flow.trim()
      ? data.stock_flow.trim()
      : null;
  if (stock_flow) assertMetricEnum(METRIC_STOCK_FLOWS, stock_flow, "stock/flow");
  if (data.kind !== "observed") stock_flow = null;

  const description =
    typeof data.description === "string" ? data.description.trim() : "";

  // formula_expression only makes sense for derived/ratio metrics.
  let formula_expression =
    typeof data.formula_expression === "string" && data.formula_expression.trim()
      ? data.formula_expression.trim()
      : null;
  if (data.kind === "observed") formula_expression = null;

  const client_id =
    typeof data.client_id === "string" && data.client_id.trim()
      ? data.client_id.trim()
      : null;

  // Schema guardrail: benchmarkable is only permitted for library metrics.
  const benchmarkable = client_id === null ? Boolean(data.benchmarkable) : false;

  const applicable_ccps = Array.isArray(data.applicable_ccps)
    ? data.applicable_ccps.filter((n) => Number.isInteger(n))
    : [];

  return {
    client_id,
    metric_key,
    label,
    family,
    category,
    stock_flow,
    description,
    formula_expression,
    tier: data.tier,
    kind: data.kind,
    unit: data.unit,
    widget_type: data.widget_type,
    update_interval: data.update_interval,
    applicable_ccps,
    benchmarkable,
    needs_review: Boolean(data.needs_review),
  };
}

export async function createMetricDefinitionAction(
  data: MetricDefinitionInput,
): Promise<{ id: string }> {
  await requireStaffSession();
  const values = normalizeMetricInput(data);

  const admin = createServiceRoleClient();
  const { data: row, error } = await admin
    .from("metric_definitions")
    .insert(values)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/metrics");
  return { id: row.id };
}

export async function updateMetricDefinitionAction(
  id: string,
  data: MetricDefinitionInput,
): Promise<void> {
  await requireStaffSession();
  const values = normalizeMetricInput(data);

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("metric_definitions")
    .update(values)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/metrics");
}

export async function deleteMetricDefinitionAction(id: string): Promise<void> {
  await requireStaffSession();

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("metric_definitions")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/metrics");
}

type ObservationTargetRow = {
  id: string;
  client_id: string;
  metric_definitions:
    | { kind: string; unit: string; stock_flow: string | null }
    | { kind: string; unit: string; stock_flow: string | null }[]
    | null;
};

export type RecordMetricObservationInput = {
  clientMetricId: string;
  value: string;
  periodStart: string;
  periodEnd: string;
  sourceDocument: string;
};

/**
 * Manually record a metric observation (staff advisor path). The observation
 * table is append-only; an insert trigger folds the reading into
 * client_metrics.current_value. Business rules live in the shared, pure
 * observation-rules module so the coming LLM ingestion layer reuses them.
 */
export async function recordMetricObservationAction(
  input: RecordMetricObservationInput,
): Promise<void> {
  await requireStaffSession();

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("client_metrics")
    .select("id, client_id, metric_definitions ( kind, unit, stock_flow )")
    .eq("id", input.clientMetricId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Metric not found for this client");

  const target = data as ObservationTargetRow;

  // Enforce per-client staff authorization, not just the staff surface.
  await assertStaffCanAccessClient(target.client_id);

  const definition = Array.isArray(target.metric_definitions)
    ? (target.metric_definitions[0] ?? null)
    : target.metric_definitions;
  if (!definition) throw new Error("Metric definition not found");

  const result = validateObservationInput(
    {
      kind: definition.kind,
      unit: definition.unit,
      stock_flow: definition.stock_flow ?? null,
    },
    {
      value: input.value,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      sourceDocument: input.sourceDocument,
    },
  );

  if (!result.ok) {
    throw new Error(result.errors.join(" "));
  }

  const { value, periodStart, periodEnd, observedOn, sourceDocument } =
    result.observation;

  const { error: insertError } = await admin
    .from("metric_observations")
    .insert({
      client_metric_id: input.clientMetricId,
      value,
      dimension: {},
      observed_on: observedOn,
      period_start: periodStart,
      period_end: periodEnd,
      change_source: "manual_advisor",
      source_document: sourceDocument,
    });

  if (insertError) throw new Error(insertError.message);
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
