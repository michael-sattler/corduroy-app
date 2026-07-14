"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClientMessagingError,
  fetchClientMessages,
  sendClientMessage,
} from "@/lib/messaging/client-messaging-client";
import type { ClientMessage } from "@/lib/messaging/client-messaging-types";
import type { MessagingContact } from "@/lib/messaging/messaging-contact";

const STORAGE_KEY = "corduroy.staff-messages-width";
export const STAFF_MESSAGES_DEFAULT_WIDTH = 300;
export const STAFF_MESSAGES_MIN_WIDTH = 240;
export const STAFF_MESSAGES_MAX_WIDTH = 520;
export const STAFF_MESSAGES_WIDE_WIDTH = 480;

const POLL_INTERVAL_MS = 12_000;

function clampWidth(width: number): number {
  return Math.min(
    STAFF_MESSAGES_MAX_WIDTH,
    Math.max(STAFF_MESSAGES_MIN_WIDTH, width),
  );
}

function readStoredWidth(storageKey: string): number {
  if (typeof window === "undefined") {
    return STAFF_MESSAGES_DEFAULT_WIDTH;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    return STAFF_MESSAGES_DEFAULT_WIDTH;
  }

  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed) ? clampWidth(parsed) : STAFF_MESSAGES_DEFAULT_WIDTH;
}

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

type MessagingSurface = "staff" | "client";

type StaffClientMessagingSidebarProps = {
  width: number;
  onWidthChange: (width: number) => void;
  clientId?: string | null;
  clientName?: string | null;
  /** Which portal endpoints to talk to. Defaults to the staff console. */
  surface?: MessagingSurface;
  /** Pane heading. */
  title?: string;
  /** Header subtitle. When omitted, falls back to staff client-selection copy. */
  subtitle?: string;
  /** Composer placeholder text. */
  placeholder?: string;
  /** Accessible label for the pane. */
  ariaLabel?: string;
  /** Accessible label for the composer textarea. */
  composerAriaLabel?: string;
  /** Label used for the other party when a message has no sender name. */
  counterpartLabel?: string;
  /** Copy shown when the thread has no messages yet. */
  emptyLabel?: string;
  /** Optional contact rendered as a chip in the pane header. */
  contact?: MessagingContact | null;
  /** localStorage key used to persist the pane width. */
  storageKey?: string;
};

