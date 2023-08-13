import { CreateChatCompletionRequest } from "openai";
import { GenerateMeta, Inputs } from "./types";
import { PropertySpecs, Outputs } from "./PropertySpecs";

export type GenerateOptions<
  O extends PropertySpecs<string>,
  I extends Inputs<string>
> = Partial<Pick<
  CreateChatCompletionRequest, 'model' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'
>> & {
  openaiApiKey?: string;
  meta?: GenerateMeta;
  description?: string;
  examples?: (
    Outputs<O> & I
  )[];
};