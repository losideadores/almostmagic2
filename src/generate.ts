import { Configuration, OpenAIApi } from "openai";
import { composeChatPrompt } from "./composeChatPrompt";
import { Outputs, Inputs, GenerateOptions, JsonPrimitive } from "./types";
import { $throw, assign, mutate } from "vovas-utils";

export const generate = async <O extends string, I extends string>(
  outputs: Outputs<O>,
  inputs: Inputs<I>,
  options?: GenerateOptions
) => {
  
  const { openaiApiKey, meta, ...openaiOptions } = options ?? {};

  const openai = new OpenAIApi(new Configuration({ apiKey:
    options?.openaiApiKey ??
    process.env.OPENAI_API_KEY ??
    $throw('OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`')
  }));

  const messages = composeChatPrompt(outputs, inputs);

  console.log({ messages });

  const { data: { choices: [{ message }] }} = await openai.createChatCompletion({
    model: 'gpt-4',
    ...openaiOptions,
    messages
  });

  const rawContent = message?.content;
  meta && assign(meta, { rawContent });

  try {
    return JSON.parse(rawContent ?? '') as Record<O, JsonPrimitive>;
  } catch ( error ) {
    return error instanceof SyntaxError
      ? undefined
      : Promise.reject(error);
  };

};

export const generateOrThrow = <O extends string, I extends string>(
  ...args: Parameters<typeof generate<O,I>>
) => generate<O,I>(...args).then(result =>
  result ?? $throw('Failed to generate output')
);