import _ from "lodash";
import { Specs, SpecType, TemplateExactMatch, templateSuffix, SpecValueTemplates, SpecTypeOrDict } from ".";

/**
 * Infers (as type) the {@link Specs} required to generate output of a given type, represented as a {@link SpecTypeOrDict}. The inferred strings are based on the {@link TemplateExactMatch} part of the {@link SpecValueTemplates} for each {@link SpecType}.
 * 
 * @example
 * const outputs = {
 *   groceries: ['apples', 'bananas', 'oranges'],
 *   unitPrices: [1.5, 2, 1],
 *   total: 4.5,
 *   isPaid: true,
 *   notes: 'Buy organic if possible',
 * };
 * 
 * type TestSpecs = MatchingSpecs<typeof outputs>;
 * // expected:
 * // type TestSpecs = {
 * //   groceries: "array of strings";
 * //   unitPrices: "array of numbers";
 * //   total: "number";
 * //   isPaid: "boolean";
 * //   notes: "string";
 * // };
 */
export type MatchingSpecs<Output extends SpecTypeOrDict> = 
  Output extends SpecType
    ? TemplateExactMatch<Output>
  : Output extends Record<string, SpecType>
    ? {
      [K in keyof Output]: TemplateExactMatch<Output[K]>
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
//   groceries: "array of strings";
//   unitPrices: "array of numbers";
//   total: "number";
//   isPaid: "boolean";
//   notes: "string";
// }

/**
 * 
 * Returns the specs required to generate an output of the same type as the one provided (@see {@link MatchingSpecs}).
 * 
 * @param output Output to infer the specs for.
 * @returns The specs required to generate an output of the same type as the one provided.
 */
export const matchingSpecs = <Output extends SpecTypeOrDict>(output: Output) => (
  typeof output === 'object'
    ? _.mapValues(output as Output & Record<string, SpecType>, value => templateSuffix(value) ?? 'string')
  : templateSuffix(output) ?? 'string'
) as MatchingSpecs<Output>;