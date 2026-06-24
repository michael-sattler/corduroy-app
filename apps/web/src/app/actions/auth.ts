"use server";

import { isStaffEmail, readUserRole, roleForSurface } from "@/lib/auth/roles";
import { resolveAppHref } from "@/lib/surface-path";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
};

export async function signIn(
  surface: "client" | "staff",
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  const user = data.user;
  const role = readUserRole(user.app_metadata);
  const expectedRole = roleForSurface(surface);

  if (role !== expectedRole) {
    await supabase.auth.signOut();
    return {
      error:
        surface === "client"
          ? "This account cannot access the client portal."
          : "This account cannot access the staff console.",
    };
  }

  if (surface === "staff") {
    if (!isStaffEmail(email)) {
      await supabase.auth.signOut();
      return {
        error: "Staff sign-in is limited to @corduroytech.ai accounts.",
      };
    }

    const { data: staffRow, error: staffError } = await supabase
      .from("staff")
      .select("approved")
      .eq("user_id", user.id)
      .maybeSingle();

    if (staffError || !staffRow?.approved) {
      await supabase.auth.signOut();
      return { error: "Your staff account is pending approval." };
    }
  }

  redirect(await resolveAppHref("/dashboard", surface));
}

export async function signOut(surface: "client" | "staff") {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(await resolveAppHref("/login", surface));
}
