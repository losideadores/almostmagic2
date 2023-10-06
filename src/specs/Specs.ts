/**
 * The desired output of the `generate` function.
 * Can be a simple string, a (readonly) array of strings, or a string-to-string record.
 * - If simple string, `generate` will return a single value of the type inferred according to `specValueTemplates`.
 * - If array of strings, `generate` will return a record with the same keys as the array, and values inferred according to `specKeyTemplates`.
 * - If string-to-string record, `generate` will return a record with the same keys as the record, and values inferred according to both `specKeyTemplates` and `specValueTemplates`, the former taking precedence.
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
 * Type used to match a `Specs` item against an `EPSTemplate`.
 */
export type MatchesTemplate<T extends EPSTemplate> =
  ( T[0] extends string ? T[0] : never )
  | ( T[1] extends string ? `${T[1]}${string}` : never )
  | ( T[2] extends string ? `${string}${T[2]}` : never );

/**
 * Actual templates used to match `Specs` item values (i.e. descriptions).
 * - If the description is exactly "number" or ends with "(number)", the type will be inferred as `number`.
 * - If the description is exactly "boolean" or starts with "true if " or ends with "(boolean)", the type will be inferred as `boolean`.
 * - If the description starts with "array of numbers" or ends with "(array of numbers)", the type will be inferred as `number[]`.
 * - If the description is exactly "array of strings" or starts with "list of" or ends with "(array of strings)", the type will be inferred as `string[]`.
 * - If the description is exactly "string" or ends with "(string)", the type will be inferred as `string`.
 * - Otherwise, the type will be inferred as `string`.
 */
export const specValueTemplates = {
  number: ['number', null, '(number)'],
  boolean: ['boolean', 'true if ', '(boolean)'],
  'number[]': [null, 'array of numbers', '(array of numbers)'],
  'string[]': ['array of strings', 'list of', '(array of strings)'],
  // (We had to use "list of" instead of "array of" because then it would work for "array of numbers" as well, as it's not possible to define a TypeScript type that would allow us to distinguish between the two.)
  string: [null, 'string', '(string)'],
} as const;

/**
 * Type inferred from `specValueTemplates`, for compile-time type safety.
 */
export type SpecValueTemplates = typeof specValueTemplates;

/**
 * Infers the `EPSTemplate` to use for a given `SpecType`.
 */
export type TemplateFor<T extends SpecType> = SpecValueTemplates[SpecTypeKey<T>];

/**
 * Infers the exact match part of the `EPSTemplate` to use for a given `SpecType`.
 */
export type TemplateExactMatch<T extends SpecType> = SpecValueTemplates[SpecTypeKey<T>][0];

/**
 * Infers the prefix part of the `EPSTemplate` to use for a given `SpecType`.
 */
export type TemplatePrefix<T extends SpecType> = SpecValueTemplates[SpecTypeKey<T>][1];

/**
 * Infers the suffix part of the `EPSTemplate` to use for a given `SpecType`.
 */
export type TemplateSuffix<T extends SpecType> = SpecValueTemplates[SpecTypeKey<T>][2];

/**
 * Infers the `specValueTemplates` entry to use for a given value (of a supported type).
 */
export const templateFor = <T extends SpecType>(value: T) => specValueTemplates[specTypeKey(value)] as TemplateFor<T>;

/**
 * Infers the exact match part of the `specValueTemplates` entry to use for a given value (of a supported type).
 */
export const templateExactMatch = <T extends SpecType>(value: T) => templateFor(value)[0] as TemplateExactMatch<T>;

/**
 * Infers the prefix part of the `specValueTemplates` entry to use for a given value (of a supported type).
 */
export const templatePrefix = <T extends SpecType>(value: T) => templateFor(value)[1] as TemplatePrefix<T>;

/**
 * Infers the suffix part of the `specValueTemplates` entry to use for a given value (of a supported type).
 */
export const templateSuffix = <T extends SpecType>(value: T) => templateFor(value)[2] as TemplateSuffix<T>;

/**
 * Actual templates used to match `Specs` item keys.
 * - If the key starts with "is" or ends with "Boolean", the type will be inferred as `boolean`.
 *   NOTE: This will also be triggered on "normal" words starting with "is", e.g. "island", so avoid such words.
 * - If the key ends with "Array", the type will be inferred as `string[]`.
 * - If the key ends with "String", the type will be inferred as `string`.
 * - Otherwise, the type will be inferred as `string` or according to `specValueTemplates`, where applicable.
 */
export const specKeyTemplates = {
  boolean: [null, 'is', 'Boolean'],
  // Note: This will also be triggered on "normal" words starting with "is", e.g. "island", so avoid such words.
  // TODO: Think of a different way to do this (require an underscore prefix, i.e. "is_paid" instead of "isPaid"?)
  'string[]': [null, null, 'Array'],
  string: [null, null, 'String'],
} as const;

/**
 * Type inferred from `specKeyTemplates`, for compile-time type safety.
 */
export type SpecKeyTemplates = typeof specKeyTemplates;

/**
 * Infers the `SpecType` to use for a given `Specs` item key.
 */
export type InferTypeFromKey<K extends string> = {
  [P in keyof SpecKeyTemplates]: K extends MatchesTemplate<SpecKeyTemplates[P]> ? SpecTypes[P] : never;
}[keyof SpecKeyTemplates];

/**
 * Infers the `SpecType` to use for a given `Specs` item value (i.e. description).
 */
export type InferTypeFromValue<V extends string> = {
  [P in keyof SpecValueTemplates]: Lowercase<V> extends MatchesTemplate<SpecValueTemplates[P]> ? SpecTypes[P] : never;
  // We do lowercase for values because users will often enter descriptions in their preferred casing, and we want to be able to match them all.
}[keyof SpecValueTemplates];

/**
 * Infers the `SpecType` to use for a given key-value pair in a record-based `Specs` item.
 */
export type InferTypeFromSpecEntry<O extends Record<string, string>, K extends keyof O> =
  K extends string
    ? InferTypeFromKey<K> extends never
      ? InferTypeFromValue<O[K]> extends never
        ? string
        : InferTypeFromValue<O[K]>
      : InferTypeFromKey<K>
    : never;

/**
 * Infers the `SpecType` to use for a given key-value pair in a record-based `Specs` item.
 */
export type SpecType = number | boolean | string[] | number[];

/**
 * Infers the `SpecTypeKey` to use for a given `SpecType`.
 */
export type SpecTypeKey<T extends SpecType> = T extends number ? 'number' :
  T extends boolean ? 'boolean' :
  T extends string[] ? 'string[]' :
  T extends number[] ? 'number[]' :
  never;

/**
 * Infers the `SpecType` to use for a given `SpecTypeKey`.
 */
export type SpecTypes = {
  [K in keyof SpecValueTemplates]: K extends SpecTypeKey<SpecTypes[K]> ? SpecTypes[K] : never;
};

/**
 * Infers the `SpecType` to use for a given `SpecTypeKey`.
 */
export const specTypeKey = <T extends SpecType>(value: T) => {
  switch (typeof value) {
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'object':
      if (Array.isArray(value)) {
        if (value.every((v) => typeof v === 'number')) {
          return 'number[]';
        } else if (value.every((v) => typeof v === 'string')) {
          return 'string[]';
        }
      }
  }
  throw new Error(`Unsupported value type: ${typeof value}`);
};