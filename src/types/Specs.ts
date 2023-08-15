// export type Specs<Keys extends string> = Keys | Keys[] | Record<Keys, string>;
export type Specs = string | string[] | Record<string, string>;

export type ExpectedModelOutput<O extends Specs> = 
  O extends string 
    ? Record<O, string> 
  : O extends string[] 
    ? Record<O[number], string>
  : O extends Record<string, string> 
    ? {
      [K in keyof O]: 
        InferTypeFromSpec<O, K>;
    } : never;

export type InferTypeFromSpec<O extends Record<string, string>, K extends keyof O> =
  Lowercase<O[K]> extends NumberSpecValue
    ? number
  : Lowercase<O[K]> extends BooleanSpecValue
    ? boolean
  : K extends BooleanSpecKey
    ? boolean
  : Lowercase<O[K]> extends ArrayOfNumbersSpecValue
    ? number[]
  : Lowercase<O[K]> extends ArrayOfStringsSpecValue
    ? string[]
  : K extends ArrayOfStringsSpecKey
    ? string[]
  : string;

export type NumberSpecValue = "number" | `number ${string}` | `${string} (number)`;
export type BooleanSpecValue = "boolean" | `true if ${string}` | `${string} (boolean)`;
export type BooleanSpecKey = `is${Capitalize<string>}`;
export type ArrayOfNumbersSpecValue = `array of numbers${string}` | `${string} (array of numbers)`;
export type ArrayOfStringsSpecValue = `array of ${string}` | `${string} (array of strings)`;
export type ArrayOfStringsSpecKey = `${string}Array`;

export const endsWith = <S extends string>(str: string, suffix: S): str is `${string}${S}` =>
  str.endsWith(suffix);

export const startsWith = <S extends string>(str: string, prefix: S): str is `${S}${string}` =>
  str.startsWith(prefix);

const fits = <
  Equals extends string, Prefix extends string, Suffix extends string
>(
  str: string, equals: Equals | undefined, prefix: Prefix | undefined, suffix: Suffix | undefined
): str is Equals | `${Prefix}${string}` | `${string}${Suffix}` =>
  str === equals || !!prefix && startsWith(str, prefix) || !!suffix && endsWith(str, suffix);

export const valueRepresentsNumber = (value: string): value is NumberSpecValue => 
  fits(value, 'number', 'number ', ' (number)');

export const valueRepresentsBoolean = (value: string): value is BooleanSpecValue =>
  fits(value, 'boolean', 'true if ', ' (boolean)');

export const keyRepresentsBoolean = (key: string): key is BooleanSpecKey =>
  startsWith(key, 'is');

export const valueRepresentsNumberArray = (value: string): value is ArrayOfNumbersSpecValue =>
  fits(value, undefined, 'array of numbers', ' (array of numbers)');

export const valueRepresentsStringArray = (value: string): value is ArrayOfStringsSpecValue =>
  !valueRepresentsNumberArray(value) 
    && fits(value, undefined, 'array of ', ' (array of strings)');

export const keyRepresentsStringArray = (key: string): key is ArrayOfStringsSpecKey =>
  endsWith(key, 'Array');

export type GenerateOutput<O extends Specs> =
  O extends string
    ? string
    : ExpectedModelOutput<O>;

export const modelToGenerateOutput = <O extends Specs>(modelOutput: ExpectedModelOutput<O>, specs: O) => (
  typeof specs === 'string'
    ? modelOutput[specs]
    : modelOutput 
) as GenerateOutput<O>;

type TestOutputs = ExpectedModelOutput<{
  groceries: 'list of items to buy';
  unitPrices: 'unit prices for all items (array of numbers)';
  total: 'amount to pay (number)';
  isPaid: 'true if paid';
  notesArray: 'arbitrary notes';
}>;

// 
// type TestOutputs = {
//   groceries: string[];
//   unitPrices: number[];
//   total: number;
//   isPaid: boolean;
//   notes: string;
// }
