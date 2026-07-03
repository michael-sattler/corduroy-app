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

  const { data: profile } = await supabase
    .from("client_users")
    .select("display_name, avatar_path, avatar_updated_at, clients(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  const clientsJoin = profile?.clients as
    | { name: string }
    | { name: string }[]
    | null
    | undefined;
  const organization = Array.isArray(clientsJoin)
    ? (clientsJoin[0]?.name ?? "Your organization")
    : (clientsJoin?.name ?? "Your organization");

  return {
    surface: "client",
    user,
    displayName:
      profile?.display_name ??
      (user.user_metadata?.display_name as string | undefined) ??
      user.email ??
      "Client",
    organization,
    avatarPath: profile?.avatar_path ?? null,
    avatarUpdatedAt: profile?.avatar_updated_at ?? null,
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

  const { data: staff } = await supabase
    .from("staff")
    .select("role, avatar_path, avatar_updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    surface: "staff",
    user,
    displayName:
      (user.user_metadata?.display_name as string | undefined) ??
      user.email ??
      "Staff",
    role: staff?.role ?? (user.app_metadata?.staff_role as string) ?? "staff",
    avatarPath: staff?.avatar_path ?? null,
    avatarUpdatedAt: staff?.avatar_updated_at ?? null,
  };
}

function notFoundForSurface(): never {
  notFound();
}
