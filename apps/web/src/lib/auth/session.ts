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
};

export type StaffContext = {
  surface: "staff";
  user: User;
  displayName: string;
  role: string;
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
    redirect(await resolveAppHref("/login"));
  }

  const { data: profile } = await supabase
    .from("client_users")
    .select("display_name, clients(name)")
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
    redirect(await resolveAppHref("/login"));
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
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
  };
}

function notFoundForSurface(): never {
  notFound();
}
