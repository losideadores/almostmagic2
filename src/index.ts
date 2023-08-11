import { ChatCompletionRequestMessage } from "openai";

export type GenerateConfig<
  // What to generate (outputs)
  O extends string,
  // What to generate from (inputs)
  I extends string,
> = [
  // Either array of inputs or an object with keys as inputs and values as descriptions
  I[] | Record<I, string>,
  // Object with keys as outputs and values as descriptions
  Record<O, string>,
];

export function composeChatPrompt<O extends string, I extends string>(
  ...[ outputs, inputs ]: GenerateConfig<O, I>
): ChatCompletionRequestMessage[] {

  throw new Error("Not implemented");

};