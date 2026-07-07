import { requireSurface } from "@/lib/require-surface";
import { resolveAppHref } from "@/lib/surface-path";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";

export type ClientContext = {
  surface: "client";
  user: User;
  displayName: string;
  organization: string;
  organizationLogoPath: string | null;
  organizationLogoUpdatedAt: string | null;
  avatarPath: string | null;
  avatarUpdatedAt: string | null;
};

export type StaffContext = {
  surface: "staff";
  user: User;
  displayName: string;
  role: string;
  avatarPath: string | null;
  avatarUpdatedAt: string | null;
};

export async function requireClientSession(): Promise<ClientContext> {
  const surface = await requireSurface();
  if (surface !== "client") {
    notFoundForSurface();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(await resolveAppHref("/login", "client"));
  }

  const { data: profile, error: profileError } = await supabase
    .from("client_users")
    .select(
      "display_name, avatar_path, avatar_updated_at, clients(name, logo_path, logo_updated_at)",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  let resolvedProfile = profile;
  if (
    profileError?.message.includes("avatar_") ||
    profileError?.message.includes("logo_")
  ) {
    const { data: fallbackProfile } = await supabase
      .from("client_users")
      .select("display_name, clients(name)")
      .eq("user_id", user.id)
      .maybeSingle();
    resolvedProfile = fallbackProfile
      ? ({
          ...fallbackProfile,
          avatar_path: null,
          avatar_updated_at: null,
        } as NonNullable<typeof profile>)
      : null;
  }

  const clientsJoin = resolvedProfile?.clients as
    | { name: string; logo_path?: string | null; logo_updated_at?: string | null }
    | { name: string; logo_path?: string | null; logo_updated_at?: string | null }[]
    | null
    | undefined;
  const clientRecord = Array.isArray(clientsJoin) ? clientsJoin[0] : clientsJoin;
  const organization = clientRecord?.name ?? "Your organization";

  return {
    surface: "client",
    user,
    displayName:
      resolvedProfile?.display_name ??
      (user.user_metadata?.display_name as string | undefined) ??
      user.email ??
      "Client",
    organization,
    organizationLogoPath: clientRecord?.logo_path ?? null,
    organizationLogoUpdatedAt: clientRecord?.logo_updated_at ?? null,
    avatarPath: resolvedProfile?.avatar_path ?? null,
    avatarUpdatedAt: resolvedProfile?.avatar_updated_at ?? null,
  };
}

export async function requireStaffSession(): Promise<StaffContext> {
  const surface = await requireSurface();
  if (surface !== "staff") {
    notFoundForSurface();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(await resolveAppHref("/login", "staff"));
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("role, avatar_path, avatar_updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  let resolvedStaff = staff;
  if (staffError?.message.includes("avatar_")) {
    const { data: fallbackStaff } = await supabase
      .from("staff")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    resolvedStaff = fallbackStaff
      ? { ...fallbackStaff, avatar_path: null, avatar_updated_at: null }
      : null;
  }

  return {
    surface: "staff",
    user,
    displayName:
      (user.user_metadata?.display_name as string | undefined) ??
      user.email ??
      "Staff",
    role: resolvedStaff?.role ?? (user.app_metadata?.staff_role as string) ?? "staff",
    avatarPath: resolvedStaff?.avatar_path ?? null,
    avatarUpdatedAt: resolvedStaff?.avatar_updated_at ?? null,
  };
}

function notFoundForSurface(): never {
  notFound();
}
