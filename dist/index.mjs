import yaml, { dump } from 'js-yaml';
import _ from 'lodash';
import OpenAI from 'openai';
import { asTypeguard, is, $throw, check, give, mutate } from 'vovas-utils';

class GenerateException extends Error {
  /**
   * Creates a new {@link GenerateException}.
   * @param code The code for the exception (one of {@link GenerateExceptionType}s).
   * @param meta Additional metadata for the exception.
   */
  constructor(code, meta) {
    super(`${code}:
${dump(meta)}`);
    this.code = code;
    this.meta = meta;
  }
}
class SpecMismatchException extends GenerateException {
  /**
   * Creates a new {@link SpecMismatchException}.
   * @param specs The {@link Specs} that were expected.
   * @param key The key of the {@link Specs} for which the mismatch occurred, if any.
   * @param expectedType The expected {@link SpecTypeName}.
   * @param actualValue The actual value that was generated.
   */
  constructor(specs, key, expectedType, actualValue) {
    super("specMismatch", { specs, key, expectedType, actualValue });
    this.specs = specs;
    this.key = key;
    this.expectedType = expectedType;
    this.actualValue = actualValue;
  }
}

class GenerateMeta {
}

const chatRoles = ["user", "assistant", "system"];
const chatMessage = (role, content) => ({
  role,
  content
});
const chat = chatRoles.reduce((acc, role) => ({
  ...acc,
  [role]: (content) => chatMessage(role, content)
}), {});

