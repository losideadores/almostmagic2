import { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat";
import { GenerateException, GenerateExceptionType } from ".";

/**
 * Class representing metadata for the generate function.
 * @property {Object} [api] - API related data.
 * @property {ChatCompletionCreateParamsNonStreaming} [api.requestData] - The request data sent to the API.
 * @property {ChatCompletion} [api.response] - The response received from the API.
 * @property {GenerateException<GenerateExceptionType>} [error] - Any error that occurred during the generation.
 */
export class GenerateMeta {
  api?: {
    requestData?: ChatCompletionCreateParamsNonStreaming;
    response?: ChatCompletion;
  }
  error?: GenerateException<GenerateExceptionType>;
};