import * as vovas_utils from 'vovas-utils';
import { Jsonable } from 'vovas-utils';
import * as openai_resources_chat from 'openai/resources/chat';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';

/**
 * A mapping between {@link SpecTypeName}s (i.e. string representations of {@link SpecType}s as per TypeScript's type system) and their corresponding {@link SpecType}s.
 */
type SpecTypes = {
    number: number;
    boolean: boolean;
    'number[]': number[];
    'string[]': string[];
    string: string;
};
/**
 * A type representing one of the supported types that {@link generate} can return as part of its output (@see {@link Specs}), namely a number, a boolean, a number array, a string array, or a string.
 */
type SpecType = SpecTypes[keyof SpecTypes];
/**
 * The string representation of a {@link SpecType} as per TypeScript's type system.
 */
type SpecTypeName<T extends SpecType = SpecType> = {
    [P in keyof SpecTypes]: SpecTypes[P] extends T ? P : never;
}[keyof SpecTypes];
/**
 * Infers the {@link SpecTypeName} based on the value’s type, provided it is one of the {@link SpecType}s.
 * Think of it as a `typeof`, where the possible return values are the {@link SpecTypeName}'s instead of the JavaScript primitive types.
 *
 * @param value Value to infer the {@link SpecTypeName} for.
 * @returns The {@link SpecTypeName} for the given value.
 */
declare const specTypeKey: (value: Jsonable) => "number" | "boolean" | "string" | "number[]" | "string[]";
/**
 * A type representing either a {@link SpecType} or a mapping between string keys and {@link SpecType}'s.
 *
 * @example
 * const names: SpecTypeOrDict = ['John', 'Jane']; // i.e. `string[]`
 * const ages: SpecTypeOrDict = { John: 42, Jane: 43 }; // i.e. `{ [key: string]: number }`
 */
type SpecTypeOrDict = SpecType | Record<string, SpecType>;
/**
 * Converts the values in a dict-like {@link SpecTypeOrDict} to their corresponding {@link SpecTypeName}s. If the input is a {@link SpecType} (not dict-like), returns `never`.
 */
type SpecTypeKeysDict<T extends SpecTypeOrDict> = T extends Record<string, SpecType> ? {
    [K in keyof T]: SpecTypeName<T[K]>;
} : never;
/**
 * Converts a non-dict-like {@link SpecTypeOrDict} to its corresponding {@link SpecTypeName}. If the input is dict-like {@link SpecTypeOrDict}, returns `never`.
 */
type SpecTypeKeysSingle<T extends SpecTypeOrDict> = T extends SpecType ? SpecTypeName<T> : never;
/**
 * Converts a {@link SpecTypeOrDict} to its corresponding {@link SpecTypeName} (if `T` is a {@link SpecType}) or {@link SpecTypeKeysDict} (if `T` a dict whose values are {@link SpecType}s).
 */
type SpecTypeKeys<T extends SpecTypeOrDict> = SpecTypeKeysDict<T> | SpecTypeKeysSingle<T>;
/**
 * A typeguard that checks whether a given value of type {@link SpecTypeKeys} is a dict-like, i.e. a {@link SpecTypeKeysDict}.
 *
 * @param value Value to check.
 * @returns `true` (narrowing `value` to {@link SpecTypeKeysDict}) if `value` is a dict-like, `false` (narrowing `value` to {@link SpecTypeKeysSingle}) otherwise.
 */
declare const specTypeKeysIsDict: <T extends SpecTypeOrDict>(value: SpecTypeKeys<T>) => value is SpecTypeKeysDict<T>;

/**
 * A type representing the input to the {@link generate} function: either a string (simple description of the input), or a mapping between string keys and {@link SpecType}s.
 */
type Inputs = string | Record<string, SpecType>;

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
type MatchingOutput<S extends Specs> = S extends string ? InferTypeFromValue<S> extends never ? string : InferTypeFromValue<S> : S extends readonly string[] ? {
    [K in S[number]]: InferTypeFromKey<K> extends never ? string : InferTypeFromKey<K>;
} : S extends Record<string, string> ? {
    [K in keyof S]: InferTypeFromSpecEntry<S, K>;
} : never;
/**
 * Same as {@link MatchingOutput}, but values are {@link SpecTypeKey}s (i.e. strings), not actual {@link SpecType}s.
 */
