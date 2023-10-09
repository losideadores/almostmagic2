import { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat";
import { GenerateException, GenerateExceptionType } from ".";

/**
 * Class representing metadata for the {@link generate} function.
 */
export class GenerateMeta {
  /** API related data. */
  api?: {
    /** The request data sent to the API. */
    requestData?: ChatCompletionCreateParamsNonStreaming;
    /** The response received from the API. */
    response?: ChatCompletion;
  }
  /** Any error that occurred during the generation. */
  error?: GenerateException<GenerateExceptionType>;
};