import yaml from "js-yaml";
import _ from "lodash";
import { chat } from "./chatMessage";
import { Inputs } from "./types";
import { PropertySpecs } from "./PropertySpecs";
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

export const composeChatPrompt = < O extends PropertySpecs<string>, I extends Inputs<string> >(
  outputs: O,
  inputs: I,
  { description, examples }: GenerateOptions<O, I> = {}
) => {

  const outputKeys = (
    Array.isArray(outputs)
      ? outputs
      : typeof outputs === "string"
        ? [outputs]
        : Object.keys(outputs)
  );

  return [
    chat.system(description ?? 'You come up with (artificially generate) arbitrary data based on arbitrary inputs, using the best of your AI abilities.'),

    ...(
      examples
        ? [
            ...examples.map(example => [
              chat.user(serialize(_.pick(example, _.keys(inputs)), false)),
              chat.assistant(serialize(_.pick(example, outputKeys), false))
            ]).flat(),
            chat.user(serialize(inputs, false)),
          ]
        : [
          chat.user(`What the user wants to come up with:\n${serialize(outputs, true)}`),
          chat.user(`What the user provides:\n${serialize(inputs, true)}`),
        ]
    ),

    ...(
      examples 
        ? [] 
        : [
          chat.user(`Come up with an output based on the input provided by the user as a YAML object with the following keys: ${
            outputKeys.map(envelope('`')).join(', ')
          } and primitive (string/number/boolean/null) values. Do not include any additional text, keys, or formatting.`),
        ]
    ),
  ];

};


// const testPrompt = composeChatPrompt(
//   {
//     born: 'the person’s birth year (number)',
//     bio: 'one-two-sentence bio',
//     seeAlso: 'titles of related articles (array of strings)',
//   } as const,
//   {
//     person: 'William Shakespeare',
//   },
//   { 
//     examples: [
//       {
//         person: 'Donald Trump',
//         born: 1946,
//         bio: '45th president of the United States. Famous for his provocative, populist style of politics.',
//         seeAlso: ['Trump Tower', 'US election 2020', 'Stormy Daniels'],
//       }
//     ]
//   }
// );