type MatchingOutputTypeKeys<S extends Specs> = SpecTypeKeys<MatchingOutput<S>>;
/**
 * Infers the expected output type(s) for given {@link Specs} in the form of {@link MatchingOutputTypeKeys}.
 *
 * @param specs {@link Specs} to infer the output type for.
 * @returns The {@link MatchingOutputTypeKeys} for given {@link Specs}.
 */
declare function matchingOutputTypeKeys<S extends Specs>(specs: S): MatchingOutputTypeKeys<S>;

type MatchingSpecs<Output extends SpecType | Record<string, SpecType>> = Output extends SpecType ? TemplateSuffix<Output> : Output extends Record<string, SpecType> ? {
    [K in keyof Output]: TemplateSuffix<Output[K]>;
} : never;
declare const matchingSpecs: <Output extends SpecType | Record<string, SpecType>>(output: Output) => MatchingSpecs<Output>;

/**
 * The desired output of the {@link generate} function.
 * Can be a simple string, a (readonly) array of strings, or a string-to-string record.
 * - If simple string, {@link generate} will return a single value of the type inferred according to {@link specValueTemplates}.
 * - If array of strings, {@link generate} will return a record with the same keys as the array, and values inferred according to {@link specKeyTemplates}.
 * - If string-to-string record, {@link generate} will return a record with the same keys as the record, and values inferred according to both {@link specKeyTemplates} and {@link specValueTemplates}, the former taking precedence.
 */
type Specs = string | readonly string[] | Record<string, string>;
/**
 * 3-element tuple used to define templates for matching spec keys and values.
 * - The first element is an exact match (i.e. the spec key or value must be exactly the same as the template to match).
 * - The second element is a prefix (i.e. the spec key or value must start with the template to match).
 * - The third element is a suffix (i.e. the spec key or value must end with the template to match).
 */
type EPSTemplate = readonly [string | null, string | null, string | null];
/**
 * Type used to match a {@link Specs} item against an {@link EPSTemplate}.
 */
type MatchesTemplate<T extends EPSTemplate> = (T[0] extends string ? T[0] : never) | (T[1] extends string ? `${T[1]}${string}` : never) | (T[2] extends string ? `${string}${T[2]}` : never);
/**
 * Actual templates used to match {@link Specs} item values (i.e. descriptions).
 * - If the description is exactly "number" or ends with "(number)", the type will be inferred as {@link number}.
 * - If the description is exactly "boolean" or starts with "true if " or ends with "(boolean)", the type will be inferred as {@link boolean}.
 * - If the description starts with "array of numbers" or ends with "(array of numbers)", the type will be inferred as `number[]`.
 * - If the description is exactly "array of strings" or ends with "(array of strings)", the type will be inferred as `string[]`.
 * - If the description is exactly "string" or ends with "(string)", the type will be inferred as {@link string}.
 * - Otherwise, the type will be inferred as {@link string}.
 */
declare const specValueTemplates: {
    readonly number: readonly ["number", null, "(number)"];
    readonly boolean: readonly ["boolean", "true if ", "(boolean)"];
    readonly 'number[]': readonly [null, "array of numbers", "(array of numbers)"];
    readonly 'string[]': readonly ["array of strings", null, "(array of strings)"];
    readonly string: readonly [null, "string", "(string)"];
};
/**
 * Type inferred from {@link specValueTemplates}, for compile-time type safety.
 */
type SpecValueTemplates = typeof specValueTemplates;
/**
 * Infers the {@link EPSTemplate} to use for a given {@link SpecType}.
 */
type TemplateFor<T extends SpecType> = SpecValueTemplates[SpecTypeName<T>];
/**
 * Infers the exact match part of the {@link EPSTemplate} to use for a given {@link SpecType}.
 */
type TemplateExactMatch<T extends SpecType> = SpecValueTemplates[SpecTypeName<T>][0];
/**
 * Infers the prefix part of the {@link EPSTemplate} to use for a given {@link SpecType}.
 */
type TemplatePrefix<T extends SpecType> = SpecValueTemplates[SpecTypeName<T>][1];
/**
 * Infers the suffix part of the {@link EPSTemplate} to use for a given {@link SpecType}.
 */
type TemplateSuffix<T extends SpecType> = SpecValueTemplates[SpecTypeName<T>][2];
/**
 * Infers the {@link specValueTemplates} entry to use for a given value (of a supported type).
 *
 * @param value Value to infer the {@link specValueTemplates} entry for.
 * @returns The {@link specValueTemplates} entry to use for the given value.
 */
