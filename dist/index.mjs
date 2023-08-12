import _ from 'lodash';
import { ChatCompletionRequestMessageRoleEnum, OpenAIApi, Configuration } from 'openai';
import yaml, { YAMLException } from 'js-yaml';
import { config } from 'dotenv';
import { prompt } from 'enquirer';
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
const serialize = (obj) => yaml.dump(
  Array.isArray(obj) ? obj.map(sentenceCase) : typeof obj === "string" ? sentenceCase(obj) : _.mapKeys(obj, (v, k) => sentenceCase(k))
).trim();
const envelope = (char) => (str) => `${char}${str}${char}`;
const composeChatPrompt = (outputs, inputs, { description, examples } = {}) => {
  const outputKeys = (Array.isArray(outputs) ? outputs : typeof outputs === "string" ? [outputs] : Object.keys(outputs)).map(sentenceCase);
  return [
    chat.system(description ?? "You provide structured (YAML-formatted) output based on arbitrary inputs and a specification of the output keys the user wants to receive"),
    ...examples ? examples.map((example) => [
      chat.user(serialize(_.pick(example, _.keys(inputs)))),
      chat.assistant(serialize(_.pick(example, outputKeys)))
    ]).flat() : [
      chat.user(`What the user wants to infer:
${serialize(outputs)}`)
    ],
    chat.user(serialize(inputs)),
    ...examples ? [] : [
      chat.user(`Infer the output below as a YAML object with the following keys: ${outputKeys.map(envelope("`")).join(", ")} and primitive (string/number/boolean/null) values. Do not include any additional text or keys.`)
    ]
  ];
};

const generate = async (outputs, inputs, options) => {
  const { openaiApiKey, meta, ...openaiOptions } = options ?? {};
  const openai = new OpenAIApi(new Configuration({
    apiKey: options?.openaiApiKey ?? process.env.OPENAI_API_KEY ?? $throw("OpenAI API key is required either as `options.openaiApiKey` or as `process.env.OPENAI_API_KEY`")
  }));
  const messages = composeChatPrompt(outputs, inputs);
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

class GenerateMeta {
}

if (require.main === module) {
  run();
}
async function run() {
  config();
  debugger;
  const { example } = await prompt({
    type: "select",
    name: "example",
    message: "Which example do you want to run?",
    choices: [
      { message: "Come up with a person\u2019s name based on their email address", name: "name-from-email" },
      { message: "Describe a nation\u2019s attitude to a certain topic", name: "nation-attitude" }
      // tbd
    ]
  });
  const meta = new GenerateMeta();
  try {
    switch (example) {
      case "name-from-email":
        const { email } = await prompt({
          type: "input",
          name: "email",
          message: "Enter an email address"
        });
        const { firstName, lastName } = await generateOrThrow(["firstName", "lastName"], { email }, { meta });
        console.log({ firstName, lastName });
        break;
      case "nation-attitude":
        const { nation, topic } = await prompt([
          {
            type: "input",
            name: "nation",
            message: "Enter a nation"
          },
          {
            type: "input",
            name: "topic",
            message: "Enter a topic"
          }
        ]);
        const { attitude } = await generateOrThrow({
          attitude: "Detailed description of a nation's attitude to a certain topic, including any historical context, current events, and future forecasts."
        }, { nation, topic }, { meta });
        console.log({ attitude });
      default:
        break;
    }
    ;
  } catch (err) {
    console.log({ meta });
  }
}

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

export { GenerateMeta, Magic, chat, chatMessage, composeChatPrompt, generate, generateOrThrow, getPostalCode, run };
