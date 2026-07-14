"use client";

import { type CSSProperties } from "react";
import { ClientPlanView } from "@/components/views/client-plan-view";
import {
  StaffClientMessagingSidebar,
  useStaffMessagesWidth,
} from "@/components/views/staff-client-messaging-sidebar";
import {
  StaffLlmDialogueSidebar,
  useStaffLlmDialogueWidth,
} from "@/components/views/staff-llm-dialogue-sidebar";
import type { MessagingContact } from "@/lib/messaging/messaging-contact";

const ASSISTANT_WIDTH_KEY = "corduroy.client-plan-assistant-width";
const MESSAGES_WIDTH_KEY = "corduroy.client-plan-messages-width";

const ASSISTANT_GREETING =
  "Hi, I'm Zophia — your plan assistant. Ask me about this week's tasks, how your initiatives and milestones are tracking, or where to focus next.";

type ClientPlanShellProps = {
  messagingContact?: MessagingContact | null;
};

export function ClientPlanShell({ messagingContact = null }: ClientPlanShellProps) {
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
        <ClientPlanView />
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
        subtitle="Grounded in your 90-day plan"
        greeting={ASSISTANT_GREETING}
        placeholder="Ask about your tasks, milestones, or KPI progress…"
        ariaLabel="Plan assistant"
        storageKey={ASSISTANT_WIDTH_KEY}
      />
    </div>
  );
}
