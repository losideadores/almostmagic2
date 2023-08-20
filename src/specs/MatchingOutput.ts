import _ from "lodash";
import { is } from "vovas-utils";
import { Specs, MatchesSpecValue, MatchesSpecKey, InferTypeFromSpecEntry, SpecTypeKeys, typeBasedOnSpecEntry, typeBasedOnSpecKey, typeBasedOnSpecValue, specValueTemplates } from ".";

export type MatchingOutput<S extends Specs> = 
  S extends string 
    ? MatchesSpecValue<S> extends never
      ? string
      : MatchesSpecValue<S>
  : S extends readonly string[] 
    ? {
      [K in S[number]]: MatchesSpecKey<K> extends never
        ? string
        : MatchesSpecKey<K>;
    }
  : S extends Record<string, string> 
    ? {
      [K in keyof S]: InferTypeFromSpecEntry<S, K>;
    } : never;

export type MatchingOutputTypeKeys<S extends Specs> = SpecTypeKeys<MatchingOutput<S>>;

export const matchingOutputTypeKeys = <S extends Specs>(specs: S) => (
  typeof specs === 'string' 
    ? typeBasedOnSpecValue(specs) ?? 'string'
  : is.array(specs)
    ? _.zipObject(specs, specs.map(key => typeBasedOnSpecKey(key) ?? 'string'))
  : is.jsonableObject(specs)
    ? _.mapValues(specs, (value, key) => typeBasedOnSpecEntry(specs, key) ?? 'string')
  : 'string'
) as MatchingOutputTypeKeys<S>;

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