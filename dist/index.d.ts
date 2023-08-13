import * as openai from 'openai';
import { CreateChatCompletionRequest, ChatCompletionRequestMessageRoleEnum, ChatCompletionRequestMessage } from 'openai';

type JsonPrimitive = string | number | boolean | null;
type Outputs<Keys extends string> = Keys | Keys[] | Record<Keys, string>;
type Inputs<Keys extends string> = Record<Keys, string>;
declare class GenerateMeta {
    rawContent?: string;
}

type GenerateOptions<T extends string | never = never> = Partial<Pick<CreateChatCompletionRequest, 'model' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'>> & {
    openaiApiKey?: string;
    meta?: GenerateMeta;
    description?: string;
    examples?: T extends string ? Record<T, string>[] : never;
};

declare const chatMessage: (role: ChatCompletionRequestMessageRoleEnum, content: string) => ChatCompletionRequestMessage;
declare const chat: Record<ChatCompletionRequestMessageRoleEnum, (content: string) => ChatCompletionRequestMessage>;

declare const composeChatPrompt: <O extends string, I extends string>(outputs: Outputs<O>, inputs: Inputs<I>, { description, examples }?: Partial<GenerateOptions<O | I>>) => openai.ChatCompletionRequestMessage[];

declare const getPostalCode: (city: string) => Promise<Record<"postalCode", JsonPrimitive> | undefined>;

declare const generate: <O extends string, I extends string>(outputs: Outputs<O>, inputs: Inputs<I>, options?: GenerateOptions<O | I> | undefined) => Promise<Record<O, JsonPrimitive> | undefined>;
declare const generateOrThrow: <O extends string, I extends string>(outputs: Outputs<O>, inputs: Inputs<I>, options?: GenerateOptions<O | I> | undefined) => Promise<Record<O, JsonPrimitive>>;

type MagicConfig<O extends string, I extends string> = GenerateOptions<O | I> & {
    outputs: Outputs<O>;
};
declare class Magic<O extends string, I extends string> {
    config: MagicConfig<O, I>;
    constructor(config: MagicConfig<O, I>);
    generateFor(inputs: Inputs<I>): Promise<Record<O, JsonPrimitive> | undefined>;
}

export { GenerateMeta, GenerateOptions, Inputs, JsonPrimitive, Magic, MagicConfig, Outputs, chat, chatMessage, composeChatPrompt, generate, generateOrThrow, getPostalCode };
