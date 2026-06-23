"use client";

import { useActionState } from "react";
import {
  signIn,
  type AuthActionState,
} from "@/app/actions/auth";

type LoginFormProps = {
  surface: "client" | "staff";
  errorFromQuery?: string;
};

const initialState: AuthActionState = {};

export function LoginForm({ surface, errorFromQuery }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    signIn.bind(null, surface),
    initialState,
  );

  const error = state.error ?? errorFromQuery;
  const submitClass = surface === "client" ? "btn btn-warning" : "btn btn-dark";

  return (
    <form action={formAction} className="card shadow-sm" style={{ maxWidth: "28rem" }}>
      <div className="card-body p-4">
        {error ? (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        ) : null}
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            autoComplete="email"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-control"
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className={submitClass} disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
