import { CreateChatCompletionRequest } from "openai";
import { GenerateMeta } from "./types";

export type GenerateOptions<T extends string | never = never> = Partial<Pick<
  CreateChatCompletionRequest, 'model' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'
>> & {
  openaiApiKey?: string;
  meta?: GenerateMeta;
  description?: string;
  examples?: T extends string ? Record<T, string>[] : never;
};