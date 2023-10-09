import { SpecType, SpecTypeName, SpecTypes, specTypeKey } from ".";

/**
 * The desired output of the {@link generate} function.
 * Can be a simple string, a (readonly) array of strings, or a string-to-string record.
 * - If simple string, {@link generate} will return a single value of the type inferred according to {@link specValueTemplates}.
 * - If array of strings, {@link generate} will return a record with the same keys as the array, and values inferred according to {@link specKeyTemplates}.
 * - If string-to-string record, {@link generate} will return a record with the same keys as the record, and values inferred according to both {@link specKeyTemplates} and {@link specValueTemplates}, the former taking precedence.
 */
export type Specs = string | readonly string[] | Record<string, string>;

/**
 * 3-element tuple used to define templates for matching spec keys and values.
 * - The first element is an exact match (i.e. the spec key or value must be exactly the same as the template to match).
 * - The second element is a prefix (i.e. the spec key or value must start with the template to match).
 * - The third element is a suffix (i.e. the spec key or value must end with the template to match).
 */
export type EPSTemplate = readonly [string | null, string | null, string | null];

/**
 * Type used to match a {@link Specs} item against an {@link EPSTemplate}.
 */
export type MatchesTemplate<T extends EPSTemplate> =
  ( T[0] extends string ? T[0] : never )
  | ( T[1] extends string ? `${T[1]}${string}` : never )
  | ( T[2] extends string ? `${string}${T[2]}` : never );

type TestMatchesTemplate = MatchesTemplate<['boolean', 'true if ', '(boolean)']> 
// expected: "boolean" | `true if ${string}` | `${string}(boolean)`

/**
 * Actual templates used to match {@link Specs} item values (i.e. descriptions).
 * - If the description is exactly "number" or ends with "(number)", the type will be inferred as a `number`.
 * - If the description is exactly "boolean" or starts with "true if " or ends with "(boolean)", the type will be inferred as a `boolean`.
 * - If the description is exactly or starts with "array of numbers" or ends with "(array of numbers)", the type will be inferred as `number[]`.
 * - If the description is exactly or starts with "array of strings" or ends with "(array of strings)", the type will be inferred as `string[]`.
 * - If the description is exactly or starts with "string" or ends with "(string)", the type will be inferred as a `string`.
 * - Otherwise, the type will be inferred as a `string`.
 */
export const specValueTemplates = {
  number: ['number', null, '(number)'],
  boolean: ['boolean', 'true if ', '(boolean)'],
  'number[]': ['array of numbers', 'array of numbers', '(array of numbers)'],
  'string[]': ['array of strings', 'array of strings', '(array of strings)'],
  string: ['string', 'string', '(string)'],
} as const;

/**
 * Type inferred from {@link specValueTemplates}, for compile-time type safety.
 */
export type SpecValueTemplates = typeof specValueTemplates;

/**
 * Infers the {@link EPSTemplate} to use for a given {@link SpecType}.
 */
export type TemplateFor<T extends SpecType> = SpecValueTemplates[SpecTypeName<T>];

type TestTemplateFor = TemplateFor<number[]>; // expected: [null, "array of numbers", "(array of numbers)"]

/**
 * Infers the exact match part of the {@link EPSTemplate} to use for a given {@link SpecType}.
 */
export type TemplateExactMatch<T extends SpecType> = SpecValueTemplates[SpecTypeName<T>][0];

/**
 * Infers the prefix part of the {@link EPSTemplate} to use for a given {@link SpecType}.
 */
export type TemplatePrefix<T extends SpecType> = SpecValueTemplates[SpecTypeName<T>][1];

/**
 * Infers the suffix part of the {@link EPSTemplate} to use for a given {@link SpecType}.
 */
export type TemplateSuffix<T extends SpecType> = SpecValueTemplates[SpecTypeName<T>][2];

/**
 * Infers the {@link specValueTemplates} entry to use for a given value (of a supported type).
 * 
 * @param value Value to infer the {@link specValueTemplates} entry for.
 * @returns The {@link specValueTemplates} entry to use for the given value.
 */
export const templateFor = <T extends SpecType>(value: T) => specValueTemplates[specTypeKey(value)] as TemplateFor<T>;

/**
 * Infers the exact match part of the {@link specValueTemplates} entry to use for a given value (of a supported type).
 * 
 * @param value Value to infer the exact match part of the {@link specValueTemplates} entry for.
 * @returns The exact match part of the {@link specValueTemplates} entry to use for the given value.
 */
export const templateExactMatch = <T extends SpecType>(value: T) => templateFor(value)[0] as TemplateExactMatch<T>;

/**
 * Infers the prefix part of the {@link specValueTemplates} entry to use for a given value (of a supported type).
 * 
 * @param value Value to infer the prefix part of the {@link specValueTemplates} entry for.
 * @returns The prefix part of the {@link specValueTemplates} entry to use for the given value.
 */
