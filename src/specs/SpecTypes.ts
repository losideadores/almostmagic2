import _ from "lodash";
import { $throw, Jsonable, check, give, is, shouldNotBe } from "vovas-utils";

/**
 * A mapping between {@link SpecTypeName}s (i.e. string representations of {@link SpecType}s as per TypeScript's type system) and their corresponding {@link SpecType}s.
 */
export type SpecTypes = {
  number: number;
  boolean: boolean;
  'number[]': number[];
  'string[]': string[];
  string: string;
};

/**
 * A type representing one of the supported types that {@link generate} can return as part of its output (@see {@link Specs}), namely a number, a boolean, a number array, a string array, or a string.
 */
export type SpecType = SpecTypes[keyof SpecTypes];

/**
 * The string representation of a {@link SpecType} as per TypeScript's type system.
 */
export type SpecTypeName<T extends SpecType = SpecType> = {
  [P in keyof SpecTypes]: SpecTypes[P] extends T ? P : never;
}[keyof SpecTypes];

type TestSpecTypeKey = SpecTypeName<string[]>; // expected: 'string[]'
type TestSpecTypeKey2 = SpecTypeName<number>; // expected: 'number'
// type TestSpecTypeKey3 = SpecTypeKey<boolean[]>; // expected: Type 'boolean[]' does not satisfy the constraint 'SpecType'.

/**
 * Infers the {@link SpecTypeName} based on the value’s type, provided it is one of the {@link SpecType}s.
 * Think of it as a `typeof`, where the possible return values are the {@link SpecTypeName}'s instead of the JavaScript primitive types.
 * 
 * @param value Value to infer the {@link SpecTypeName} for.
 * @returns The {@link SpecTypeName} for the given value.
 */
export const specTypeKey = (value: Jsonable) =>
  is.number(value)
    ? 'number'
  : is.boolean(value)
    ? 'boolean'
  : is.string(value)
    ? 'string'
  : is.array(value)
    ? _.every(value, is.number)
      ? 'number[]'
    : _.every(value, is.string)
      ? 'string[]'
    : $throw('Array items must be either all numbers or all strings')
  : $throw('Unsupported value type: ' + typeof value);

/**
 * A type representing either a {@link SpecType} or a mapping between string keys and {@link SpecType}'s.
 * 
 * @example
 * const names: SpecTypeOrDict = ['John', 'Jane']; // i.e. `string[]`
 * const ages: SpecTypeOrDict = { John: 42, Jane: 43 }; // i.e. `{ [key: string]: number }`
 */
export type SpecTypeOrDict = SpecType | Record<string, SpecType>;

/**
 * Converts the values in a dict-like {@link SpecTypeOrDict} to their corresponding {@link SpecTypeName}s. If the input is a {@link SpecType} (not dict-like), returns `never`.
 */
export type SpecTypeNamesDict<T extends SpecTypeOrDict> =
  T extends Record<string, SpecType>
    ? {
      [K in keyof T]: SpecTypeName<T[K]>;
    }
  : never;

/**
 * Converts a non-dict-like {@link SpecTypeOrDict} to its corresponding {@link SpecTypeName}. If the input is dict-like {@link SpecTypeOrDict}, returns `never`.
 */
export type SpecTypeNamesSingle<T extends SpecTypeOrDict> =
  T extends SpecType
    ? SpecTypeName<T>
  : never;

/**
 * Converts a {@link SpecTypeOrDict} to its corresponding {@link SpecTypeName} (if `T` is a {@link SpecType}) or {@link SpecTypeNamesDict} (if `T` a dict whose values are {@link SpecType}s).
 */
export type SpecTypeNames<T extends SpecTypeOrDict> =
  SpecTypeNamesDict<T> | SpecTypeNamesSingle<T>;

/**
 * A typeguard that checks whether a given value of type {@link SpecTypeNames} is a dict-like, i.e. a {@link SpecTypeNamesDict}.
 * 
 * @param value Value to check.
 * @returns `true` (narrowing `value` to {@link SpecTypeNamesDict}) if `value` is a dict-like, `false` (narrowing `value` to {@link SpecTypeNamesSingle}) otherwise.
 */
export const specTypeKeysIsDict = <T extends SpecTypeOrDict>(
  value: SpecTypeNames<T>
): value is SpecTypeNamesDict<T> =>
  typeof value === 'object';  

type TestTypeKeys = SpecTypeNames<{ a: string[], b: number }>; // expected: { a: 'string[]', b: 'number' }
type TestTypeKeys2 = SpecTypeNames<string[]>; // expected: 'string[]'