'use strict';

const _ = require('lodash');
const openai = require('openai');
const yaml = require('js-yaml');
const vovasUtils = require('vovas-utils');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ___default = /*#__PURE__*/_interopDefaultCompat(_);
const yaml__default = /*#__PURE__*/_interopDefaultCompat(yaml);

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
  const outputKeys = Array.isArray(outputs) ? outputs : typeof outputs === "string" ? [outputs] : Object.keys(outputs);
  return [
    chat.system(description ?? "You provide structured (YAML-formatted) output based on arbitrary inputs and a specification of the output keys the user wants to receive"),
    ...examples ? [
      ...examples.map((example) => [
        chat.user(serialize(___default.pick(example, ___default.keys(inputs)), false)),
        chat.assistant(serialize(___default.pick(example, outputKeys), false))
      ]).flat(),
      chat.user(serialize(inputs, false))
    ] : [
      chat.user(`What the user wants to infer:
${serialize(outputs, true)}`),
      chat.user(`What the user provides:
${serialize(inputs, true)}`)
    ],
    ...examples ? [] : [
      chat.user(`Infer the output below as a YAML object with the following keys: ${outputKeys.map(envelope("`")).join(", ")} and primitive (string/number/boolean/null) values. Do not include any additional text or keys.`)
    ]
  ];
};

const generate = async (outputs, inputs, options) => {
  const { openaiApiKey, examples, description, meta, ...openaiOptions } = options ?? {};
  const openai$1 = new openai.OpenAIApi(new openai.Configuration({
    apiKey: options?.openaiApiKey ?? process.env.OPENAI_API_KEY ?? vovasUtils.$throw("OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`")
  }));
  const messages = composeChatPrompt(outputs, inputs, { examples, description });
  console.log({ messages });
  const { data: { choices: [{ message }] } } = await openai$1.createChatCompletion({
    model: "gpt-3.5-turbo",
    ...openaiOptions,
    messages
  });
  const rawContent = message?.content;
  meta && vovasUtils.assign(meta, { rawContent });
  try {
    return ___default.mapKeys(
      yaml__default.load(rawContent ?? ""),
      (__, key) => ___default.camelCase(key)
    );
  } catch (error) {
    return error instanceof yaml.YAMLException ? void 0 : Promise.reject(error);
  }
};
const generateOrThrow = (...args) => generate(...args).then(
  (result) => result ?? vovasUtils.$throw("Failed to generate output")
);

const getPostalCode = (city) => generate("postalCode", { city });

class Magic {
  constructor(config) {
    this.config = config;
  }
  generateFor(inputs) {
    const { outputs, ...options } = this.config;
    return generate(outputs, inputs, options);
  }
}

class GenerateMeta {
}

exports.GenerateMeta = GenerateMeta;
exports.Magic = Magic;
exports.chat = chat;
exports.chatMessage = chatMessage;
exports.composeChatPrompt = composeChatPrompt;
exports.generate = generate;
exports.generateOrThrow = generateOrThrow;
exports.getPostalCode = getPostalCode;
