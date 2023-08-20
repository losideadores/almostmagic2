import { CreateChatCompletionRequest } from "openai";
import { Inputs } from "./specs/Inputs";
import { GenerateMeta } from "./GenerateMeta";
import { Specs } from "./specs/Specs";
import { MatchingOutput } from "./specs/MatchingOutput";

export type GenerateOptions<
  O extends Specs,
  I extends Inputs
> = Partial<Pick<
  CreateChatCompletionRequest, 'model' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'
>> & {
  openaiApiKey?: string;
  meta?: GenerateMeta;
  description?: string;
  debug?: boolean;
  examples?: (
    (
      I extends string
        ? { input: I }
        : I
    )
    &
    (
      MatchingOutput<O> extends string
        ? { output: MatchingOutput<O> }
        : MatchingOutput<O>
    )
  )[];
  throwOnFailure?: boolean;
  postProcess?: ( output: MatchingOutput<O> ) => MatchingOutput<O>;
};