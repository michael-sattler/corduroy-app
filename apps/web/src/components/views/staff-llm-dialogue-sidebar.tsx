"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchStaffLlmStatus,
  requestStaffLlmDialogue,
  StaffLlmDialogueError,
} from "@/lib/llm/staff-llm-dialogue-client";
import type {
  StaffLlmConnectionState,
  StaffLlmMessage,
} from "@/lib/llm/staff-llm-dialogue-types";

const STORAGE_KEY = "corduroy.staff-llm-dialogue-width";
export const STAFF_LLM_DIALOGUE_DEFAULT_WIDTH = 300;
export const STAFF_LLM_DIALOGUE_MIN_WIDTH = 240;
export const STAFF_LLM_DIALOGUE_MAX_WIDTH = 520;
export const STAFF_LLM_DIALOGUE_WIDE_WIDTH = 480;

function clampWidth(width: number): number {
  return Math.min(
    STAFF_LLM_DIALOGUE_MAX_WIDTH,
    Math.max(STAFF_LLM_DIALOGUE_MIN_WIDTH, width),
  );
}

function readStoredWidth(): number {
  if (typeof window === "undefined") {
    return STAFF_LLM_DIALOGUE_DEFAULT_WIDTH;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return STAFF_LLM_DIALOGUE_DEFAULT_WIDTH;
  }

  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed)
    ? clampWidth(parsed)
    : STAFF_LLM_DIALOGUE_DEFAULT_WIDTH;
}

type StaffLlmDialogueSidebarProps = {
  width: number;
  onWidthChange: (width: number) => void;
  clientName?: string | null;
};

type DialogueEntry = StaffLlmMessage & { id: string };

const GREETING: DialogueEntry = {
  id: "greeting",
  role: "assistant",
  content:
    "I don't have any client context yet, but when I do I can help draft coach messages, summarize vault uploads, and suggest plan adjustments.",
};

let messageCounter = 0;
function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

type ConnectionState = StaffLlmConnectionState | "checking";

const CONNECTION_META: Record<
  ConnectionState,
  { label: string; title: string }
> = {
  checking: { label: "Checking…", title: "Checking assistant connection" },
  connected: { label: "Live", title: "Connected to the LLM provider" },
  preview: {
    label: "Preview",
    title: "No provider key configured — responses are placeholder stubs",
  },
  billing: {
    label: "Billing",
    title: "Credit balance too low — add credits in the Anthropic console",
  },
  error: { label: "Offline", title: "Could not reach the LLM provider" },
};

