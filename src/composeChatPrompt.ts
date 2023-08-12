import dedent from "dedent-js";
import { chat } from "./chatMessage";
import { Inputs, Outputs } from "./types";
import _ from "lodash";

export const composeChatPrompt = <O extends string, I extends string>(
  outputs: Outputs<O>,
  inputs?: Inputs<I>
) => {

  const outputKeys =
    Array.isArray(outputs)
      ? outputs
      : typeof outputs === "string"
        ? [outputs]
        : Object.keys(outputs);

  return [
    chat.system('You emulate a JavaScript console.'),

    chat.user(dedent`
    import AI from 'ai-llm-inference'; // the package allows inferring any textual data in a structured way using a large language model

    let ai = new AI({ outputs: ${JSON.stringify(outputs)} });
  `),

    chat.assistant('undefined'),
    // (We want to prime the model to provide an "authentic" experience, so using a `let` clause returns `undefined`.)
    chat.user(dedent`
    let inputs = ${JSON.stringify(inputs ?? { seed: _.random(1000, 9999) })};
    let outputs = ai.infer( inputs );
    JSON.stringify( Object.keys( outputs ) );
  `),

    chat.assistant(JSON.stringify(outputKeys)),
    // (Here, we want to achieve two things:
    // 1. Make sure the model "understands" how we expect it to present JSON-stringified data
    // 2. Make sure it knows which keys we expect in the next step)

    chat.user('JSON.stringify( outputs )'),
    // If all goes well, the model should return a JSON-stringified object with the keys we expect and the values we want. This is kind of an “inception” moment, where we ask the model to pretend to be itself, thus inferring the data we want it to infer.
    // (A double inception is that the comment above is also inferred by the model, just like this one.).
  ];

};