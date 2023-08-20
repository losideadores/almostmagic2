import { $throw, Jsonable, check, give, is, shouldNotBe } from "vovas-utils";

export type SpecTypes = {
  number: number;
  boolean: boolean;
  'number[]': number[];
  'string[]': string[];
  string: string;
};

export type SpecType = SpecTypes[keyof SpecTypes];

export type SpecTypeKey<T extends SpecType = SpecType> = {
  [P in keyof SpecTypes]: SpecTypes[P] extends T ? P : never;
}[keyof SpecTypes];

type TestSpecTypeKey = SpecTypeKey<string[]>; // expected: 'string[]'
type TestSpecTypeKey2 = SpecTypeKey<number>; // expected: 'number'
// type TestSpecTypeKey3 = SpecTypeKey<boolean[]>; // expected: Type 'boolean[]' does not satisfy the constraint 'SpecType'.

export const specTypeKey = (value: SpecType) =>
  check(value) 
    .if(is.number, () => 'number')
    .if(is.boolean, () => 'boolean')
    .if(is.string, () => 'string')
    .if(is.array, items =>
      items.every(is.number) 
        ? 'number[]'
      : items.every(is.string)
        ? 'string[]'
      : $throw('Array items must be either all numbers or all strings')
    )
    .else(shouldNotBe) as SpecTypeKey;

export type SpecTypeOrKey<T extends SpecType, What extends 'type' | 'key'> = What extends 'type' ? T : SpecTypeKey<T>;

type TestSpecTypeOrKey = SpecTypeOrKey<string[], 'type'>; // expected: string[]
type TestSpecTypeOrKey2 = SpecTypeOrKey<number[], 'key'>; // expected: 'number[]'

export type SpecTypeKeysObject<T extends SpecType | Record<string, SpecType>> =
  T extends Record<string, SpecType>
    ? {
      [K in keyof T]: SpecTypeKey<T[K]>;
    }
  : never;

export type SpecTypeKeysSingle<T extends SpecType | Record<string, SpecType>> =
  T extends SpecType
    ? SpecTypeKey<T>
  : never;

export type SpecTypeKeys<T extends SpecType | Record<string, SpecType>> =
  SpecTypeKeysObject<T> | SpecTypeKeysSingle<T>;

export const specTypeKeysIsObject = <T extends SpecType | Record<string, SpecType>>(value: SpecTypeKeysObject<T> | SpecTypeKeysSingle<T>): value is SpecTypeKeysObject<T> =>
  typeof value === 'object';  

type TestTypeKeys = SpecTypeKeys<{ a: string[], b: number }>; // expected: { a: 'string[]', b: 'number' }
type TestTypeKeys2 = SpecTypeKeys<string[]>; // expected: 'string[]'