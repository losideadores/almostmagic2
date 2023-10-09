import yaml, { YAMLException } from "js-yaml";
import OpenAI from 'openai';
import { $throw, Jsonable, JsonableObject, mutate } from "vovas-utils";
import { GenerateException } from "./GenerateException";
import { GenerateMeta } from "./GenerateMeta";
import { GenerateOptions, GenerateOptionsBase } from "./GenerateOptions";
import { composeChatPrompt } from "./composeChatPrompt";
import { Inputs } from "./specs/Inputs";
import { Specs } from "./specs/Specs";
import { castToSpecs } from "./specs/castToSpecs";
import { MatchingOutput } from "./specs";
import _ from "lodash";

/**
 * Default metadata for the generate function.
 */
export const defaultMeta = new GenerateMeta();

/**
 * Default options for the generate function.
 */
export const defaultOptions: GenerateOptionsBase = {};

/**
 * Function to add default options to the generate function.
 * @param options - The options to add.
 */
export function addDefaultOptions(options: GenerateOptionsBase) {
  Object.assign(defaultOptions, options);
};

/**
 * Generates, using OpenAI's API, data according to given output specifications and inputs.
 * @template O Type of the outputs, extending {@link Specs}.
 * @template I Type of the inputs, extending {@link Inputs}.
 * @param {O} outputSpecs Output specifications for the generation.
 * @param {I} [inputs] Inputs for the generation.
 * @param {GenerateOptions<O, I>} [options] Options for the generation.
 * @returns {Promise<MatchingOutput<O> | undefined>} Generated data according to the output specifications, or undefined if the generation failed and `options.throwOnFailure` is false.
 * @throws {Error} if an error occurred and `options.throwOnFailure` is true.
 */
export async function generate<O extends Specs, I extends Inputs>(
  outputSpecs: O,
  inputs?: I,
  options?: GenerateOptions<O, I>
): Promise<MatchingOutput<O> | undefined> {

  const { 
    openaiApiKey, examples, debug, description, meta = defaultMeta, throwOnFailure, 
    postProcess, ...openaiOptions 
  } = {
    ...defaultOptions,
    ...options
  };

  const openaiRequestOptionKeys = [
    'model', 'temperature', 'top_p', 'max_tokens', 
    'presence_penalty', 'frequency_penalty', 'logit_bias', 'user'
  ] as const;

  const openaiRequestOptions = _.pick(openaiOptions, openaiRequestOptionKeys);
  const openaiConfigOptions = _.omit(openaiOptions, openaiRequestOptionKeys);

  const openai = new OpenAI({
    apiKey: openaiApiKey ??
      process.env.OPENAI_API_KEY ??
      $throw('OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`'),
    ...openaiConfigOptions
  });

  const messages = composeChatPrompt(
    outputSpecs, 
    inputs, 
    { examples, description }
  );

  if ( debug )
    console.log(yaml.dump({ messages }));

  const requestData = {
    model: 'gpt-3.5-turbo',
    ...openaiRequestOptions,
    messages
  };

  // const response = await openai.createChatCompletion(requestData);
  // const { data: { choices: [{ message }] }} = response;

  const response = await openai.chat.completions.create(requestData);
  const { choices: [{ message }] } = response;

  const { content } = message ?? {};

  if ( debug )
    console.log(content);

  mutate(meta, { api: { requestData, response } });

  try {
    // let result = yaml.load(content ?? '') as any;
    let result = JSON.parse(content ?? $throw(new GenerateException('noOutput')));
    if ( typeof outputSpecs === 'string' ) 
      result = result['output'];
    let matchingResult = castToSpecs(result, outputSpecs);
    if ( postProcess )
      matchingResult = postProcess(matchingResult);
    return matchingResult;
  } catch ( error ) {
    // if ( error instanceof YAMLException )
    if ( error instanceof SyntaxError )
      // error = new GenerateException('yamlError', { content, ...error });
      error = new GenerateException('outputNotJsonable', { content, ...error });
    if ( error instanceof GenerateException && !throwOnFailure )
      return;
    throw error;
  };

};