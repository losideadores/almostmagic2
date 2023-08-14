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
        Lowercase<O[K]> extends `${'number' | 'amount'} ${string}` | `${string} (number)`
          ? number 
        : Lowercase<O[K]> extends `${'true' | 'false'} ${'if' | 'when'} ${string}`  | `${string} (boolean)`
          ? boolean 
        : Lowercase<O[K]> extends `${'array' | 'list'} of ${'numbers' | 'amounts'} ${string}` | `${string} (array of numbers)`
          ? number[]
        : Lowercase<O[K]> extends `${'array' | 'list'} of ${string}` | `${string} (array of strings)`
          ? string[]
          : string;
    } : never;

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
  total: 'amount to pay';
  isPaid: 'true if paid';
  notes: 'arbitrary notes (string)';
}>;

// 
// type TestOutputs = {
//   groceries: string[];
//   unitPrices: number[];
//   total: number;
//   isPaid: boolean;
//   notes: string;
// }
