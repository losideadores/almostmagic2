import * as vovas_utils from 'vovas-utils';
import { Jsonable } from 'vovas-utils';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { ClientOptions } from 'openai';

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
type SpecTypeNamesDict<T extends SpecTypeOrDict> = T extends Record<string, SpecType> ? {
    [K in keyof T]: SpecTypeName<T[K]>;
} : never;
/**
 * Converts a non-dict-like {@link SpecTypeOrDict} to its corresponding {@link SpecTypeName}. If the input is dict-like {@link SpecTypeOrDict}, returns `never`.
 */
type SpecTypeNamesSingle<T extends SpecTypeOrDict> = T extends SpecType ? SpecTypeName<T> : never;
/**
 * Converts a {@link SpecTypeOrDict} to its corresponding {@link SpecTypeName} (if `T` is a {@link SpecType}) or {@link SpecTypeNamesDict} (if `T` a dict whose values are {@link SpecType}s).
 */
type SpecTypeNames<T extends SpecTypeOrDict> = SpecTypeNamesDict<T> | SpecTypeNamesSingle<T>;
/**
 * A typeguard that checks whether a given value of type {@link SpecTypeNames} is a dict-like, i.e. a {@link SpecTypeNamesDict}.
 *
 * @param value Value to check.
 * @returns `true` (narrowing `value` to {@link SpecTypeNamesDict}) if `value` is a dict-like, `false` (narrowing `value` to {@link SpecTypeNamesSingle}) otherwise.
 */
declare const specTypeKeysIsDict: <T extends SpecTypeOrDict>(value: SpecTypeNames<T>) => value is SpecTypeNamesDict<T>;

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
 * Same as {@link MatchingOutput}, but values are {@link SpecTypeName}s (i.e. strings), not actual {@link SpecType}s.
 */
type MatchingOutputTypeKeys<S extends Specs> = SpecTypeNames<MatchingOutput<S>>;
/**
 * Infers the expected output type(s) for given {@link Specs} in the form of {@link MatchingOutputTypeKeys}.
 *
 * @param specs {@link Specs} to infer the output type for.
 * @returns The {@link MatchingOutputTypeKeys} for given {@link Specs}.
 */
declare function matchingOutputTypeKeys<S extends Specs>(specs: S): MatchingOutputTypeKeys<S>;

/**
 * Infers (as type) the {@link Specs} required to generate output of a given type, represented as a {@link SpecTypeOrDict}. The inferred strings are based on the {@link TemplateExactMatch} part of the {@link SpecValueTemplates} for each {@link SpecType}.
 *
 * @example
 * const outputs = {
 *   groceries: ['apples', 'bananas', 'oranges'],
 *   unitPrices: [1.5, 2, 1],
 *   total: 4.5,
 *   isPaid: true,
 *   notes: 'Buy organic if possible',
 * };
 *
 * type TestSpecs = MatchingSpecs<typeof outputs>;
 * // expected:
 * // type TestSpecs = {
 * //   groceries: "array of strings";
 * //   unitPrices: "array of numbers";
 * //   total: "number";
 * //   isPaid: "boolean";
 * //   notes: "string";
 * // };
 */
type MatchingSpecs<Output extends SpecTypeOrDict> = Output extends SpecType ? TemplateExactMatch<Output> : Output extends Record<string, SpecType> ? {
    [K in keyof Output]: TemplateExactMatch<Output[K]>;
} : never;
/**
 *
 * Returns the specs required to generate an output of the same type as the one provided (@see {@link MatchingSpecs}).
 *
 * @param output Output to infer the specs for.
 * @returns The specs required to generate an output of the same type as the one provided.
 */
