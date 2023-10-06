import _ from "lodash";
import { Chat, ChatCompletionMessageParam as Message } from "openai/resources/chat";

export const chatRoles = ['user', 'assistant', 'system'] as const;

export type Role = typeof chatRoles[number];


export const chatMessage = (role: Role, content: string): Message => ({
  role, content
});

export const chat = chatRoles.reduce((acc, role) => ({
  ...acc,
  [role]: (content: string) => chatMessage(role, content),
}), {} as Record<Role, (content: string) => Message>);
