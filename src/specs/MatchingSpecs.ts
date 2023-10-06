import _ from "lodash";
import { SpecType, SpecTypeName, SpecValueTemplates, TemplateSuffix, templateSuffix } from ".";

export type MatchingSpecs<Output extends SpecType | Record<string, SpecType>> = 
  Output extends SpecType
    ? TemplateSuffix<Output>
  : Output extends Record<string, SpecType>
    ? {
      [K in keyof Output]: TemplateSuffix<Output[K]>
    }
  : never;

const testOutputs = {
  groceries: ['apples', 'bananas', 'oranges'],
  unitPrices: [1.5, 2, 1],
  total: 4.5,
  isPaid: true,
  notes: 'Buy organic if possible',
};

type TestMatchingSpecs = MatchingSpecs<typeof testOutputs>;

// expected:
// type TestMatchingSpecs = {
//   groceries: "(array of strings)";
//   unitPrices: "(array of numbers)";
//   total: "(number)";
//   isPaid: "(boolean)";
//   notes: "(string)";
// }

export const matchingSpecs = <Output extends SpecType | Record<string, SpecType>>(output: Output) => (
  typeof output === 'object'
    ? _.mapValues(output as Output & Record<string, SpecType>, value => templateSuffix(value) ?? 'string')
  : templateSuffix(output) ?? 'string'
) as MatchingSpecs<Output>;