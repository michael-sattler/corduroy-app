"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClientMessagingError,
  fetchClientMessages,
  sendClientMessage,
} from "@/lib/messaging/client-messaging-client";
import type { ClientMessage } from "@/lib/messaging/client-messaging-types";

const POLL_INTERVAL_MS = 12_000;

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ClientMessagingPanel() {
  const threadRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(
    async (signal?: AbortSignal, options?: { quiet?: boolean }) => {
      if (!options?.quiet) {
        setIsLoading(true);
      }
      try {
        const next = await fetchClientMessages("client", null, signal);
        setMessages(next);
        setError(null);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        if (!options?.quiet) {
          setError(
            caught instanceof ClientMessagingError
              ? caught.message
              : "Could not load messages.",
          );
        }
      } finally {
        if (!options?.quiet) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadMessages(controller.signal);
    return () => controller.abort();
  }, [loadMessages]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadMessages(undefined, { quiet: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [messages, isSending]);

  const sendMessage = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) {
      return;
    }

    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const created = await sendClientMessage("client", null, trimmed);
      setMessages((current) =>
        current.some((message) => message.id === created.id)
          ? current
          : [...current, created],
      );
    } catch (caught) {
      setDraft(trimmed);
      setError(
        caught instanceof ClientMessagingError
          ? caught.message
          : "Message could not be sent. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending]);

  const canSend = draft.trim().length > 0 && !isSending;

  return (
    <div className="app-card client-msg-card">
      <div className="staff-llm-dialogue-shell client-msg-shell">
        <header className="staff-llm-dialogue-header">
          <div className="min-w-0">
            <div className="staff-llm-dialogue-title">Message your Corduroy team</div>
            <div className="staff-llm-dialogue-subtitle">
              We&apos;ll reply here — check back anytime.
            </div>
          </div>
        </header>

        <div className="staff-llm-dialogue-thread" ref={threadRef}>
          {isLoading && messages.length === 0 ? (
            <div className="staff-msg-empty">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="staff-msg-empty">
              No messages yet. Send a note to your Corduroy team.
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_role === "client";
              return (
                <div
                  key={message.id}
                  className={`staff-llm-message staff-llm-message-${
                    isOwn ? "user" : "assistant"
                  }`}
                >
                  <div className="staff-llm-message-label">
                    {message.sender_name || (isOwn ? "You" : "Corduroy")}
                    <span className="staff-msg-time">
                      {formatTimestamp(message.created_at)}
                    </span>
                  </div>
                  <div className="staff-llm-message-bubble">{message.body}</div>
                </div>
              );
            })
          )}

          {error ? (
            <div className="staff-llm-dialogue-error" role="alert">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="staff-llm-dialogue-composer">
          <form
            className="staff-llm-composer-box"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <textarea
              className="staff-llm-composer-input"
              rows={2}
              placeholder="Write a message to your Corduroy team…"
              aria-label="Message your Corduroy team"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={!canSend}
            >
              {isSending ? "…" : "Send"}
            </button>
          </form>
          <div className="staff-llm-dialogue-footnote">
            Enter to send · Shift+Enter for a new line
          </div>
        </footer>
      </div>
    </div>
  );
}
