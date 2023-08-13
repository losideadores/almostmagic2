import _ from 'lodash';
import { ChatCompletionRequestMessageRoleEnum, OpenAIApi, Configuration } from 'openai';
import yaml, { YAMLException } from 'js-yaml';
import { $throw, assign } from 'vovas-utils';

const chatMessage = (role, content) => ({
  role,
  content
});
const chat = _.values(ChatCompletionRequestMessageRoleEnum).reduce((acc, role) => ({
  ...acc,
  [role]: (content) => chatMessage(role, content)
}), {});

const sentenceCase = (str) => _.upperFirst(_.toLower(_.startCase(str)));
const serialize = (obj, sentencify) => yaml.dump(
  sentencify ? Array.isArray(obj) ? obj.map(sentenceCase) : typeof obj === "string" ? sentenceCase(obj) : _.mapKeys(obj, (v, k) => sentenceCase(k)) : obj
).trim();
const envelope = (char) => (str) => `${char}${str}${char}`;
const composeChatPrompt = (outputs, inputs, { description, examples } = {}) => {
  const outputKeys = Array.isArray(outputs) ? outputs : typeof outputs === "string" ? [outputs] : Object.keys(outputs);
  return [
    chat.system(description ?? "You provide structured (YAML-formatted) output based on arbitrary inputs and a specification of the output keys the user wants to receive"),
    ...examples ? [
      ...examples.map((example) => [
        chat.user(serialize(_.pick(example, _.keys(inputs)), false)),
        chat.assistant(serialize(_.pick(example, outputKeys), false))
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
  const openai = new OpenAIApi(new Configuration({
    apiKey: options?.openaiApiKey ?? process.env.OPENAI_API_KEY ?? $throw("OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`")
  }));
  const messages = composeChatPrompt(outputs, inputs, { examples, description });
  console.log({ messages });
  const { data: { choices: [{ message }] } } = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    ...openaiOptions,
    messages
  });
  const rawContent = message?.content;
  meta && assign(meta, { rawContent });
  try {
    return _.mapKeys(
      yaml.load(rawContent ?? ""),
      (__, key) => _.camelCase(key)
    );
  } catch (error) {
    return error instanceof YAMLException ? void 0 : Promise.reject(error);
  }
};
const generateOrThrow = (...args) => generate(...args).then(
  (result) => result ?? $throw("Failed to generate output")
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

export { GenerateMeta, Magic, chat, chatMessage, composeChatPrompt, generate, generateOrThrow, getPostalCode };
