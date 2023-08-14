import yaml, { YAMLException } from "js-yaml";
import { Configuration, OpenAIApi } from "openai";
import { composeChatPrompt } from "./composeChatPrompt";
import { Inputs, JsonPrimitive } from "./types";
import { PropertySpecs, Outputs } from "./PropertySpecs";
import { matchesSpecs } from "./matchesSpecs";
import { GenerateOptions } from "./GenerateOptions";
import { $throw, assign, mutate } from "vovas-utils";
import _ from "lodash";

export const generate = async < O extends PropertySpecs<string>, I extends Inputs<string> >(
  outputSpecs: O,
  inputs?: I,
  options?: GenerateOptions<O, I>
): Promise<Outputs<O> | undefined> => {
  
  const { openaiApiKey, examples, description, meta, ...openaiOptions } = options ?? {};

  const openai = new OpenAIApi(new Configuration({ apiKey:
    options?.openaiApiKey ??
    process.env.OPENAI_API_KEY ??
    $throw('OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`')
  }));

  const messages = composeChatPrompt(outputSpecs, inputs, { examples, description });

  console.log({ messages });

  const { data: { choices: [{ message }] }} = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    ...openaiOptions,
    messages
  });

  const rawContent = message?.content;
  meta && assign(meta, { rawContent });

  try {
    const result = _.mapKeys(
      yaml.load(rawContent ?? '') as any,
      (__, key) => _.camelCase(key)
    );
    if ( matchesSpecs(result, outputSpecs) ) {
      return result;
    }
  } catch ( error ) {
    return error instanceof YAMLException
      ? undefined
      : Promise.reject(error);
  };

};

export const generateOrThrow = < O extends PropertySpecs<string>, I extends Inputs<string> >(
  ...args: Parameters<typeof generate<O, I>>
) => generate<O, I>(...args).then(result =>
  result ?? $throw('Failed to generate output')
);