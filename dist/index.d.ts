import * as vovas_utils from 'vovas-utils';
import { Jsonable } from 'vovas-utils';
import * as openai_resources_chat from 'openai/resources/chat';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';

type Inputs = Record<string, string | number | boolean | null | string[] | number[]> | string;

type MatchingOutput<S extends Specs> = S extends string ? MatchesSpecValue<S> extends never ? string : MatchesSpecValue<S> : S extends readonly string[] ? {
    [K in S[number]]: MatchesSpecKey<K> extends never ? string : MatchesSpecKey<K>;
} : S extends Record<string, string> ? {
    [K in keyof S]: InferTypeFromSpecEntry<S, K>;
} : never;
type MatchingOutputTypeKeys<S extends Specs> = SpecTypeKeys<MatchingOutput<S>>;
declare const matchingOutputTypeKeys: <S extends Specs>(specs: S) => MatchingOutputTypeKeys<S>;

type MatchingSpecs<Output extends SpecType | Record<string, SpecType>> = Output extends SpecType ? TemplateSuffix<Output> : Output extends Record<string, SpecType> ? {
    [K in keyof Output]: TemplateSuffix<Output[K]>;
} : never;
declare const matchingSpecs: <Output extends SpecType | Record<string, SpecType>>(output: Output) => MatchingSpecs<Output>;

type SpecTypes = {
    number: number;
    boolean: boolean;
    'number[]': number[];
    'string[]': string[];
    string: string;
};
type SpecType = SpecTypes[keyof SpecTypes];
type SpecTypeKey<T extends SpecType = SpecType> = {
    [P in keyof SpecTypes]: SpecTypes[P] extends T ? P : never;
}[keyof SpecTypes];
declare const specTypeKey: (value: SpecType) => "number" | "boolean" | "string" | "number[]" | "string[]";
type SpecTypeOrKey<T extends SpecType, What extends 'type' | 'key'> = What extends 'type' ? T : SpecTypeKey<T>;
type SpecTypeKeysObject<T extends SpecType | Record<string, SpecType>> = T extends Record<string, SpecType> ? {
    [K in keyof T]: SpecTypeKey<T[K]>;
} : never;
type SpecTypeKeysSingle<T extends SpecType | Record<string, SpecType>> = T extends SpecType ? SpecTypeKey<T> : never;
type SpecTypeKeys<T extends SpecType | Record<string, SpecType>> = SpecTypeKeysObject<T> | SpecTypeKeysSingle<T>;
declare const specTypeKeysIsObject: <T extends SpecType | Record<string, SpecType>>(value: SpecTypeKeysObject<T> | SpecTypeKeysSingle<T>) => value is SpecTypeKeysObject<T>;

type Specs = string | readonly string[] | Record<string, string>;
type EPSTemplate = readonly [string | null, string | null, string | null];
type MatchesTemplate<T extends EPSTemplate> = (T[0] extends string ? T[0] : never) | (T[1] extends string ? `${T[1]}${string}` : never) | (T[2] extends string ? `${string}${T[2]}` : never);
declare const specValueTemplates: {
    readonly number: readonly ["number", null, "(number)"];
    readonly boolean: readonly ["boolean", "true if ", "(boolean)"];
    readonly 'number[]': readonly [null, "array of numbers", "(array of numbers)"];
    readonly 'string[]': readonly ["array of strings", "list of", "(array of strings)"];
    readonly string: readonly [null, "string", "(string)"];
};
type TemplateFor<T extends SpecType> = SpecValueTemplates[SpecTypeKey<T>];
type TemplateExactMatch<T extends SpecType> = SpecValueTemplates[SpecTypeKey<T>][0];
type TemplatePrefix<T extends SpecType> = SpecValueTemplates[SpecTypeKey<T>][1];
type TemplateSuffix<T extends SpecType> = SpecValueTemplates[SpecTypeKey<T>][2];
declare const templateFor: <T extends SpecType>(value: T) => TemplateFor<T>;
declare const templateExactMatch: <T extends SpecType>(value: T) => TemplateExactMatch<T>;
declare const templatePrefix: <T extends SpecType>(value: T) => TemplatePrefix<T>;
declare const templateSuffix: <T extends SpecType>(value: T) => TemplateSuffix<T>;
declare const specKeyTemplates: {
    readonly boolean: readonly [null, "is", "Boolean"];
    readonly 'string[]': readonly [null, null, "Array"];
    readonly string: readonly [null, null, "String"];
};
type EPSTemplates<T extends Record<string, EPSTemplate>> = {
    [K in keyof T]: T[K];
};
type SpecValueTemplates = EPSTemplates<typeof specValueTemplates>;
type SpecKeyTemplates = EPSTemplates<typeof specKeyTemplates>;
type MatchesSpecKey<K extends string> = {
    [P in keyof SpecKeyTemplates]: K extends MatchesTemplate<SpecKeyTemplates[P]> ? SpecTypes[P] : never;
}[keyof SpecKeyTemplates];
type MatchesSpecValue<V extends string> = {
    [P in keyof SpecValueTemplates]: Lowercase<V> extends MatchesTemplate<SpecValueTemplates[P]> ? SpecTypes[P] : never;
}[keyof SpecValueTemplates];
type InferTypeFromSpecEntry<O extends Record<string, string>, K extends keyof O> = K extends string ? MatchesSpecKey<K> extends never ? MatchesSpecValue<O[K]> extends never ? string : MatchesSpecValue<O[K]> : MatchesSpecKey<K> : never;

