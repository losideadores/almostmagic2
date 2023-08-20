import yaml, { YAMLException } from "js-yaml";
import { Configuration, OpenAIApi } from "openai";
import { $throw, Jsonable, JsonableObject, mutate } from "vovas-utils";
import { GenerateException } from "./GenerateException";
import { GenerateMeta } from "./GenerateMeta";
import { GenerateOptions } from "./GenerateOptions";
import { composeChatPrompt } from "./composeChatPrompt";
import { Inputs } from "./specs/Inputs";
import { Specs } from "./specs/Specs";
import { makeOutputMatchSpecs } from "./specs/outputMatchesSpecs";
import { MatchingOutput } from "./specs";

export const defaultMeta = new GenerateMeta();

export async function generate<O extends Specs, I extends Inputs>(
  outputSpecs: O,
  inputs?: I,
  options?: GenerateOptions<O, I>
): Promise<MatchingOutput<O> | undefined> {

  const { 
    openaiApiKey, examples, debug, description, meta = defaultMeta, throwOnFailure, 
    postProcess, ...openaiOptions 
  } = options ?? {};

  const openai = new OpenAIApi(new Configuration({ apiKey:
    options?.openaiApiKey ??
    process.env.OPENAI_API_KEY ??
    $throw('OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`')
  }));

  const messages = composeChatPrompt(
    outputSpecs, 
    inputs, 
    { examples, description }
  );

  if ( debug )
    console.log(yaml.dump({ messages }));

  const requestData = {
    model: 'gpt-3.5-turbo',
    ...openaiOptions,
    messages
  };

  const response = await openai.createChatCompletion(requestData);

  const { data: { choices: [{ message }] }} = response;

  const { content } = message ?? {};

  if ( debug )
    console.log(content);

  mutate(meta, { api: { requestData, response } });

  try {
    // let result = yaml.load(content ?? '') as any;
    let result = JSON.parse(content ?? $throw(new GenerateException('noOutput')));
    if ( typeof outputSpecs === 'string' ) 
      result = result['output'];
    let matchingResult = makeOutputMatchSpecs(result, outputSpecs);
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