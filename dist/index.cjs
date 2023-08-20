'use strict';

const yaml = require('js-yaml');
const _ = require('lodash');
const openai = require('openai');
const vovasUtils = require('vovas-utils');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const yaml__default = /*#__PURE__*/_interopDefaultCompat(yaml);
const ___default = /*#__PURE__*/_interopDefaultCompat(_);

class GenerateException extends Error {
  constructor(code, meta) {
    super(`${code}:
${yaml.dump(meta)}`);
    this.code = code;
    this.meta = meta;
  }
}
class SpecMismatchException extends GenerateException {
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

const chatMessage = (role, content) => ({
  role,
  content
});
const chat = ___default.values(openai.ChatCompletionRequestMessageRoleEnum).reduce((acc, role) => ({
  ...acc,
  [role]: (content) => chatMessage(role, content)
}), {});

const sentenceCase = (str) => ___default.upperFirst(___default.toLower(___default.startCase(str)));
const serialize = (obj, sentencify) => yaml__default.dump(
  sentencify ? Array.isArray(obj) ? obj.map(sentenceCase) : typeof obj === "string" ? sentenceCase(obj) : ___default.mapKeys(obj, (v, k) => sentenceCase(k)) : obj
).trim();
const envelope = (char) => (str) => `${char}${str}${char}`;
const composeChatPrompt = (outputs, inputs, { description, examples } = {}) => {
  const outputKeys = Array.isArray(outputs) ? outputs : typeof outputs === "string" ? ["output"] : Object.keys(outputs);
  const randomSeed = () => ({ seed: ___default.random(1e3, 9999) });
  return [
    chat.system(description ?? "You come up with (artificially generate) arbitrary data based on arbitrary inputs, using the best of your AI abilities."),
    chat.system(`What the user wants to come up with:
${serialize(outputs, true)}`),
    ...examples ? [
      ...examples.map((example) => [
        chat.user(serialize(
          inputs ? ___default.pick(example, ___default.keys(inputs)) : randomSeed(),
          false
        )),
        chat.assistant(serialize(___default.pick(example, outputKeys), false))
      ]).flat(),
      chat.user(serialize(inputs ?? randomSeed(), false))
    ] : [
      chat.user(`What the user provides:
${serialize(
        inputs ? typeof inputs === "string" ? { input: inputs } : inputs : randomSeed(),
        true
      )}`),
      // chat.system(`Come up with an output based on the input provided by the user as a YAML object with the following keys: ${
      //   outputKeys.map(envelope('`')).join(', ')
      // }. Provide just the YAML object, without any enclosing text or formatting. Do not forget to enclose any strings containing colons in quotes (per YAML syntax).`),
      chat.system(`Come up with an output based on the input provided by the user as a JSON object with the following keys: ${outputKeys.map(envelope("`")).join(", ")}. Provide just the JSON object, without any indents, enclosing text or formatting.`)
    ]
  ];
};

const prelimSpecs = {
  title: "string",
  intro: "string",
  outline: "array of strings, to be further expanded into sections"
};
const generatePrelims = (topic) => generate(prelimSpecs, { topic });

const getPostalCode = (location) => generate("Postal code", location);
const randomAddressLine = (location) => generate("Random but plausible address line", location);
const babyNameIdeas = (request) => generate("Baby name ideas (array of strings)", request);
const businessIdeas = (request) => generate("Business ideas (array of strings)", request);
const swotAnalysis = (idea) => generate({
  strengths: "array",
  weaknesses: "array",
  opportunities: "array",
  threats: "array"
}, { idea });

const matchingOutputTypeKeys = (specs) => typeof specs === "string" ? typeBasedOnSpecValue(specs) ?? "string" : vovasUtils.is.array(specs) ? ___default.zipObject(specs, specs.map((key) => typeBasedOnSpecKey(key) ?? "string")) : vovasUtils.is.jsonableObject(specs) ? ___default.mapValues(specs, (value, key) => typeBasedOnSpecEntry(specs, key) ?? "string") : "string";

const matchingSpecs = (output) => typeof output === "object" ? ___default.mapValues(output, (value) => templateSuffix(value) ?? "string") : templateSuffix(output) ?? "string";

const specTypeKey = (value) => vovasUtils.check(value).if(vovasUtils.is.number, () => "number").if(vovasUtils.is.boolean, () => "boolean").if(vovasUtils.is.string, () => "string").if(
  vovasUtils.is.array,
  (items) => items.every(vovasUtils.is.number) ? "number[]" : items.every(vovasUtils.is.string) ? "string[]" : vovasUtils.$throw("Array items must be either all numbers or all strings")
).else(vovasUtils.shouldNotBe);
const specTypeKeysIsObject = (value) => typeof value === "object";

const specValueTemplates = {
  number: ["number", null, "(number)"],
  boolean: ["boolean", "true if ", "(boolean)"],
  "number[]": [null, "array of numbers", "(array of numbers)"],
  "string[]": [null, "array of strings", "(array of strings)"],
  // (We had to use "list of" instead of "array of" because then it would work for "array of numbers" as well, as it's not possible to define a TypeScript type that would allow us to distinguish between the two.)
  string: [null, "string", "(string)"]
};
const templateFor = (value) => specValueTemplates[specTypeKey(value)];
const templateExactMatch = (value) => templateFor(value)[0];
const templatePrefix = (value) => templateFor(value)[1];
const templateSuffix = (value) => templateFor(value)[2];
const specKeyTemplates = {
  boolean: [null, "is", "Boolean"],
  // Note: This will also be triggered on "normal" words starting with "is", e.g. "island".
  // TODO: Think of a different way to do this (require an underscore prefix, i.e. "is_paid" instead of "isPaid"?)
  "string[]": [null, null, "Array"],
  string: [null, null, "String"]
};

const tryConvert = (value, type) => type === "string" ? vovasUtils.check(value).if(
  vovasUtils.is.array,
  (items) => items.every((item) => typeof item === "number" || typeof item === "string" && /^[^\s]+$/.test(item)) ? items.join(", ") : yaml__default.dump(items)
).if(vovasUtils.is.jsonableObject, yaml__default.dump).else(String) : vovasUtils.check(value).if(
  vovasUtils.is.string,
  (string) => vovasUtils.check(type).if(vovasUtils.is.exactly("number"), () => !isNaN(Number(string)) ? Number(string) : void 0).if(vovasUtils.is.exactly("boolean"), () => /^true|false$/.test(string) ? string === "true" : void 0).if(vovasUtils.is.exactly("string[]"), () => {
    try {
      const result = yaml__default.load(string);
      return Array.isArray(result) && result.length > 0 && result.every((item) => typeof item === "string") ? result : void 0;
    } catch (error) {
      return void 0;
    }
  }).if(vovasUtils.is.exactly("number[]"), () => {
    const result = string.split(",").map((item) => item.trim());
    return result.every((item) => !isNaN(Number(item))) ? result.map((item) => Number(item)) : void 0;
  }).else((type2) => vovasUtils.$throw(`Unexpected type: ${type2}`))
).else(vovasUtils.give.undefined);

const join = (s1, s2) => `${s1}${s2}`;
const typeOf = (value) => {
  const type = typeof value;
  switch (type) {
    case "number":
    case "boolean":
    case "string":
      return type;
    case "object":
      if (Array.isArray(value)) {
        let detectedType;
        for (const item of value) {
          const itemType = typeOf(item);
          if (!detectedType) {
            detectedType = itemType;
          } else if (itemType !== detectedType) {
            return;
          }
        }
        if (detectedType === "string" || detectedType === "number") {
          return join(detectedType, "[]");
        }
      }
  }
};

const findKey = (obj, predicate) => Object.keys(obj).find((key) => predicate(obj[key]));
const endsWith = (str, suffix) => str.endsWith(suffix);
const startsWith = (str, prefix) => str.startsWith(prefix);
const matchesTemplate = (str, [exact, prefix, suffix]) => str === exact || !!prefix && startsWith(str, prefix) || !!suffix && endsWith(str, suffix);
const typeBasedOnSpecValue = (specValue) => findKey(specValueTemplates, (template) => matchesTemplate(specValue, template));
const typeBasedOnSpecKey = (specKey) => findKey(specKeyTemplates, (template) => matchesTemplate(specKey, template));
const typeBasedOnSpecEntry = (spec, key) => typeBasedOnSpecKey(key) || typeBasedOnSpecValue(spec[key]);

const isNotSameType = (value, type) => typeOf(value) !== type;
function makeOutputMatchSpecs(output, specs) {
  if (!vovasUtils.is.jsonable(output))
    throw new GenerateException("outputNotJsonable", { output });
  const expectedTypes = matchingOutputTypeKeys(specs);
  if (specTypeKeysIsObject(expectedTypes)) {
    if (!vovasUtils.is.jsonableObject(output))
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
  } = options ?? {};
  const openai$1 = new openai.OpenAIApi(new openai.Configuration({
    apiKey: options?.openaiApiKey ?? process.env.OPENAI_API_KEY ?? vovasUtils.$throw("OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`")
  }));
  const messages = composeChatPrompt(
    outputSpecs,
    inputs,
    { examples, description }
  );
  if (debug)
    console.log(yaml__default.dump({ messages }));
  const requestData = {
    model: "gpt-3.5-turbo",
    ...openaiOptions,
    messages
  };
  const response = await openai$1.createChatCompletion(requestData);
  const { data: { choices: [{ message }] } } = response;
  const { content } = message ?? {};
  if (debug)
    console.log(content);
  vovasUtils.mutate(meta, { api: { requestData, response } });
  try {
    let result = JSON.parse(content ?? vovasUtils.$throw(new GenerateException("noOutput")));
    if (typeof outputSpecs === "string")
      result = result["output"];
    let matchingResult = makeOutputMatchSpecs(result, outputSpecs);
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
const translate = (text, ...toLanguages) => generate(toLanguages, text);

class Generator {
  constructor(config) {
    this.config = config;
  }
  generateFor(inputs) {
    const { outputSpecs, ...options } = this.config;
    return generate(outputSpecs, inputs, options);
  }
}

const improve = (output, requestToImprove, options) => generate(matchingSpecs(output), { current: yaml__default.dump(output), requestToImprove }, options);

exports.GenerateException = GenerateException;
exports.GenerateMeta = GenerateMeta;
exports.Generator = Generator;
exports.SpecMismatchException = SpecMismatchException;
exports.babyNameIdeas = babyNameIdeas;
exports.businessIdeas = businessIdeas;
exports.chat = chat;
exports.chatMessage = chatMessage;
exports.composeChatPrompt = composeChatPrompt;
exports.defaultMeta = defaultMeta;
exports.generate = generate;
exports.generatePrelims = generatePrelims;
exports.getPostalCode = getPostalCode;
exports.improve = improve;
exports.isNotSameType = isNotSameType;
exports.languages = languages;
exports.makeOutputMatchSpecs = makeOutputMatchSpecs;
exports.matchesTemplate = matchesTemplate;
exports.matchingOutputTypeKeys = matchingOutputTypeKeys;
exports.matchingSpecs = matchingSpecs;
exports.randomAddressLine = randomAddressLine;
exports.serialize = serialize;
exports.specKeyTemplates = specKeyTemplates;
exports.specTypeKey = specTypeKey;
exports.specTypeKeysIsObject = specTypeKeysIsObject;
exports.specValueTemplates = specValueTemplates;
exports.swotAnalysis = swotAnalysis;
exports.templateExactMatch = templateExactMatch;
exports.templateFor = templateFor;
exports.templatePrefix = templatePrefix;
exports.templateSuffix = templateSuffix;
exports.translate = translate;
exports.tryConvert = tryConvert;
exports.typeBasedOnSpecEntry = typeBasedOnSpecEntry;
exports.typeBasedOnSpecKey = typeBasedOnSpecKey;
exports.typeBasedOnSpecValue = typeBasedOnSpecValue;
exports.typeOf = typeOf;
