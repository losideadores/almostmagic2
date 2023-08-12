import yaml from "js-yaml";
import _ from "lodash";
import { chat } from "./chatMessage";
import { Inputs, Outputs } from "./types";

const sentenceCase = (str: string) => _.upperFirst(_.toLower(_.startCase(str)));

const dump = (obj: any) => yaml.dump(
  _.isPlainObject(obj)
    ? _.mapKeys(obj, (v, k) => sentenceCase(k))
    : obj
);

export const composeChatPrompt = <O extends string, I extends string>(
  outputs: Outputs<O>,
  inputs?: Inputs<I>
) => {

  const outputKeys =
    Array.isArray(outputs)
      ? outputs
      : typeof outputs === "string"
        ? [outputs]
        : Object.keys(outputs);

  return [
    chat.system('You provide structured (JSON-parseable) output based on arbitrary inputs and a specification of the output keys the user wants to receive'),

    chat.user(`What the user wants to infer:\n${dump(outputs)}`),

    chat.user(`User input:\n${dump(inputs)}`),

    chat.user(`Infer the output below as a single, JSON-parseable object with the following keys: ${outputKeys.join(', ')}. Do not include any additional text or keys.`),
  ];

};