declare const isNotSameType: <T extends SpecTypeKey>(value: Jsonable, type: T) => value is Exclude<vovas_utils.JsonableObject, SpecTypes[T]> | Exclude<undefined, SpecTypes[T]> | Exclude<null, SpecTypes[T]> | Exclude<string, SpecTypes[T]> | Exclude<number, SpecTypes[T]> | Exclude<false, SpecTypes[T]> | Exclude<true, SpecTypes[T]> | Exclude<Jsonable[], SpecTypes[T]>;
declare function makeOutputMatchSpecs<S extends Specs>(output: any, specs: S): MatchingOutput<S>;

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
declare const tryConvert: <T extends keyof SpecTypes>(value: Exclude<vovas_utils.JsonableObject, SpecTypes[T]> | Exclude<undefined, SpecTypes[T]> | Exclude<null, SpecTypes[T]> | Exclude<string, SpecTypes[T]> | Exclude<number, SpecTypes[T]> | Exclude<false, SpecTypes[T]> | Exclude<true, SpecTypes[T]> | Exclude<Jsonable[], SpecTypes[T]>, type: T) => SpecTypes[T] | undefined;

declare const typeOf: (value: any) => keyof SpecTypes | undefined;

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
declare class SpecMismatchException<S extends Specs, HasKey extends boolean, K extends HasKey extends true ? Extract<keyof SpecTypeKeysObject<MatchingOutput<S>>, string> : undefined, T extends Jsonable> extends GenerateException<'specMismatch'> {
    specs: S;
    key: K;
    expectedType: HasKey extends true ? SpecTypeKeysObject<MatchingOutput<S>>[Extract<keyof SpecTypeKeysObject<MatchingOutput<S>>, string>] : SpecTypeKeysSingle<MatchingOutput<S>>;
    actualValue: T;
    constructor(specs: S, key: K, expectedType: HasKey extends true ? SpecTypeKeysObject<MatchingOutput<S>>[Extract<keyof SpecTypeKeysObject<MatchingOutput<S>>, string>] : SpecTypeKeysSingle<MatchingOutput<S>>, actualValue: T);
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

export { EPSTemplate, EPSTemplates, GenerateException, GenerateExceptionType, GenerateMeta, GenerateOptions, GenerateOptionsBase, Generator, GeneratorConfig, InferTypeFromSpecEntry, Inputs, Language, MatchesSpecKey, MatchesSpecValue, MatchesTemplate, MatchingOutput, MatchingOutputTypeKeys, MatchingSpecs, Prelims, Role, SpecKeyTemplates, SpecMismatchException, SpecType, SpecTypeKey, SpecTypeKeys, SpecTypeKeysObject, SpecTypeKeysSingle, SpecTypeOrKey, SpecTypes, SpecValueTemplates, Specs, TemplateExactMatch, TemplateFor, TemplatePrefix, TemplateSuffix, addDefaultOptions, babyNameIdeas, businessIdeas, chat, chatMessage, chatRoles, composeChatPrompt, defaultMeta, defaultOptions, generate, generatePrelims, getPostalCode, improve, isNotSameType, languages, makeOutputMatchSpecs, matchesTemplate, matchingOutputTypeKeys, matchingSpecs, randomAddressLine, serialize, specKeyTemplates, specTypeKey, specTypeKeysIsObject, specValueTemplates, swotAnalysis, templateExactMatch, templateFor, templatePrefix, templateSuffix, translate, tryConvert, typeBasedOnSpecEntry, typeBasedOnSpecKey, typeBasedOnSpecValue, typeOf };
