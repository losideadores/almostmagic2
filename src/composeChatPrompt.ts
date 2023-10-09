import yaml from "js-yaml";
import _ from "lodash";
import { chat } from "./chatMessage";
import { Inputs } from "./specs/Inputs";
import { Specs } from "./specs/Specs";
import { GenerateExample, GenerateOptions } from "./GenerateOptions";
import { ChatCompletionMessageParam } from "openai/resources/chat";

/**
 * Converts the first character of `string` to upper case and the remaining to lower case.
 * @param str String to convert.
 * @returns the converted string.
 */
export function sentenceCase(str: string) {
  return _.upperFirst(_.toLower(_.startCase(str)));
};

/**
 * Serializes the given object to a YAML string. If `sentencify` is true, it converts the keys to sentence case.
 * @param obj Object to serialize.
 * @param sentencify Whether to convert keys to sentence case (@see {@link sentenceCase}).
 * @returns the resulting YAML string.
 */
export function serialize(obj: any, sentencify: boolean) {
  return yaml.dump(
    sentencify
      ? Array.isArray(obj)
        ? obj.map(sentenceCase)
        : typeof obj === "string"
          ? sentenceCase(obj)
          : _.mapKeys(obj, (v, k) => sentenceCase(k))
      : obj
  ).trim();
};

/**
 * Returns a function that wraps a string with a given string.
 * @param char String to wrap with.
 * @returns Function that wraps a string with a given string.
 * 
 * @example
 * const wrapWithAsterisks = wrapWith('*');
 * wrapWithAsterisks('hello'); // returns '*hello*'
 */
export function wrapWith(char: string) {
  return (str: string) => `${char}${str}${char}`;
}

/**
 * Returns the chat prompt (array of {@link ChatCompletionMessageParam}s) allowing the model to generate the given `outputs` based on the given `inputs`.
 * 
 * @template O Type of the outputs, extending {@link Specs}.
 * @template I Type of the inputs, extending {@link Inputs}.
 * @param outputs Outputs that the model should generate.
 * @param inputs Inputs that the model should use to generate the outputs.
 * @param {GenerateOptions<O, I>} options Options for generating the chat prompt.
 * @param {string} options.description Description of the prompt.
 * @param {GenerateExample<I, O>[]} options.examples Examples of inputs and outputs.
 * @returns The chat prompt (array of {@link ChatCompletionMessageParam}s) allowing the model to generate the given `outputs` based on the given `inputs`.
 */
export const composeChatPrompt = < O extends Specs, I extends Inputs >(
  outputs: O,
  inputs?: I,
  { description, examples }: GenerateOptions<O, I> = {}
) => {

  const outputKeys = (
    Array.isArray(outputs)
      ? outputs
      : typeof outputs === "string"
        ? ['output']
        : Object.keys(outputs)
  );

  const randomSeed = () => ({ randomSeedDoNotMention: _.random(1000, 9999) });

  return [
    chat.system(description ?? 'You come up with (artificially generate) arbitrary data based on arbitrary inputs, using the best of your AI abilities.'),

    chat.system(`What the user wants to come up with:\n${serialize(outputs, true)}`),

    ...(
      examples
        ? [
            ...examples.map(example => [
              chat.user(serialize(
                inputs
                  ? _.pick(example, _.keys(inputs))
                  : randomSeed()
                , false)),
              chat.assistant(serialize(_.pick(example, outputKeys), false))
            ]).flat(),
            chat.user(serialize(inputs ?? randomSeed(), false)),
          ]
        : [
          chat.user(`What the user provides:\n${serialize(
            inputs 
              ? typeof inputs === "string"
                ? { input: inputs }
                : inputs
              : randomSeed(), true)}`),
          chat.system(`Come up with an output based on the input provided by the user as a JSON object with the following keys: ${
            outputKeys.map(wrapWith('`')).join(', ')
          }. Provide just the JSON object, without any indents, enclosing text or formatting.`),
        ]
    )
  ];

};