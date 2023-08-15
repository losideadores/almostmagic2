import { CreateChatCompletionRequest } from "openai";
import { Inputs } from "./types/Inputs";
import { GenerateMeta } from "./GenerateMeta";
import { Specs, ExpectedModelOutput } from "./types/Specs";

export type GenerateOptions<
  O extends Specs,
  I extends Inputs
> = Partial<Pick<
  CreateChatCompletionRequest, 'model' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'
>> & {
  openaiApiKey?: string;
  meta?: GenerateMeta;
  description?: string;
  examples?: (
    ExpectedModelOutput<O> & I
  )[];
};