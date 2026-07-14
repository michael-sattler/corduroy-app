"use client";

import { type CSSProperties } from "react";
import { ClientDashboardView } from "@/components/views/client-dashboard-view";
import {
  StaffClientMessagingSidebar,
  useStaffMessagesWidth,
} from "@/components/views/staff-client-messaging-sidebar";
import {
  StaffLlmDialogueSidebar,
  useStaffLlmDialogueWidth,
} from "@/components/views/staff-llm-dialogue-sidebar";
import type { MessagingContact } from "@/lib/messaging/messaging-contact";

const ASSISTANT_WIDTH_KEY = "corduroy.client-dashboard-assistant-width";
const MESSAGES_WIDTH_KEY = "corduroy.client-dashboard-messages-width";

const ASSISTANT_GREETING =
  "Hi, I'm Zophia — your dashboard assistant. Ask me about your KPIs, goal progress, or how your initiatives are tracking.";

type ClientDashboardShellProps = {
  messagingContact?: MessagingContact | null;
};

export function ClientDashboardShell({
  messagingContact = null,
}: ClientDashboardShellProps) {
  const [assistantWidth, setAssistantWidth] =
    useStaffLlmDialogueWidth(ASSISTANT_WIDTH_KEY);
  const [messagesWidth, setMessagesWidth] =
    useStaffMessagesWidth(MESSAGES_WIDTH_KEY);

  return (
    <div
      className="client-plan-shell"
      style={
        {
          "--client-plan-assistant-width": `${assistantWidth}px`,
          "--client-plan-messages-width": `${messagesWidth}px`,
        } as CSSProperties
      }
    >
      <div className="client-plan-shell-main">
        <ClientDashboardView />
      </div>

      <StaffClientMessagingSidebar
        width={messagesWidth}
        onWidthChange={setMessagesWidth}
        surface="client"
        title="Messages"
        subtitle="Direct thread with your Corduroy team"
        placeholder="Write a message to your Corduroy team…"
        ariaLabel="Messages with your Corduroy team"
        composerAriaLabel="Message your Corduroy team"
        counterpartLabel="Corduroy"
        emptyLabel="No messages yet. Send a note to your Corduroy team."
        contact={messagingContact ?? null}
        storageKey={MESSAGES_WIDTH_KEY}
      />

      <StaffLlmDialogueSidebar
        width={assistantWidth}
        onWidthChange={setAssistantWidth}
        surface="client"
        title="Zophia"
        subtitle="Grounded in your plan metrics"
        greeting={ASSISTANT_GREETING}
        placeholder="Ask about your KPIs, goals, or initiatives…"
        ariaLabel="Dashboard assistant"
        storageKey={ASSISTANT_WIDTH_KEY}
      />
    </div>
  );
}