export function StaffClientMessagingSidebar({
  width,
  onWidthChange,
  clientId,
  clientName,
  surface = "staff",
  title = "Messages",
  subtitle,
  placeholder,
  ariaLabel = "Client messages",
  composerAriaLabel = "Message the client",
  counterpartLabel = "Client",
  emptyLabel,
  contact = null,
  storageKey = STORAGE_KEY,
}: StaffClientMessagingSidebarProps) {
  const isStaff = surface === "staff";
  // Staff must pick a client first; the client portal always talks to the
  // logged-in client's own thread, so it is enabled unconditionally.
  const enabled = isStaff ? Boolean(clientId) : true;
  const threadRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(
    async (signal?: AbortSignal, options?: { quiet?: boolean }) => {
      if (isStaff && !clientId) {
        setMessages([]);
        return;
      }

      if (!options?.quiet) {
        setIsLoading(true);
      }

      try {
        const next = await fetchClientMessages(surface, clientId ?? null, signal);
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
    [isStaff, surface, clientId],
  );

  useEffect(() => {
    setMessages([]);
    setError(null);
    const controller = new AbortController();
    void loadMessages(controller.signal);
    return () => controller.abort();
  }, [loadMessages]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const interval = window.setInterval(() => {
      void loadMessages(undefined, { quiet: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [enabled, loadMessages]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [messages, isSending]);

  const sendMessage = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSending || !enabled) {
      return;
    }

    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const created = await sendClientMessage(surface, clientId ?? null, trimmed);
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
  }, [draft, isSending, enabled, surface, clientId]);

  const canSend = draft.trim().length > 0 && !isSending && enabled;

  const setWidth = useCallback(
    (nextWidth: number) => {
      const clamped = clampWidth(nextWidth);
      onWidthChange(clamped);
      window.localStorage.setItem(storageKey, String(clamped));
    },
    [onWidthChange, storageKey],
  );

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing]);

  function startResize(clientX: number) {
    const startX = clientX;
    const startWidth = width;
    setIsResizing(true);

    function onPointerMove(event: PointerEvent) {
      const delta = startX - event.clientX;
      setWidth(startWidth + delta);
    }

    function onPointerUp() {
      setIsResizing(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  const isWide = width >= STAFF_MESSAGES_WIDE_WIDTH - 16;

  return (
    <aside
      className={`staff-llm-dialogue-sidebar staff-msg-sidebar${isResizing ? " is-resizing" : ""}`}
      aria-label={ariaLabel}
    >
      <div
        className="staff-llm-dialogue-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={width}
        aria-valuemin={STAFF_MESSAGES_MIN_WIDTH}
        aria-valuemax={STAFF_MESSAGES_MAX_WIDTH}
        title="Drag to resize messages pane"
        onPointerDown={(event) => {
          event.preventDefault();
          startResize(event.clientX);
        }}
        onDoubleClick={() => {
          setWidth(
            isWide ? STAFF_MESSAGES_DEFAULT_WIDTH : STAFF_MESSAGES_WIDE_WIDTH,
          );
        }}
      />

      <div className="staff-llm-dialogue-shell staff-msg-shell">
        <header className="staff-llm-dialogue-header">
          <div className="min-w-0">
            <div className="staff-llm-dialogue-title">{title}</div>
            <div className="staff-llm-dialogue-subtitle text-truncate">
              {subtitle ??
                (clientName
                  ? `Direct thread with ${clientName}`
                  : "Select a client to message")}
            </div>
          </div>
          <div className="staff-llm-dialogue-width-controls">
            <button
              type="button"
              className={`staff-llm-width-btn${!isWide ? " active" : ""}`}
              onClick={() => setWidth(STAFF_MESSAGES_DEFAULT_WIDTH)}
              title="Default width"
            >
              Std
            </button>
            <button
              type="button"
              className={`staff-llm-width-btn${isWide ? " active" : ""}`}
              onClick={() => setWidth(STAFF_MESSAGES_WIDE_WIDTH)}
              title="Wide width"
            >
              Wide
            </button>
          </div>
        </header>

        {contact ? (
          <div className="staff-msg-contact-chip" title={contact.displayName}>
            {contact.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.avatarUrl}
                alt=""
                className="staff-msg-contact-avatar"
              />
            ) : (
              <span className="staff-msg-contact-avatar staff-msg-contact-avatar-fallback">
                {contact.displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="staff-msg-contact-name text-truncate">
              {contact.displayName}
            </span>
          </div>
        ) : null}

        <div className="staff-llm-dialogue-thread" ref={threadRef}>
          {!enabled ? (
            <div className="staff-msg-empty">
              Select a client from the list to start a conversation.
            </div>
          ) : isLoading && messages.length === 0 ? (
            <div className="staff-msg-empty">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="staff-msg-empty">
              {emptyLabel ??
                `No messages yet. Say hello to ${clientName ?? "your client"}.`}
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_role === surface;
              return (
                <div
                  key={message.id}
                  className={`staff-llm-message staff-llm-message-${
                    isOwn ? "user" : "assistant"
                  }`}
                >
                  <div className="staff-llm-message-label">
                    {message.sender_name || (isOwn ? "You" : counterpartLabel)}
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
              placeholder={
                placeholder ??
                (enabled
                  ? "Write a message to the client…"
                  : "Select a client to message")
              }
              aria-label={composerAriaLabel}
              value={draft}
              disabled={!enabled}
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
              className="btn btn-sm btn-primary plan-send-btn"
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
    </aside>
  );
}

export function useStaffMessagesWidth(
  storageKey: string = STORAGE_KEY,
): [number, (width: number) => void] {
  const [width, setWidth] = useState(STAFF_MESSAGES_DEFAULT_WIDTH);

  useEffect(() => {
    setWidth(readStoredWidth(storageKey));
  }, [storageKey]);

  return [width, setWidth];
}