declare const templateFor: <T extends SpecType>(value: T) => TemplateFor<T>;
/**
 * Infers the exact match part of the {@link specValueTemplates} entry to use for a given value (of a supported type).
 *
 * @param value Value to infer the exact match part of the {@link specValueTemplates} entry for.
 * @returns The exact match part of the {@link specValueTemplates} entry to use for the given value.
 */
declare const templateExactMatch: <T extends SpecType>(value: T) => TemplateExactMatch<T>;
/**
 * Infers the prefix part of the {@link specValueTemplates} entry to use for a given value (of a supported type).
 *
 * @param value Value to infer the prefix part of the {@link specValueTemplates} entry for.
 * @returns The prefix part of the {@link specValueTemplates} entry to use for the given value.
 */
declare const templatePrefix: <T extends SpecType>(value: T) => TemplatePrefix<T>;
/**
 * Infers the suffix part of the {@link specValueTemplates} entry to use for a given value (of a supported type).
 *
 * @param value Value to infer the suffix part of the {@link specValueTemplates} entry for.
 * @returns The suffix part of the {@link specValueTemplates} entry to use for the given value.
 */
declare const templateSuffix: <T extends SpecType>(value: T) => TemplateSuffix<T>;
/**
 * Actual templates used to match {@link Specs} item keys.
 * - If the key starts with "is" or ends with "Boolean", the type will be inferred as {@link boolean}.
 *   NOTE: This will also be triggered on "normal" words starting with "is", e.g. "island", so avoid such words.
 * - If the key ends with "Array", the type will be inferred as `string[]`.
 * - If the key ends with "String", the type will be inferred as {@link string}.
 * - Otherwise, the type will be inferred as {@link string} or according to {@link specValueTemplates}, where applicable.
 */
declare const specKeyTemplates: {
    readonly boolean: readonly [null, "is", "Boolean"];
    readonly 'string[]': readonly [null, null, "Array"];
    readonly string: readonly [null, null, "String"];
};
/**
 * Type inferred from {@link specKeyTemplates}, for compile-time type safety.
 */
type SpecKeyTemplates = typeof specKeyTemplates;
/**
 * Infers the {@link SpecType} to use for a given {@link Specs} item key.
 */
type InferTypeFromKey<K extends string> = {
    [P in keyof SpecKeyTemplates]: K extends MatchesTemplate<SpecKeyTemplates[P]> ? SpecTypes[P] : never;
}[keyof SpecKeyTemplates];
/**
 * Infers the {@link SpecType} to use for a given {@link Specs} item value (i.e. description).
 */
type InferTypeFromValue<V extends string> = {
    [P in keyof SpecValueTemplates]: Lowercase<V> extends MatchesTemplate<SpecValueTemplates[P]> ? SpecTypes[P] : never;
}[keyof SpecValueTemplates];
/**
 * Infers the {@link SpecType} to use for a given key-value pair in a record-based {@link Specs} item.
 */
type InferTypeFromSpecEntry<O extends Record<string, string>, K extends keyof O> = K extends string ? InferTypeFromKey<K> extends never ? InferTypeFromValue<O[K]> extends never ? string : InferTypeFromValue<O[K]> : InferTypeFromKey<K> : never;

/**
 * A typeguard that checks if a {@link Jsonable} value is *not* of a given type, as represented by its {@link SpecTypeName}.
 *
 * @param value - The value to check.
 * @param type - The type to check against.
 */
declare function isNotSameType<T extends SpecTypeName>(value: Jsonable, type: T): value is Exclude<Jsonable, SpecTypes[T]>;
/**
 * Tries to cast a value to given {@link Specs}, throwing a {@link GenerateException} if the value cannot be cast.
 *
 * @param output - The value to cast.
 * @param specs - The specs to cast to.
 * @returns The casted value as a {@link MatchingOutput} for the given {@link Specs}.
 */
declare function castToSpecs<S extends Specs>(output: any, specs: S): MatchingOutput<S>;

/**
 * Tries to convert a value to a given type.
 *
 * @param value - The value to convert.
 * @param type - The type to convert the value to, expressed as a string from the `SpecTypes` type.
 * @returns The converted value, or undefined if the conversion failed.
 *
 * Note: We can convert most values to strings, and strings to most other types.
 * Apart from that, we return undefined as we don’t want to make any assumptions.
 */
