import { OpenAIApi } from "openai";

export type ChatCompletionMethod = OpenAIApi["createCompletion"];

export class GenerateMeta {
  // apiRequest?: Parameters<ChatCompletionMethod>[0];
  // apiResponse?: Awaited<ReturnType<ChatCompletionMethod>>;
  api?: {
    requestData?: Parameters<ChatCompletionMethod>[0];
    response?: Awaited<ReturnType<ChatCompletionMethod>>;
  }
};