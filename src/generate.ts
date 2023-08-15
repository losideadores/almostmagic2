import yaml, { YAMLException } from "js-yaml";
import _ from "lodash";
import { Configuration, OpenAIApi } from "openai";
import { $throw, mutate } from "vovas-utils";
import { GenerateMeta } from "./GenerateMeta";
import { GenerateOptions } from "./GenerateOptions";
import { GenerateOutput, Specs, modelToGenerateOutput } from "./types/Specs";
import { composeChatPrompt } from "./composeChatPrompt";
import { matchesSpecs } from "./matchesSpecs";
import { Inputs } from "./types/Inputs";

export const defaultMeta = new GenerateMeta();

export const generate = async < O extends Specs, I extends Inputs >(
  outputSpecs: O,
  inputs?: I,
  options?: GenerateOptions<O, I>
): Promise<GenerateOutput<O> | undefined> => {
  
  const { openaiApiKey, examples, description, meta = defaultMeta, ...openaiOptions } = options ?? {};

  const openai = new OpenAIApi(new Configuration({ apiKey:
    options?.openaiApiKey ??
    process.env.OPENAI_API_KEY ??
    $throw('OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`')
  }));

  const messages = composeChatPrompt(outputSpecs, inputs, { examples, description });

  console.log({ messages });

  const requestData = {
    model: 'gpt-3.5-turbo',
    ...openaiOptions,
    messages
  };

  const response = await openai.createChatCompletion(requestData);

  const { data: { choices: [{ message }] }} = response;

  const { content } = message ?? {};

  mutate(meta, { api: { requestData, response } });

  try {
    const result = yaml.load(content ?? '');
    if ( matchesSpecs(result, outputSpecs) ) {
      return modelToGenerateOutput(result, outputSpecs);
    }
  } catch ( error ) {
    console.log(content);
    console.error(error);
    return error instanceof YAMLException
      ? undefined
      : Promise.reject(error);
  };

};

export const generateOrThrow = < O extends Specs, I extends Inputs >(
  ...args: Parameters<typeof generate<O, I>>
) => generate<O, I>(...args).then(result =>
  result ?? $throw('Failed to generate output')
);