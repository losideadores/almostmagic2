import yaml from "js-yaml";
import _ from "lodash";
import { chat } from "./chatMessage";
import { Inputs } from "./specs/Inputs";
import { Specs } from "./specs/Specs";
import { GenerateOptions } from "./GenerateOptions";

const sentenceCase = (str: string) => _.upperFirst(_.toLower(_.startCase(str)));

export const serialize = (obj: any, sentencify: boolean ) => yaml.dump(
  sentencify
    ? Array.isArray(obj)
      ? obj.map(sentenceCase)
      : typeof obj === "string"
        ? sentenceCase(obj)
        : _.mapKeys(obj, (v, k) => sentenceCase(k))
    : obj,
).trim();

const envelope = (char: string) => (str: string) => `${char}${str}${char}`;

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

  const randomSeed = () => ({ seed: _.random(1000, 9999) });

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
          // chat.system(`Come up with an output based on the input provided by the user as a YAML object with the following keys: ${
          //   outputKeys.map(envelope('`')).join(', ')
          // }. Provide just the YAML object, without any enclosing text or formatting. Do not forget to enclose any strings containing colons in quotes (per YAML syntax).`),
          chat.system(`Come up with an output based on the input provided by the user as a JSON object with the following keys: ${
            outputKeys.map(envelope('`')).join(', ')
          }. Provide just the JSON object, without any indents, enclosing text or formatting.`),
        ]
    )
  ];

};