declare const tryConvert: <T extends keyof SpecTypes>(value: Exclude<undefined, SpecTypes[T]> | Exclude<null, SpecTypes[T]> | Exclude<string, SpecTypes[T]> | Exclude<number, SpecTypes[T]> | Exclude<false, SpecTypes[T]> | Exclude<true, SpecTypes[T]> | Exclude<vovas_utils.JsonableObject, SpecTypes[T]> | Exclude<Jsonable[], SpecTypes[T]>, type: T) => SpecTypes[T] | undefined;

declare const matchesTemplate: <T extends EPSTemplate>(str: string, [exact, prefix, suffix]: T) => str is MatchesTemplate<T>;
declare const typeBasedOnSpecValue: (specValue: string) => SpecType | undefined;
declare const typeBasedOnSpecKey: (specKey: string) => SpecType | undefined;
declare const typeBasedOnSpecEntry: <S extends Record<string, string>>(spec: S, key: keyof S) => SpecType | undefined;

type GenerateExceptionType = 'noOutput' | 'outputNotJsonable' | 'outputNotJsonableObject' | 'specMismatch' | 'yamlError';
declare class GenerateException<T extends GenerateExceptionType> extends Error {
    readonly code: T;
    readonly meta?: any;
    constructor(code: T, meta?: any);
}
declare class SpecMismatchException<S extends Specs, HasKey extends boolean, K extends HasKey extends true ? Extract<keyof SpecTypeKeysDict<MatchingOutput<S>>, string> : undefined, T extends Jsonable> extends GenerateException<'specMismatch'> {
    specs: S;
    key: K;
    expectedType: HasKey extends true ? SpecTypeKeysDict<MatchingOutput<S>>[Extract<keyof SpecTypeKeysDict<MatchingOutput<S>>, string>] : SpecTypeKeysSingle<MatchingOutput<S>>;
    actualValue: T;
    constructor(specs: S, key: K, expectedType: HasKey extends true ? SpecTypeKeysDict<MatchingOutput<S>>[Extract<keyof SpecTypeKeysDict<MatchingOutput<S>>, string>] : SpecTypeKeysSingle<MatchingOutput<S>>, actualValue: T);
}

declare class GenerateMeta {
    api?: {
        requestData?: ChatCompletionCreateParamsNonStreaming;
        response?: ChatCompletion;
    };
    error?: GenerateException<GenerateExceptionType>;
}

type GenerateOptionsBase = {
    openaiApiKey?: string;
    meta?: GenerateMeta;
    description?: string;
    debug?: boolean;
    throwOnFailure?: boolean;
};
type GenerateOptions<O extends Specs, I extends Inputs> = Partial<Pick<ChatCompletionCreateParamsBase, 'model' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'>> & GenerateOptionsBase & {
    examples?: ((I extends string ? {
        input: I;
    } : I) & (MatchingOutput<O> extends string ? {
        output: MatchingOutput<O>;
    } : MatchingOutput<O>))[];
    postProcess?: (output: MatchingOutput<O>) => MatchingOutput<O>;
};

declare const chatRoles: readonly ["user", "assistant", "system"];
type Role = typeof chatRoles[number];
declare const chatMessage: (role: Role, content: string) => ChatCompletionMessageParam;
declare const chat: Record<"user" | "assistant" | "system", (content: string) => ChatCompletionMessageParam>;

declare const serialize: (obj: any, sentencify: boolean) => string;
declare const composeChatPrompt: <O extends Specs, I extends Inputs>(outputs: O, inputs?: I | undefined, { description, examples }?: GenerateOptions<O, I>) => openai_resources_chat.ChatCompletionMessageParam[];

declare const prelimSpecs: {
    readonly title: "string";
    readonly intro: "string";
    readonly outline: "array of strings, to be further expanded into sections";
};
type Prelims = MatchingOutput<typeof prelimSpecs>;
declare const generatePrelims: (topic: string) => Promise<{
    readonly title: string;
    readonly intro: string;
    readonly outline: string;
} | undefined>;

declare const getPostalCode: (location: string) => Promise<string | undefined>;
declare const randomAddressLine: (location?: string) => Promise<string | undefined>;
declare const babyNameIdeas: (request?: string) => Promise<string[] | undefined>;
declare const businessIdeas: (request?: string) => Promise<string[] | undefined>;
declare const swotAnalysis: (idea: string) => Promise<{
    readonly strengths: string[];
    readonly weaknesses: string[];
    readonly opportunities: string[];
    readonly threats: string[];
} | undefined>;

