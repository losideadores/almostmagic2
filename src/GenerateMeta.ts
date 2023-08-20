import { OpenAIApi } from "openai";
import { GenerateException, GenerateExceptionType } from ".";

export type ChatCompletionMethod = OpenAIApi["createCompletion"];

export class GenerateMeta {
  api?: {
    requestData?: Parameters<ChatCompletionMethod>[0];
    response?: Awaited<ReturnType<ChatCompletionMethod>>;
  }
  error?: GenerateException<GenerateExceptionType>;
};