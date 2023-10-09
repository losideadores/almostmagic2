import { ChatCompletionMessageParam } from "openai/resources/chat";

/**
 * Defines the roles that can participate in a chat
 */
export const chatRoles = ['user', 'assistant', 'system'] as const;

/**
 * Type definition for a chat role, based on {@link chatRoles}.
 */
export type Role = typeof chatRoles[number];

/**
 * Creates a chat message with a specific role and content
 * @param role Role of the message sender
 * @param content Content of the message
 * @return Created message as a {@link ChatCompletionMessageParam} (OpenAI API type)
 */
export const chatMessage = (role: Role, content: string): ChatCompletionMessageParam => ({
  role, content
});

/**
 * Creates a chat object with methods for each role
 * @return Created object with keys for each role (@see {@link chatRoles}) and values for each role's method, equivalent to {@link chatMessage}(role, content)
 */
export const chat = chatRoles.reduce((acc, role) => ({
  ...acc,
  [role]: (content: string) => chatMessage(role, content),
}), {} as Record<Role, (content: string) => ChatCompletionMessageParam>);