declare const languages: readonly ["en", "fr", "de", "es", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi", "bn", "pa", "te", "mr", "ta", "ur", "gu", "kn", "ml", "sd", "or", "as", "bh", "ks", "ne", "si", "sa", "my", "km", "lo", "th", "lo", "vi", "id", "ms", "tl", "jv", "su", "tl", "ceb", "ny", "ha", "yo", "ig", "yo", "zu", "xh", "st", "tn", "sn", "so", "rw", "rn", "ny", "lg", "sw", "mg", "eo", "cy", "eu", "gl", "ca", "ast", "eu", "qu", "ay", "gn", "tt", "ug", "dz", "bo", "ii", "chr", "iu", "oj", "cr", "km", "mn", "yi", "he", "yi", "ur", "ar", "fa", "ps", "ks", "sd"];
type Language = (typeof languages)[number];
declare const translate: <T extends ("en" | "fr" | "de" | "es" | "it" | "pt" | "ru" | "ja" | "ko" | "zh" | "ar" | "hi" | "bn" | "pa" | "te" | "mr" | "ta" | "ur" | "gu" | "kn" | "ml" | "sd" | "or" | "as" | "bh" | "ks" | "ne" | "si" | "sa" | "my" | "km" | "lo" | "th" | "vi" | "id" | "ms" | "tl" | "jv" | "su" | "ceb" | "ny" | "ha" | "yo" | "ig" | "zu" | "xh" | "st" | "tn" | "sn" | "so" | "rw" | "rn" | "lg" | "sw" | "mg" | "eo" | "cy" | "eu" | "gl" | "ca" | "ast" | "qu" | "ay" | "gn" | "tt" | "ug" | "dz" | "bo" | "ii" | "chr" | "iu" | "oj" | "cr" | "mn" | "yi" | "he" | "fa" | "ps")[]>(text: string, ...toLanguages: T) => Promise<MatchingOutput<T> | undefined>;

declare const defaultMeta: GenerateMeta;
declare const defaultOptions: GenerateOptionsBase;
declare function addDefaultOptions(options: GenerateOptionsBase): void;
declare function generate<O extends Specs, I extends Inputs>(outputSpecs: O, inputs?: I, options?: GenerateOptions<O, I>): Promise<MatchingOutput<O> | undefined>;

type GeneratorConfig<O extends Specs, I extends Inputs> = GenerateOptions<O, I> & {
    outputSpecs: O;
};
declare class Generator<O extends Specs, I extends Inputs> {
    config: GeneratorConfig<O, I>;
    constructor(config: GeneratorConfig<O, I>);
    generateFor(inputs: I): Promise<MatchingOutput<O> | undefined>;
}

declare const improve: <O extends SpecType | Record<string, SpecType>>(output: O, requestToImprove: string, options: GenerateOptions<MatchingSpecs<O>, {
    current: string;
    requestToImprove: string;
}>) => Promise<MatchingOutput<MatchingSpecs<O>> | undefined>;

export { EPSTemplate, GenerateException, GenerateExceptionType, GenerateMeta, GenerateOptions, GenerateOptionsBase, Generator, GeneratorConfig, InferTypeFromKey, InferTypeFromSpecEntry, InferTypeFromValue, Inputs, Language, MatchesTemplate, MatchingOutput, MatchingOutputTypeKeys, MatchingSpecs, Prelims, Role, SpecKeyTemplates, SpecMismatchException, SpecType, SpecTypeKeys, SpecTypeKeysDict, SpecTypeKeysSingle, SpecTypeName, SpecTypeOrDict, SpecTypes, SpecValueTemplates, Specs, TemplateExactMatch, TemplateFor, TemplatePrefix, TemplateSuffix, addDefaultOptions, babyNameIdeas, businessIdeas, castToSpecs, chat, chatMessage, chatRoles, composeChatPrompt, defaultMeta, defaultOptions, generate, generatePrelims, getPostalCode, improve, isNotSameType, languages, matchesTemplate, matchingOutputTypeKeys, matchingSpecs, randomAddressLine, serialize, specKeyTemplates, specTypeKey, specTypeKeysIsDict, specValueTemplates, swotAnalysis, templateExactMatch, templateFor, templatePrefix, templateSuffix, translate, tryConvert, typeBasedOnSpecEntry, typeBasedOnSpecKey, typeBasedOnSpecValue };
