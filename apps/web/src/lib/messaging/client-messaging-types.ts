export type MessageSenderRole = "staff" | "client";

export type ClientMessage = {
  id: string;
  client_id: string;
  sender_role: MessageSenderRole;
  sender_name: string;
  body: string;
  created_at: string;
};

export type ClientMessagesResponse = {
  messages: ClientMessage[];
};

export type SendClientMessageResponse = {
  message: ClientMessage;
};

export const MAX_MESSAGE_LENGTH = 4000;
