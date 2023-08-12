import { CreateChatCompletionRequest } from "openai";

export type JsonPrimitive = string | number | boolean | null;

export type Outputs<Keys extends string> = Keys | Keys[] | Record<Keys, string>;
export type Inputs<Keys extends string> = Record<Keys, string>;

export type GenerateOptions = Partial<Pick<
  CreateChatCompletionRequest, 
  'model' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'
>> & {
  openaiApiKey?: string;
  meta?: GenerateMeta;
};

export class GenerateMeta {
  rawContent?: string;
};
