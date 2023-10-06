import { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat";
import { GenerateException, GenerateExceptionType } from ".";

export class GenerateMeta {
  api?: {
    requestData?: ChatCompletionCreateParamsNonStreaming;
    response?: ChatCompletion;
  }
  error?: GenerateException<GenerateExceptionType>;
};