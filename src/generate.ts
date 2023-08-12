import yaml, { YAMLException } from "js-yaml";
import { Configuration, OpenAIApi } from "openai";
import { composeChatPrompt } from "./composeChatPrompt";
import { Outputs, Inputs, JsonPrimitive } from "./types";
import { GenerateOptions } from "./GenerateOptions";
import { $throw, assign, mutate } from "vovas-utils";
import _ from "lodash";

export const generate = async <O extends string, I extends string>(
  outputs: Outputs<O>,
  inputs: Inputs<I>,
  options?: GenerateOptions<O | I>
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
    model: 'gpt-3.5-turbo',
    ...openaiOptions,
    messages
  });

  const rawContent = message?.content;
  meta && assign(meta, { rawContent });

  try {
    return _.mapKeys(
      yaml.load(rawContent ?? '') as Record<string, JsonPrimitive>,
      (__, key) => _.camelCase(key)
    ) as Record<O, JsonPrimitive>;
  } catch ( error ) {
    return error instanceof YAMLException
      ? undefined
      : Promise.reject(error);
  };

};

export const generateOrThrow = <O extends string, I extends string>(
  ...args: Parameters<typeof generate<O,I>>
) => generate<O,I>(...args).then(result =>
  result ?? $throw('Failed to generate output')
);