export function StaffLlmDialogueSidebar({
  width,
  onWidthChange,
  clientName,
}: StaffLlmDialogueSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const [messages, setMessages] = useState<DialogueEntry[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [connectionDetail, setConnectionDetail] = useState<string | null>(null);
  const [connectionModel, setConnectionModel] = useState<string | null>(null);

  const refreshConnection = useCallback(async (signal?: AbortSignal) => {
    setConnection("checking");
    try {
      const status = await fetchStaffLlmStatus(signal);
      setConnection(status.state);
      setConnectionDetail(status.detail ?? null);
      setConnectionModel(status.model);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return;
      }
      setConnection("error");
      setConnectionDetail("Could not reach the assistant status endpoint.");
      setConnectionModel(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshConnection(controller.signal);
    return () => controller.abort();
  }, [refreshConnection]);

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

    const userEntry: DialogueEntry = {
      id: nextMessageId(),
      role: "user",
      content: trimmed,
    };

    const history = [...messages, userEntry];
    setMessages(history);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const result = await requestStaffLlmDialogue({
        messages: history
          .filter((entry) => entry.id !== GREETING.id)
          .map(({ role, content }) => ({ role, content })),
        clientName: clientName ?? null,
      });

      setMessages((current) => [
        ...current,
        { id: nextMessageId(), role: "assistant", content: result.reply },
      ]);

      setConnection(result.live ? "connected" : "preview");
      setConnectionModel(result.live ? result.model : null);
      if (result.live) {
        setConnectionDetail(null);
      }
    } catch (caught) {
      const message =
        caught instanceof StaffLlmDialogueError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "The assistant could not respond. Please try again.";
      setError(message);

      if (caught instanceof StaffLlmDialogueError) {
        if (caught.code === "billing") {
          setConnection("billing");
          setConnectionDetail(caught.message);
          setConnectionModel(null);
        } else if (
          caught.code === "auth" ||
          caught.code === "model" ||
          caught.code === "provider"
        ) {
          setConnection("error");
          setConnectionDetail(caught.message);
          setConnectionModel(null);
        }
        // rate_limit / unknown: keep the current connection state.
      }
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, messages, clientName]);

  const canSend = draft.trim().length > 0 && !isSending;

  const setWidth = useCallback(
    (nextWidth: number) => {
      const clamped = clampWidth(nextWidth);
      onWidthChange(clamped);
      window.localStorage.setItem(STORAGE_KEY, String(clamped));
    },
    [onWidthChange],
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

  const isWide = width >= STAFF_LLM_DIALOGUE_WIDE_WIDTH - 16;

  return (
    <aside
      ref={asideRef}
      className={`staff-llm-dialogue-sidebar${isResizing ? " is-resizing" : ""}`}
      aria-label="Zophia dialogue"
    >
      <div
        className="staff-llm-dialogue-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={width}
        aria-valuemin={STAFF_LLM_DIALOGUE_MIN_WIDTH}
        aria-valuemax={STAFF_LLM_DIALOGUE_MAX_WIDTH}
        title="Drag to resize assistant pane"
        onPointerDown={(event) => {
          event.preventDefault();
          startResize(event.clientX);
        }}
        onDoubleClick={() => {
          setWidth(
            isWide
              ? STAFF_LLM_DIALOGUE_DEFAULT_WIDTH
              : STAFF_LLM_DIALOGUE_WIDE_WIDTH,
          );
        }}
      />

      <div className="staff-llm-dialogue-shell">
        <div
          className={`staff-llm-connection staff-llm-connection-${connection}`}
          title={connectionDetail ?? CONNECTION_META[connection].title}
          role="status"
          aria-live="polite"
        >
          <span className="staff-llm-connection-dot" aria-hidden="true" />
          <span className="staff-llm-connection-label">
            {CONNECTION_META[connection].label}
            {connection === "connected" && connectionModel
              ? ` · ${connectionModel}`
              : ""}
          </span>
          <button
            type="button"
            className="staff-llm-connection-refresh"
            onClick={() => void refreshConnection()}
            disabled={connection === "checking"}
            title="Re-check connection"
            aria-label="Re-check assistant connection"
          >
            ↻
          </button>
        </div>

        <header className="staff-llm-dialogue-header">
          <div className="min-w-0">
            <div className="staff-llm-dialogue-title">Zophia</div>
            <div className="staff-llm-dialogue-subtitle text-truncate">
              {clientName
                ? `Context: ${clientName}`
                : "Select a client for grounded responses"}
            </div>
          </div>
          <div className="staff-llm-dialogue-width-controls">
            <button
              type="button"
              className={`staff-llm-width-btn${!isWide ? " active" : ""}`}
              onClick={() => setWidth(STAFF_LLM_DIALOGUE_DEFAULT_WIDTH)}
              title="Default width"
            >
              Std
            </button>
            <button
              type="button"
              className={`staff-llm-width-btn${isWide ? " active" : ""}`}
              onClick={() => setWidth(STAFF_LLM_DIALOGUE_WIDE_WIDTH)}
              title="Wide width"
            >
              Wide
            </button>
          </div>
        </header>

        <div className="staff-llm-dialogue-thread" ref={threadRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`staff-llm-message staff-llm-message-${message.role}`}
            >
              <div className="staff-llm-message-label">
                {message.role === "assistant" ? "Zophia" : "You"}
              </div>
              <div className="staff-llm-message-bubble">{message.content}</div>
            </div>
          ))}

          {isSending ? (
            <div className="staff-llm-message staff-llm-message-assistant">
              <div className="staff-llm-message-label">Zophia</div>
              <div className="staff-llm-message-bubble staff-llm-message-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}

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
              placeholder="Ask about plan progress, draft coaching, or vault context…"
              aria-label="Message Zophia"
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
    </aside>
  );
}

export function useStaffLlmDialogueWidth(): [number, (width: number) => void] {
  const [width, setWidth] = useState(STAFF_LLM_DIALOGUE_DEFAULT_WIDTH);

  useEffect(() => {
    setWidth(readStoredWidth());
  }, []);

  return [width, setWidth];
}