declare const matchingSpecs: <Output extends SpecTypeOrDict>(output: Output) => MatchingSpecs<Output>;

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
 * - If the description is exactly "number" or ends with "(number)", the type will be inferred as a `number`.
 * - If the description is exactly "boolean" or starts with "true if " or ends with "(boolean)", the type will be inferred as a `boolean`.
 * - If the description is exactly or starts with "array of numbers" or ends with "(array of numbers)", the type will be inferred as `number[]`.
 * - If the description is exactly or starts with "array of strings" or ends with "(array of strings)", the type will be inferred as `string[]`.
 * - If the description is exactly or starts with "string" or ends with "(string)", the type will be inferred as a `string`.
 * - Otherwise, the type will be inferred as a `string`.
 */
declare const specValueTemplates: {
    readonly number: readonly ["number", null, "(number)"];
    readonly boolean: readonly ["boolean", "true if ", "(boolean)"];
    readonly 'number[]': readonly ["array of numbers", "array of numbers", "(array of numbers)"];
    readonly 'string[]': readonly ["array of strings", "array of strings", "(array of strings)"];
    readonly string: readonly ["string", "string", "(string)"];
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
 * - If the key starts with "is" or ends with "Boolean", the type will be inferred as a `boolean`.
 *   NOTE: This will also be triggered on "normal" words starting with "is", e.g. "island", so avoid such words.
 * - If the key ends with "Array", the type will be inferred as `string[]`.
 * - If the key ends with "String", the type will be inferred as a `string`.
 * - Otherwise, the type will be inferred as a `string` or according to {@link specValueTemplates}, where applicable.
 */
declare const specKeyTemplates: {
    readonly boolean: readonly [null, "is", "Boolean"];
    readonly number: readonly [null, null, "Number"];
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
 * @param type - The type to convert the value to, expressed as a {@link SpecTypeName}.
 * @returns The converted value, or undefined if the conversion failed.
 *
 * Note: We can convert most values to strings, and strings to most other types.
 * Apart from that, we return undefined as we don’t want to make any assumptions.
 */
declare const tryConvert: <T extends keyof SpecTypes>(value: Exclude<undefined, SpecTypes[T]> | Exclude<null, SpecTypes[T]> | Exclude<string, SpecTypes[T]> | Exclude<number, SpecTypes[T]> | Exclude<false, SpecTypes[T]> | Exclude<true, SpecTypes[T]> | Exclude<vovas_utils.JsonableObject, SpecTypes[T]> | Exclude<Jsonable[], SpecTypes[T]>, type: T) => SpecTypes[T] | undefined;

/**
 * Checks if a string matches a given template, narrowing the type of the string accordingly.
 * @template T Type of the template, extending {@link EPSTemplate}.
 * @param {string} str String to check.
 * @param {T} template Template to match against.
 * @returns {boolean} True if the string matches the template, false otherwise.
 */
declare function matchesTemplate<T extends EPSTemplate>(str: string, [exact, prefix, suffix]: T): str is MatchesTemplate<T>;
/**
 * Function to determine the type of a specification based on its value.
 * @param {string} specValue Value of the specification.
 * @returns {SpecType | undefined} The type of the specification if it matches a known type, undefined otherwise.
 */
declare function typeBasedOnSpecValue(specValue: string): SpecType | undefined;
/**
 * Function to determine the type of a specification based on its key.
 * @param {string} specKey Key of the specification.
 * @returns {SpecType | undefined} The type of the specification if it matches a known type, undefined otherwise.
 */
declare function typeBasedOnSpecKey(specKey: string): SpecType | undefined;
/**
 * Function to determine the type of a specification entry based on its key and value.
 * @template S Type of the specification, extending Record<string, string>.
 * @param {S} spec The specification.
 * @param {keyof S} key Key of the specification entry.
 * @returns {SpecType | undefined} The type of the specification entry if it matches a known type, undefined otherwise.
 */
declare function typeBasedOnSpecEntry<S extends Record<string, string>>(spec: S, key: keyof S): SpecType | undefined;

/**
 * Type for exceptions that can be generated.
 */
type GenerateExceptionType = 
/**
 * Indicates that no output was produced when one was expected.
 */
'noOutput'
/**
 * Indicates that the output could not be converted to JSON.
 */
 | 'outputNotJsonable'
/**
 * Indicates that the output is not a JSON object.
 */
 | 'outputNotJsonableObject'
/**
 * Indicates that the output does not match the expected specification (@see {@link Specs}).
 */
 | 'specMismatch'
/**
 * Indicates that an error occurred while processing YAML.
 */
 | 'yamlError';
/**
 * An exception that can be thrown while {@link generate}-ing.
 */
declare class GenerateException<T extends GenerateExceptionType> extends Error {
    readonly code: T;
    readonly meta?: any;
    /**
     * Creates a new {@link GenerateException}.
     * @param code The code for the exception (one of {@link GenerateExceptionType}s).
     * @param meta Additional metadata for the exception.
     */
    constructor(code: T, meta?: any);
}
/**
 * An exception that can be thrown while {@link generate}-ing if the output does not match the expected {@link Specs}.
 */
declare class SpecMismatchException<S extends Specs, HasKey extends boolean, K extends HasKey extends true ? Extract<keyof SpecTypeNamesDict<MatchingOutput<S>>, string> : undefined, T extends Jsonable> extends GenerateException<'specMismatch'> {
    specs: S;
    key: K;
    expectedType: HasKey extends true ? SpecTypeNamesDict<MatchingOutput<S>>[Extract<keyof SpecTypeNamesDict<MatchingOutput<S>>, string>] : SpecTypeNamesSingle<MatchingOutput<S>>;
    actualValue: T;
    /**
     * Creates a new {@link SpecMismatchException}.
     * @param specs The {@link Specs} that were expected.
     * @param key The key of the {@link Specs} for which the mismatch occurred, if any.
     * @param expectedType The expected {@link SpecTypeName}.
     * @param actualValue The actual value that was generated.
     */
    constructor(specs: S, key: K, expectedType: HasKey extends true ? SpecTypeNamesDict<MatchingOutput<S>>[Extract<keyof SpecTypeNamesDict<MatchingOutput<S>>, string>] : SpecTypeNamesSingle<MatchingOutput<S>>, actualValue: T);
}

/**
 * Class representing metadata for the {@link generate} function.
 */
declare class GenerateMeta {
    /** API related data. */
    api?: {
        /** The request data sent to the API. */
        requestData?: ChatCompletionCreateParamsNonStreaming;
        /** The response received from the API. */
        response?: ChatCompletion;
    };
    /** Any error that occurred during the generation. */
    error?: GenerateException<GenerateExceptionType>;
}

/**
 * Base options for the {@link generate} function.
 */
type GenerateOptionsBase = {
    /** The API key for OpenAI. */
    openaiApiKey?: string;
    /** Metadata for the generation. */
    meta?: GenerateMeta;
    /** Description of the generation. */
    description?: string;
    /** If true, debug information will be logged. */
    debug?: boolean;
    /** If true, an error will be thrown if the generation fails. */
    throwOnFailure?: boolean;
} & Partial<Pick<ChatCompletionCreateParamsBase, 'model' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'logit_bias' | 'user'>> & Omit<ClientOptions, 'apiKey'>;
/**
 * An example for the generate function.
 * @template I Input type, extending {@link Inputs}.
 * @template O Output type, extending {@link Specs}.
 * If `I` or `O` extend a `string`, these will be converted to objects with keys `input` and `output` respectively; otherwise (i.e. if `I` or `O` are objects), these will be left as-is.
 * In other words, the resulting type is an object with all the keys of `I` and `O` if those are objects, or with keys `input` and `output` if `I` or `O` are strings (respectively).
 */
type GenerateExample<I extends Inputs, O extends Specs> = (I extends string ? {
    input: I;
} : I) & (MatchingOutput<O> extends string ? {
    output: MatchingOutput<O>;
} : MatchingOutput<O>);
/**
 * Options for the {@link generate} function.
 * @template O Type of the outputs, extending {@link Specs}.
 * @template I Type of the inputs, extending {@link Inputs}.
 * @see {@link ChatCompletionCreateParamsBase} for OpenAI-specific options.
 * @see {@link GenerateOptionsBase} for base options.
 * @see {@link GenerateExample} for examples.
 */
type GenerateOptions<O extends Specs, I extends Inputs> = GenerateOptionsBase & {
    /** The examples to use for the generation. */
    examples?: GenerateExample<I, O>[];
    /** A function to post process the output of the generation. */
    postProcess?: (output: MatchingOutput<O>) => MatchingOutput<O>;
};

/**
 * Defines the roles that can participate in a chat
 */
declare const chatRoles: readonly ["user", "assistant", "system"];
/**
 * Type definition for a chat role, based on {@link chatRoles}.
 */
type Role = typeof chatRoles[number];
/**
 * Creates a chat message with a specific role and content
 * @param role Role of the message sender
 * @param content Content of the message
 * @return Created message as a {@link ChatCompletionMessageParam} (OpenAI API type)
 */
declare const chatMessage: (role: Role, content: string) => ChatCompletionMessageParam;
/**
 * Creates a chat object with methods for each role
 * @return Created object with keys for each role (@see {@link chatRoles}) and values for each role's method, equivalent to {@link chatMessage}(role, content)
 */
declare const chat: Record<"user" | "assistant" | "system", (content: string) => ChatCompletionMessageParam>;

/**
 * Converts the first character of `string` to upper case and the remaining to lower case.
 * @param str String to convert.
 * @returns the converted string.
 */
declare function sentenceCase(str: string): string;
/**
 * Serializes the given object to a YAML string. If `sentencify` is true, it converts the keys to sentence case.
 * @param obj Object to serialize.
 * @param sentencify Whether to convert keys to sentence case (@see {@link sentenceCase}).
 * @returns the resulting YAML string.
 */
declare function serialize(obj: any, sentencify: boolean): string;
/**
 * Returns a function that wraps a string with a given string.
 * @param char String to wrap with.
 * @returns Function that wraps a string with a given string.
 *
 * @example
 * const wrapWithAsterisks = wrapWith('*');
 * wrapWithAsterisks('hello'); // returns '*hello*'
 */
declare function wrapWith(char: string): (str: string) => string;
/**
 * Returns the chat prompt (array of {@link ChatCompletionMessageParam}s) allowing the model to generate the given `outputs` based on the given `inputs`.
 *
 * @template O Type of the outputs, extending {@link Specs}.
 * @template I Type of the inputs, extending {@link Inputs}.
 * @param outputs Outputs that the model should generate.
 * @param inputs Inputs that the model should use to generate the outputs.
 * @param {GenerateOptions<O, I>} options Options for generating the chat prompt.
 * @param {string} options.description Description of the prompt.
 * @param {GenerateExample<I, O>[]} options.examples Examples of inputs and outputs.
 * @returns The chat prompt (array of {@link ChatCompletionMessageParam}s) allowing the model to generate the given `outputs` based on the given `inputs`.
 */
declare const composeChatPrompt: <O extends Specs, I extends Inputs>(outputs: O, inputs?: I | undefined, { description, examples }?: GenerateOptions<O, I>) => ChatCompletionMessageParam[];

/**
 * Example function that generates article title, intro, and outline (array of section titles) for given topic.
 * @param topic Topic to generate the article for.
 * @returns An object with `title`, `intro`, and `outline` properties.
 */
declare const generatePrelims: (topic: string) => Promise<{
    readonly title: string;
    readonly intro: string;
    readonly outline: string[];
} | undefined>;

/**
 * Example function that generates a postal code for a given location.
 * @param location The location to generate the postal code for.
 * @returns A string representing the generated postal code.
 * @example
 * await getPostalCode('New York') // => '10001'
 */
declare function getPostalCode(location: string): Promise<string | undefined>;
/**
 * Example function that generates a random but plausible address line for a given location.
 * @param location The location to generate the address line for. If no location is provided, a general address line is generated.
 * @returns A string representing the generated address line.
 * @example
 * await randomAddressLine('Paris') // => '1 rue de Rivoli'
 * await randomAddressLine() // => '1234 Elm Street'
 */
declare function randomAddressLine(location?: string): Promise<string | undefined>;
/**
 * Example function that generates baby name ideas based on a given request.
 * @param request The request to generate the baby name ideas for. If no request is provided, general baby name ideas are generated.
 * @returns An array of strings representing the generated baby name ideas.
 * @example
 * await babyNameIdeas('Something short but powerful for a boy') // => ['Max', 'Sam', 'Jake']
 */
declare function babyNameIdeas(request?: string): Promise<string[] | undefined>;
/**
 * Example function that generates business ideas based on a given request.
 * @param request The request to generate the business ideas for. If no request is provided, general business ideas are generated.
 * @returns An array of strings representing the generated business ideas.
 * @example
 * await businessIdeas('Related to the environment') // => ['Eco-friendly packaging', 'Solar power installation', 'Composting service']
 */
declare function businessIdeas(request?: string): Promise<string[] | undefined>;
/**
 * Example function that generates a SWOT analysis for a given idea.
 * @param idea The idea to generate the SWOT analysis for.
 * @returns An object with `strengths`, `weaknesses`, `opportunities`, and `threats` properties, each an array of strings representing the respective elements of the SWOT analysis.
 * @example
 * await swotAnalysis('Online tutoring service')
 * // => {
 * //   strengths: ['Flexible schedule', 'Low overhead'],
 * //   weaknesses: ['Internet dependency', 'High competition'],
 * //   opportunities: ['Increase in remote learning', 'Global market'],
 * //   threats: ['Technical issues', 'Market saturation']
 * // }
 */
declare function swotAnalysis(idea: string): Promise<{
    readonly strengths: string[];
    readonly weaknesses: string[];
    readonly opportunities: string[];
    readonly threats: string[];
} | undefined>;

/**
 * Array of language codes representing the languages supported by the {@link translate} function.
 * @example
 * console.log(languages) // => ['en', 'fr', 'de', ...]
 */
declare const languages: readonly ["en", "fr", "de", "es", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi", "bn", "pa", "te", "mr", "ta", "ur", "gu", "kn", "ml", "sd", "or", "as", "bh", "ks", "ne", "si", "sa", "my", "km", "lo", "th", "lo", "vi", "id", "ms", "tl", "jv", "su", "tl", "ceb", "ny", "ha", "yo", "ig", "yo", "zu", "xh", "st", "tn", "sn", "so", "rw", "rn", "ny", "lg", "sw", "mg", "eo", "cy", "eu", "gl", "ca", "ast", "eu", "qu", "ay", "gn", "tt", "ug", "dz", "bo", "ii", "chr", "iu", "oj", "cr", "km", "mn", "yi", "he", "yi", "ur", "ar", "fa", "ps", "ks", "sd"];
/**
 * Type representing a language code from the {@link languages} array.
 */
type Language = (typeof languages)[number];
/**
 * Example function that translates a given text into the specified languages.
 * @param text The text to translate.
 * @param toLanguages The languages to translate the text into. Each language should be represented by its code from the {@link languages} array (type {@link Language}).
 * @returns An object where each key is a language code and the corresponding value is the translation of the text into that language.
 * @example
 * await translate('Hello, world!', 'fr', 'de') // => { fr: 'Bonjour, monde!', de: 'Hallo, Welt!' }
 */
declare function translate<T extends Language[]>(text: string, ...toLanguages: T): Promise<MatchingOutput<T> | undefined>;

/**
 * Default metadata for the generate function.
 */
declare const defaultMeta: GenerateMeta;
/**
 * Default options for the generate function.
 */
declare const defaultOptions: GenerateOptionsBase;
/**
 * Function to add default options to the generate function.
 * @param options - The options to add.
 */
declare function addDefaultOptions(options: GenerateOptionsBase): void;
/**
 * Generates, using OpenAI's API, data according to given output specifications and inputs.
 * @template O Type of the outputs, extending {@link Specs}.
 * @template I Type of the inputs, extending {@link Inputs}.
 * @param {O} outputSpecs Output specifications for the generation.
 * @param {I} [inputs] Inputs for the generation.
 * @param {GenerateOptions<O, I>} [options] Options for the generation.
 * @returns {Promise<MatchingOutput<O> | undefined>} Generated data according to the output specifications, or undefined if the generation failed and `options.throwOnFailure` is false.
 * @throws {Error} if an error occurred and `options.throwOnFailure` is true.
 */
declare function generate<O extends Specs, I extends Inputs>(outputSpecs: O, inputs?: I, options?: GenerateOptions<O, I>): Promise<MatchingOutput<O> | undefined>;

/**
 * Class that, when instantiated, provides a handier alternative to the {@link generate} function if you want to reuse the same generation configuration (e.g. `openaiApiKey`, `dangerouslyAllowBrowser`, etc.) from multiple places.
 */
declare class Generator<O extends Specs, I extends Inputs> {
    options: GenerateOptionsBase;
    /**
     * Creates a new Generator with the given options.
     */
    constructor(options: GenerateOptionsBase);
    /**
     * Generates data using the Generator's configuration. @see {@link generate} for more information.
     */
    generate<I extends Inputs, O extends Specs>(outputSpecs: O, inputs?: I, additionalOptions?: GenerateOptions<O, I>): Promise<MatchingOutput<O> | undefined>;
}

/**
 * Improves the output of the {@link generate} function by providing a request to improve the output.
 *
 * @param output Current output.
 * @param requestToImprove Request to improve the output, as a free-form string (e.g. "Make the output more human-readable")
 * @param options Options for the generation.
 * @returns The improved output.
 */
declare const improve: <O extends SpecTypeOrDict>(output: O, requestToImprove: string, options: GenerateOptions<MatchingSpecs<O>, {
    current: string;
    requestToImprove: string;
}>) => Promise<MatchingOutput<MatchingSpecs<O>> | undefined>;

export { EPSTemplate, GenerateExample, GenerateException, GenerateExceptionType, GenerateMeta, GenerateOptions, GenerateOptionsBase, Generator, InferTypeFromKey, InferTypeFromSpecEntry, InferTypeFromValue, Inputs, Language, MatchesTemplate, MatchingOutput, MatchingOutputTypeKeys, MatchingSpecs, Role, SpecKeyTemplates, SpecMismatchException, SpecType, SpecTypeName, SpecTypeNames, SpecTypeNamesDict, SpecTypeNamesSingle, SpecTypeOrDict, SpecTypes, SpecValueTemplates, Specs, TemplateExactMatch, TemplateFor, TemplatePrefix, TemplateSuffix, addDefaultOptions, babyNameIdeas, businessIdeas, castToSpecs, chat, chatMessage, chatRoles, composeChatPrompt, defaultMeta, defaultOptions, generate, generatePrelims, getPostalCode, improve, isNotSameType, languages, matchesTemplate, matchingOutputTypeKeys, matchingSpecs, randomAddressLine, sentenceCase, serialize, specKeyTemplates, specTypeKey, specTypeKeysIsDict, specValueTemplates, swotAnalysis, templateExactMatch, templateFor, templatePrefix, templateSuffix, translate, tryConvert, typeBasedOnSpecEntry, typeBasedOnSpecKey, typeBasedOnSpecValue, wrapWith };
