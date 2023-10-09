import { Inputs } from "./specs/Inputs";
import { GenerateMeta } from "./GenerateMeta";
import { Specs } from "./specs/Specs";
import { MatchingOutput } from "./specs/MatchingOutput";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import { ClientOptions } from "openai";

/**
 * Base options for the {@link generate} function.
 */
export type GenerateOptionsBase = {
  /** The API key for OpenAI. */
  openaiApiKey?: string;
  
  /** Metadata for the generation. */
  meta?: GenerateMeta;
  
  /** Description of the generation. */
  description?: string;
  
  /** If true, debug information will be logged. */
  debug?: boolean;
  
  /** If true, an error will be thrown if the generation fails. */
  throwOnFailure?: boolean;

} & Partial<
  Pick<
    ChatCompletionCreateParamsBase, 
    'model' | 'temperature' | 'top_p' | 'max_tokens' | 
    'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'
    >
> & Omit<ClientOptions, 'apiKey'>;

/**
 * An example for the generate function.
 * @template I Input type, extending {@link Inputs}.
 * @template O Output type, extending {@link Specs}.
 * If `I` or `O` extend a `string`, these will be converted to objects with keys `input` and `output` respectively; otherwise (i.e. if `I` or `O` are objects), these will be left as-is.
 * In other words, the resulting type is an object with all the keys of `I` and `O` if those are objects, or with keys `input` and `output` if `I` or `O` are strings (respectively).
 */
export type GenerateExample<I extends Inputs, O extends Specs> = 
  (
    I extends string 
      ? { input: I } 
      : I
  ) & (
    MatchingOutput<O> extends string 
      ? { output: MatchingOutput<O> } 
      : MatchingOutput<O>
  );

/**
 * Options for the {@link generate} function.
 * @template O Type of the outputs, extending {@link Specs}.
 * @template I Type of the inputs, extending {@link Inputs}.
 * @see {@link ChatCompletionCreateParamsBase} for OpenAI-specific options.
 * @see {@link GenerateOptionsBase} for base options.
 * @see {@link GenerateExample} for examples.
 */
export type GenerateOptions<
  O extends Specs,
  I extends Inputs
> = GenerateOptionsBase & {
  /** The examples to use for the generation. */
  examples?: GenerateExample<I, O>[];
  /** A function to post process the output of the generation. */
  postProcess?: ( output: MatchingOutput<O> ) => MatchingOutput<O>;
};