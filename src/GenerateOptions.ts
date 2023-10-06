import { Inputs } from "./specs/Inputs";
import { GenerateMeta } from "./GenerateMeta";
import { Specs } from "./specs/Specs";
import { MatchingOutput } from "./specs/MatchingOutput";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";

export type GenerateOptionsBase = {
  openaiApiKey?: string;
  meta?: GenerateMeta;
  description?: string;
  debug?: boolean;
  throwOnFailure?: boolean;
};

export type GenerateOptions<
  O extends Specs,
  I extends Inputs
> = Partial<Pick<
  ChatCompletionCreateParamsBase, 
  'model' | 'temperature' | 'top_p' | 'max_tokens' | 
  'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'
>> & GenerateOptionsBase & {
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
  postProcess?: ( output: MatchingOutput<O> ) => MatchingOutput<O>;
};