function sentenceCase(str) {
  return _.upperFirst(_.toLower(_.startCase(str)));
}
function serialize(obj, sentencify) {
  return yaml.dump(
    sentencify ? Array.isArray(obj) ? obj.map(sentenceCase) : typeof obj === "string" ? sentenceCase(obj) : _.mapKeys(obj, (v, k) => sentenceCase(k)) : obj
  ).trim();
}
function wrapWith(char) {
  return (str) => `${char}${str}${char}`;
}
const composeChatPrompt = (outputs, inputs, { description, examples } = {}) => {
  const outputKeys = Array.isArray(outputs) ? outputs : typeof outputs === "string" ? ["output"] : Object.keys(outputs);
  const randomSeed = () => ({ randomSeedDoNotMention: _.random(1e3, 9999) });
  return [
    chat.system(description ?? "You come up with (artificially generate) arbitrary data based on arbitrary inputs, using the best of your AI abilities."),
    chat.system(`What the user wants to come up with:
${serialize(outputs, true)}`),
    ...examples ? [
      ...examples.map((example) => [
        chat.user(serialize(
          inputs ? _.pick(example, _.keys(inputs)) : randomSeed(),
          false
        )),
        chat.assistant(serialize(_.pick(example, outputKeys), false))
      ]).flat(),
      chat.user(serialize(inputs ?? randomSeed(), false))
    ] : [
      chat.user(`What the user provides:
${serialize(
        inputs ? typeof inputs === "string" ? { input: inputs } : inputs : randomSeed(),
        true
      )}`),
      chat.system(`Come up with an output based on the input provided by the user as a JSON object with the following keys: ${outputKeys.map(wrapWith("`")).join(", ")}. Provide just the JSON object, without any indents, enclosing text or formatting.`)
    ]
  ];
};

const generatePrelims = (topic) => generate({
  title: "article title",
  intro: "article intro",
  outline: "section titles (array of strings)"
}, { topic });

function getPostalCode(location) {
  return generate("Postal code", location);
}
function randomAddressLine(location) {
  return generate("Random but plausible address line", location);
}
function babyNameIdeas(request) {
  return generate("Baby name ideas (array of strings)", request);
}
function businessIdeas(request) {
  return generate("Business ideas (array of strings)", request);
}
function swotAnalysis(idea) {
  return generate({
    strengths: "array of strings",
    weaknesses: "array of strings",
    opportunities: "array of strings",
    threats: "array of strings"
  }, { idea });
}

function matchingOutputTypeKeys(specs) {
  return typeof specs === "string" ? typeBasedOnSpecValue(specs) ?? "string" : asTypeguard(is.array)(specs) ? _.zipObject(specs, specs.map((key) => typeBasedOnSpecKey(key) ?? "string")) : is.jsonableObject(specs) ? _.mapValues(specs, (value, key) => typeBasedOnSpecEntry(specs, key) ?? "string") : "string";
}

const matchingSpecs = (output) => typeof output === "object" ? _.mapValues(output, (value) => templateSuffix(value) ?? "string") : templateSuffix(output) ?? "string";

const specTypeKey = (value) => is.number(value) ? "number" : is.boolean(value) ? "boolean" : is.string(value) ? "string" : is.array(value) ? _.every(value, is.number) ? "number[]" : _.every(value, is.string) ? "string[]" : $throw("Array items must be either all numbers or all strings") : $throw("Unsupported value type: " + typeof value);
const specTypeKeysIsDict = (value) => typeof value === "object";

const specValueTemplates = {
  number: ["number", null, "(number)"],
  boolean: ["boolean", "true if ", "(boolean)"],
  "number[]": ["array of numbers", "array of numbers", "(array of numbers)"],
  "string[]": ["array of strings", "array of strings", "(array of strings)"],
  string: ["string", "string", "(string)"]
};
const templateFor = (value) => specValueTemplates[specTypeKey(value)];
const templateExactMatch = (value) => templateFor(value)[0];
const templatePrefix = (value) => templateFor(value)[1];
const templateSuffix = (value) => templateFor(value)[2];
const specKeyTemplates = {
  boolean: [null, "is", "Boolean"],
  // Note: This will also be triggered on "normal" words starting with "is", e.g. "island".
  // TODO: Think of a different way to do this (require an underscore prefix, i.e. "is_paid" instead of "isPaid"?)
  // TODO: Make values take precedence over keys to override this by explicitly specifying a type in the description (e.g. { island: 'string' }})
  number: [null, null, "Number"],
  "string[]": [null, null, "Array"],
  string: [null, null, "String"]
};

const tryConvert = (value, type) => type === "string" ? check(value).if(
  asTypeguard(is.array),
  (items) => items.every((item) => typeof item === "number" || typeof item === "string" && /^[^\s]+$/.test(item)) ? items.join(", ") : yaml.dump(items)
).if(is.jsonableObject, yaml.dump).else(String) : check(value).if(
  is.string,
  (string) => check(type).if(is.exactly("number"), () => !isNaN(Number(string)) ? Number(string) : void 0).if(is.exactly("boolean"), () => /^true|false$/.test(string) ? string === "true" : void 0).if(is.exactly("string[]"), () => {
    try {
      const result = yaml.load(string);
      return Array.isArray(result) && result.length > 0 && result.every((item) => typeof item === "string") ? result : void 0;
    } catch (error) {
      return void 0;
    }
  }).if(is.exactly("number[]"), () => {
    const result = string.split(",").map((item) => item.trim());
    return result.every((item) => !isNaN(Number(item))) ? result.map((item) => Number(item)) : void 0;
  }).else((type2) => $throw(`Unexpected type: ${type2}`))
).else(give.undefined);

const findKey = (obj, predicate) => Object.keys(obj).find((key) => predicate(obj[key]));
const endsWith = (str, suffix) => str.endsWith(suffix);
const startsWith = (str, prefix) => str.startsWith(prefix);
function matchesTemplate(str, [exact, prefix, suffix]) {
  return str === exact || !!prefix && startsWith(str, prefix) || !!suffix && endsWith(str, suffix);
}
function typeBasedOnSpecValue(specValue) {
  return findKey(specValueTemplates, (template) => matchesTemplate(specValue, template));
}
function typeBasedOnSpecKey(specKey) {
  return findKey(specKeyTemplates, (template) => matchesTemplate(specKey, template));
}
function typeBasedOnSpecEntry(spec, key) {
  return typeBasedOnSpecKey(key) || typeBasedOnSpecValue(spec[key]);
}

function isNotSameType(value, type) {
  return specTypeKey(value) !== type;
}
function castToSpecs(output, specs) {
  if (!is.jsonable(output))
    throw new GenerateException("outputNotJsonable", { output });
  const expectedTypes = matchingOutputTypeKeys(specs);
  if (specTypeKeysIsDict(expectedTypes)) {
    if (!is.jsonableObject(output))
      throw new GenerateException("outputNotJsonableObject", { output });
    for (const key in expectedTypes) {
      const expectedType = expectedTypes[key];
      const actualValue = output[key];
      if (isNotSameType(actualValue, expectedType)) {
        const convertedValue = tryConvert(actualValue, expectedType);
        if (typeof convertedValue === void 0)
          throw new SpecMismatchException(specs, key, expectedType, actualValue);
        output[key] = convertedValue;
      }
    }
  } else {
    if (isNotSameType(output, expectedTypes)) {
      const convertedValue = tryConvert(output, expectedTypes);
      if (typeof convertedValue === void 0)
        throw new SpecMismatchException(specs, void 0, expectedTypes, output);
      output = convertedValue;
    }
  }
  return output;
}

const defaultMeta = new GenerateMeta();
const defaultOptions = {};
function addDefaultOptions(options) {
  Object.assign(defaultOptions, options);
}
async function generate(outputSpecs, inputs, options) {
  const {
    openaiApiKey,
    examples,
    debug,
    description,
    meta = defaultMeta,
    throwOnFailure,
    postProcess,
    ...openaiOptions
  } = {
    ...defaultOptions,
    ...options
  };
  const openaiRequestOptionKeys = [
    "model",
    "temperature",
    "top_p",
    "max_tokens",
    "presence_penalty",
    "frequency_penalty",
    "logit_bias",
    "user"
  ];
  const openaiRequestOptions = _.pick(openaiOptions, openaiRequestOptionKeys);
  const openaiConfigOptions = _.omit(openaiOptions, openaiRequestOptionKeys);
  const openai = new OpenAI({
    apiKey: openaiApiKey ?? process.env.OPENAI_API_KEY ?? $throw("OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`"),
    ...openaiConfigOptions
  });
  const messages = composeChatPrompt(
    outputSpecs,
    inputs,
    { examples, description }
  );
  if (debug)
    console.log(yaml.dump({ messages }));
  const requestData = {
    model: "gpt-3.5-turbo",
    ...openaiRequestOptions,
    messages
  };
  const response = await openai.chat.completions.create(requestData);
  const { choices: [{ message }] } = response;
  const { content } = message ?? {};
  if (debug)
    console.log(content);
  mutate(meta, { api: { requestData, response } });
  try {
    let result = JSON.parse(content ?? $throw(new GenerateException("noOutput")));
    if (typeof outputSpecs === "string")
      result = result["output"];
    let matchingResult = castToSpecs(result, outputSpecs);
    if (postProcess)
      matchingResult = postProcess(matchingResult);
    return matchingResult;
  } catch (error) {
    if (error instanceof SyntaxError)
      error = new GenerateException("outputNotJsonable", { content, ...error });
    if (error instanceof GenerateException && !throwOnFailure)
      return;
    throw error;
  }
}

const languages = [
  "en",
  "fr",
  "de",
  "es",
  "it",
  "pt",
  "ru",
  "ja",
  "ko",
  "zh",
  "ar",
  "hi",
  "bn",
  "pa",
  "te",
  "mr",
  "ta",
  "ur",
  "gu",
  "kn",
  "ml",
  "sd",
  "or",
  "as",
  "bh",
  "ks",
  "ne",
  "si",
  "sa",
  "my",
  "km",
  "lo",
  "th",
  "lo",
  "vi",
  "id",
  "ms",
  "tl",
  "jv",
  "su",
  "tl",
  "ceb",
  "ny",
  "ha",
  "yo",
  "ig",
  "yo",
  "zu",
  "xh",
  "st",
  "tn",
  "sn",
  "so",
  "rw",
  "rn",
  "ny",
  "lg",
  "sw",
  "mg",
  "eo",
  "cy",
  "eu",
  "gl",
  "ca",
  "ast",
  "eu",
  "qu",
  "ay",
  "gn",
  "tt",
  "ug",
  "dz",
  "bo",
  "ii",
  "chr",
  "iu",
  "oj",
  "cr",
  "km",
  "mn",
  "yi",
  "he",
  "yi",
  "ur",
  "ar",
  "fa",
  "ps",
  "ks",
  "sd"
];
function translate(text, ...toLanguages) {
  return generate(toLanguages, text);
}

class Generator {
  /**
   * Creates a new Generator.
   * @param {GeneratorConfig<O, I>} config Configuration for the Generator.
   */
  constructor(outputSpecs, options) {
    this.outputSpecs = outputSpecs;
    this.options = options;
  }
  /**
   * Generates data for the given inputs using the Generator's configuration. @see {@link generate} for more information.
   * @param {I} inputs Inputs for the generation.
   * @returns {Promise<MatchingOutput<O> | undefined>} Generated data according to the output specifications, or undefined if the generation failed and `options.throwOnFailure` is false.
   * @throws {Error} if an error occurred and `options.throwOnFailure` is true.
   */
  generateFor(inputs) {
    const { outputSpecs, options } = this;
    return generate(outputSpecs, inputs, options);
  }
}

const improve = (output, requestToImprove, options) => generate(matchingSpecs(output), { current: yaml.dump(output), requestToImprove }, options);

export { GenerateException, GenerateMeta, Generator, SpecMismatchException, addDefaultOptions, babyNameIdeas, businessIdeas, castToSpecs, chat, chatMessage, chatRoles, composeChatPrompt, defaultMeta, defaultOptions, generate, generatePrelims, getPostalCode, improve, isNotSameType, languages, matchesTemplate, matchingOutputTypeKeys, matchingSpecs, randomAddressLine, sentenceCase, serialize, specKeyTemplates, specTypeKey, specTypeKeysIsDict, specValueTemplates, swotAnalysis, templateExactMatch, templateFor, templatePrefix, templateSuffix, translate, tryConvert, typeBasedOnSpecEntry, typeBasedOnSpecKey, typeBasedOnSpecValue, wrapWith };
