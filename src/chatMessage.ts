import _ from "lodash";
import { ChatCompletionRequestMessage as Message, ChatCompletionRequestMessageRoleEnum as Role } from "openai";


export const chatMessage = (role: Role, content: string): Message => ({
  role, content
});

export const chat = _.values(Role).reduce((acc, role) => ({
  ...acc,
  [role]: (content: string) => chatMessage(role, content),
}), {} as Record<Role, (content: string) => Message>);
