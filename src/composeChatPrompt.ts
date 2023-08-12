import yaml from "js-yaml";
import _ from "lodash";
import { chat } from "./chatMessage";
import { Inputs, Outputs } from "./types";
import { GenerateOptions } from "./GenerateOptions";

const sentenceCase = (str: string) => _.upperFirst(_.toLower(_.startCase(str)));

const serialize = (obj: any) => yaml.dump(
  Array.isArray(obj)
    ? obj.map(sentenceCase)
    : typeof obj === "string"
      ? sentenceCase(obj)
      : _.mapKeys(obj, (v, k) => sentenceCase(k))
).trim();

const envelope = (char: string) => (str: string) => `${char}${str}${char}`;

export const composeChatPrompt = <O extends string, I extends string>(
  outputs: Outputs<O>,
  inputs: Inputs<I>,
  { description, examples }: Partial<GenerateOptions<O | I>> = {}
) => {

  const outputKeys = (
    Array.isArray(outputs)
      ? outputs
      : typeof outputs === "string"
        ? [outputs]
        : Object.keys(outputs)
  ).map(sentenceCase);

  return [
    chat.system(description ?? 'You provide structured (YAML-formatted) output based on arbitrary inputs and a specification of the output keys the user wants to receive'),

    ...(
      examples
        ? examples.map(example => [
            chat.user(serialize(_.pick(example, _.keys(inputs)))),
            chat.assistant(serialize(_.pick(example, outputKeys)))
          ]).flat()
        : [
          chat.user(`What the user wants to infer:\n${serialize(outputs)}`),
        ]
    ),

    chat.user(serialize(inputs)),

    ...(
      examples 
        ? [] 
        : [
          chat.user(`Infer the output below as a YAML object with the following keys: ${
            outputKeys.map(envelope('`')).join(', ')
          } and primitive (string/number/boolean/null) values. Do not include any additional text or keys.`),
        ]
    ),
  ];

};