import type {
  ClientMessage,
  ClientMessagesResponse,
  SendClientMessageResponse,
} from "@/lib/messaging/client-messaging-types";

export class ClientMessagingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ClientMessagingError";
    this.cause = options?.cause;
  }
}

type Surface = "staff" | "client";

function endpoint(surface: Surface): string {
  return surface === "staff" ? "/api/staff/messages" : "/api/client/messages";
}

async function parseError(res: Response): Promise<string> {
  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  return payload.error ?? `Request failed (${res.status})`;
}

export async function fetchClientMessages(
  surface: Surface,
  clientId: string | null,
  signal?: AbortSignal,
): Promise<ClientMessage[]> {
  const url = new URL(endpoint(surface), window.location.origin);
  if (surface === "staff") {
    if (!clientId) {
      return [];
    }
    url.searchParams.set("client_id", clientId);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ClientMessagingError("Could not reach the messaging service", {
      cause: error,
    });
  }

  if (!res.ok) {
    throw new ClientMessagingError(await parseError(res));
  }

  const payload = (await res.json()) as ClientMessagesResponse;
  return payload.messages ?? [];
}

export async function sendClientMessage(
  surface: Surface,
  clientId: string | null,
  body: string,
  signal?: AbortSignal,
): Promise<ClientMessage> {
  let res: Response;
  try {
    res = await fetch(endpoint(surface), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        surface === "staff" ? { client_id: clientId, body } : { body },
      ),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ClientMessagingError("Could not reach the messaging service", {
      cause: error,
    });
  }

  if (!res.ok) {
    throw new ClientMessagingError(await parseError(res));
  }

  const payload = (await res.json()) as SendClientMessageResponse;
  return payload.message;
}
