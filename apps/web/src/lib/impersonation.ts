import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 5 * 60;
const COOKIE_NAME = "corduroy_masquerade";

export type ImpersonationTokenPayload = {
  clientUserId: string;
  clientId: string;
  staffUserId: string;
  staffEmail: string;
  staffDisplayName: string;
  staffReturnUrl: string;
  exp: number;
};

export type MasqueradeSession = {
  clientDisplayName: string;
  clientEmail: string;
  staffDisplayName: string;
  staffReturnUrl: string;
};

function signingSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for impersonation");
  }
  return secret;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createImpersonationToken(
  payload: Omit<ImpersonationTokenPayload, "exp">,
): string {
  const body: ImpersonationTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encoded = encodeBase64Url(JSON.stringify(body));
  const signature = createHmac("sha256", signingSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyImpersonationToken(
  token: string,
): ImpersonationTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = createHmac("sha256", signingSecret())
    .update(encoded)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encoded),
    ) as ImpersonationTokenPayload;

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function masqueradeCookieName(): string {
  return COOKIE_NAME;
}

export function serializeMasqueradeSession(session: MasqueradeSession): string {
  return encodeBase64Url(JSON.stringify(session));
}

export function parseMasqueradeSession(
  value: string | undefined,
): MasqueradeSession | null {
  if (!value) return null;

  try {
    return JSON.parse(decodeBase64Url(value)) as MasqueradeSession;
  } catch {
    return null;
  }
}
