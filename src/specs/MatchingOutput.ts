import _ from "lodash";
import { asTypeguard, is } from "vovas-utils";
import { Specs, InferTypeFromValue, InferTypeFromKey, InferTypeFromSpecEntry, SpecTypeNames, typeBasedOnSpecEntry, typeBasedOnSpecKey, typeBasedOnSpecValue, specValueTemplates } from ".";

/**
 * Infers the expected output type for given {@link Specs}.
 * 
 * @example
 * const stringSpecs = 'Items to buy (array of strings)';
 * type StringSpecsOutput = MatchingOutput<typeof stringSpecs>; 
 * // expected: string[]
 * 
 * @example
 * const arraySpecs = ['groceriesArray', 'isPaid', 'notes'];
 * type ArraySpecsOutput = MatchingOutput<typeof arraySpecs>;
 * // expected: { groceriesArray: string[], isPaid: boolean, notes: string }
 * 
 * @example
 * const dictSpecs = {
 *   groceries: 'items to buy (array of strings)',
 *   unitPrices: 'unit prices for all items (array of numbers)',
 *   total: 'amount to pay (number)',
 *   isPaid: 'true if paid',
 *   notes: 'arbitrary notes'
 * };
 * type DictSpecsOutput = MatchingOutput<typeof dictSpecs>;
 * // expected: { groceries: string[], unitPrices: number[], total: number, isPaid: boolean, notes: string }
 */
export type MatchingOutput<S extends Specs> = 
  S extends string 
    ? InferTypeFromValue<S> extends never
      ? string
      : InferTypeFromValue<S>
  : S extends readonly string[] 
    ? {
      [K in S[number]]: InferTypeFromKey<K> extends never
        ? string
        : InferTypeFromKey<K>;
    }
  : S extends Record<string, string> 
    ? {
      [K in keyof S]: InferTypeFromSpecEntry<S, K>;
    } : never;

/**
 * Same as {@link MatchingOutput}, but values are {@link SpecTypeName}s (i.e. strings), not actual {@link SpecType}s.
 */
export type MatchingOutputTypeKeys<S extends Specs> = SpecTypeNames<MatchingOutput<S>>;

/**
 * Infers the expected output type(s) for given {@link Specs} in the form of {@link MatchingOutputTypeKeys}.
 * 
 * @param specs {@link Specs} to infer the output type for.
 * @returns The {@link MatchingOutputTypeKeys} for given {@link Specs}.
 */
export function matchingOutputTypeKeys<S extends Specs>(specs: S) {
  return (
    typeof specs === 'string'
      ? typeBasedOnSpecValue(specs) ?? 'string'
      : asTypeguard<readonly string[]>(is.array)(specs)
        ? _.zipObject(specs, specs.map(key => typeBasedOnSpecKey(key) ?? 'string'))
        : is.jsonableObject(specs)
          ? _.mapValues(specs, (value, key) => typeBasedOnSpecEntry(specs, key) ?? 'string')
          : 'string'
  ) as MatchingOutputTypeKeys<S>;
}

// Tests / examples

type TestSpecs = {
  groceries: 'items to buy (array of strings)',
  unitPrices: 'unit prices for all items (array of numbers)',
  total: 'amount to pay (number)',
  isPaid: 'true if paid',
  notes: 'arbitrary notes'
}

type TestOutputs = MatchingOutput<TestSpecs>;
type TestOutputsTypeKeys = MatchingOutputTypeKeys<TestSpecs>;

const testOutputs: TestOutputs = {
  groceries: ['apples', 'bananas', 'oranges'],
  unitPrices: [1.5, 2, 1],
  total: 4.5,
  isPaid: true,
  notes: 'Buy organic if possible',
};

type TestSpecs2 = ['groceriesArray', 'isPaid', 'notes'];

type TestOutputs2 = MatchingOutput<TestSpecs2>;
type TestOutputsTypeKeys2 = MatchingOutputTypeKeys<TestSpecs2>;

const testOutputs2: TestOutputs2 = {
  groceriesArray: ['apples', 'bananas', 'oranges'],
  isPaid: true,
  notes: 'Buy organic if possible',
};

type TestSpec3 = 'List of items to buy (array of strings)';

type TestOutputs3 = MatchingOutput<TestSpec3>;
type TestOutputsTypeKeys3 = MatchingOutputTypeKeys<TestSpec3>;

const testOutputs3: TestOutputs3 = ['apples', 'bananas', 'oranges'];