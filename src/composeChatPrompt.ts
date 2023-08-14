import yaml from "js-yaml";
import _ from "lodash";
import { chat } from "./chatMessage";
import { Inputs } from "./types";
import { Specs } from "./Specs";
import { GenerateOptions } from "./GenerateOptions";

const sentenceCase = (str: string) => _.upperFirst(_.toLower(_.startCase(str)));

const serialize = (obj: any, sentencify: boolean ) => yaml.dump(
  sentencify
    ? Array.isArray(obj)
      ? obj.map(sentenceCase)
      : typeof obj === "string"
        ? sentenceCase(obj)
        : _.mapKeys(obj, (v, k) => sentenceCase(k))
    : obj,
).trim();

const envelope = (char: string) => (str: string) => `${char}${str}${char}`;

export const composeChatPrompt = < O extends Specs<string>, I extends Inputs<string> >(
  outputs: O,
  inputs?: I | undefined,
  { description, examples }: GenerateOptions<O, I> = {}
) => {

  const outputKeys = (
    Array.isArray(outputs)
      ? outputs
      : typeof outputs === "string"
        ? [outputs]
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
          chat.user(`What the user provides:\n${serialize(inputs ?? randomSeed(), true)}`),
          chat.system(`Come up with an output based on the input provided by the user as a YAML object with the following keys: ${
            outputKeys.map(envelope('`')).join(', ')
          }. Do not include any additional text, keys, or formatting.`),
        ]
    )
  ];

};