export const templatePrefix = <T extends SpecType>(value: T) => templateFor(value)[1] as TemplatePrefix<T>;

/**
 * Infers the suffix part of the {@link specValueTemplates} entry to use for a given value (of a supported type).
 * 
 * @param value Value to infer the suffix part of the {@link specValueTemplates} entry for.
 * @returns The suffix part of the {@link specValueTemplates} entry to use for the given value.
 */
export const templateSuffix = <T extends SpecType>(value: T) => templateFor(value)[2] as TemplateSuffix<T>;

type TestTemplateExactMatch = TemplateExactMatch<number[]>; // expected: null
type TestTemplatePrefix = TemplatePrefix<boolean>; // expected: "true if "
type TestTemplateSuffix = TemplateSuffix<string[]>; // expected: "(array of strings)"

/**
 * Actual templates used to match {@link Specs} item keys.
 * - If the key starts with "is" or ends with "Boolean", the type will be inferred as a `boolean`.
 *   NOTE: This will also be triggered on "normal" words starting with "is", e.g. "island", so avoid such words.
 * - If the key ends with "Array", the type will be inferred as `string[]`.
 * - If the key ends with "String", the type will be inferred as a `string`.
 * - Otherwise, the type will be inferred as a `string` or according to {@link specValueTemplates}, where applicable.
 */
export const specKeyTemplates = {
  boolean: [null, 'is', 'Boolean'],
  // Note: This will also be triggered on "normal" words starting with "is", e.g. "island".
  // TODO: Think of a different way to do this (require an underscore prefix, i.e. "is_paid" instead of "isPaid"?)
  // TODO: Make values take precedence over keys to override this by explicitly specifying a type in the description (e.g. { island: 'string' }})
  number: [null, null, 'Number'],
  'string[]': [null, null, 'Array'],
  string: [null, null, 'String'],
} as const;

/**
 * Type inferred from {@link specKeyTemplates}, for compile-time type safety.
 */
export type SpecKeyTemplates = typeof specKeyTemplates;

/**
 * Infers the {@link SpecType} to use for a given {@link Specs} item key.
 */
export type InferTypeFromKey<K extends string> = {
  [P in keyof SpecKeyTemplates]: K extends MatchesTemplate<SpecKeyTemplates[P]> ? SpecTypes[P] : never;
}[keyof SpecKeyTemplates];

type TestInferTypeFromKey = InferTypeFromKey<'isPaid'>; // expected: boolean
type TestInferTypeFromKey2 = InferTypeFromKey<'notesArray'>; // expected: string[]
type TestInferTypeFromKey3 = InferTypeFromKey<'groceries'>; // expected: never

/**
 * Infers the {@link SpecType} to use for a given {@link Specs} item value (i.e. description).
 */
export type InferTypeFromValue<V extends string> = {
  [P in keyof SpecValueTemplates]: Lowercase<V> extends MatchesTemplate<SpecValueTemplates[P]> ? SpecTypes[P] : never;
  // We do lowercase for values because users will often enter descriptions in their preferred casing, and we want to be able to match them all.
}[keyof SpecValueTemplates];

type TestInferTypeFromValue = InferTypeFromValue<'number'>; // expected: number
type TestInferTypeFromValue2 = InferTypeFromValue<'true if paid'>; // expected: boolean
type TestInferTypeFromValue3 = InferTypeFromValue<'array of numbers'>; // expected: number[]
type TestInferTypeFromValue4 = InferTypeFromValue<'list of items to buy'>; // expected: string[]

/**
 * Infers the {@link SpecType} to use for a given key-value pair in a record-based {@link Specs} item.
 */
export type InferTypeFromSpecEntry<O extends Record<string, string>, K extends keyof O> =
  K extends string
    ? InferTypeFromKey<K> extends never
      ? InferTypeFromValue<O[K]> extends never
        ? string
        : InferTypeFromValue<O[K]>
      : InferTypeFromKey<K>
    : never;

type TestSpecs = {
  groceries: 'items to buy (array of strings)',
  unitPrices: 'unit prices for all items (array of numbers)',
  total: 'amount to pay (number)',
  isPaid: 'true if paid',
  notes: 'arbitrary notes'
};

type TestInferTypeFromEntry = InferTypeFromSpecEntry<TestSpecs, 'groceries'>; // expected: string[]
type TestInferTypeFromEntry5 = InferTypeFromSpecEntry<TestSpecs, 'unitPrices'>; // expected: number[]
type TestInferTypeFromEntry4 = InferTypeFromSpecEntry<TestSpecs, 'total'>; // expected: number
type TestInferTypeFromEntry2 = InferTypeFromSpecEntry<TestSpecs, 'isPaid'>; // expected: boolean
type TestInferTypeFromEntry3 = InferTypeFromSpecEntry<TestSpecs, 'notes'>; // expected: string