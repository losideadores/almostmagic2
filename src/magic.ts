import { GenerateOptions } from "./GenerateOptions";
import { generate } from "./generate";
import { Inputs, Outputs } from "./types";

export type MagicConfig<O extends string, I extends string> =
  GenerateOptions<O | I> & {
    outputs: Outputs<O>
  }

export class Magic<
  O extends string,
  I extends string,
> {

  constructor(
    public config: MagicConfig<O, I>
  ) { };

  generateFor(inputs: Inputs<I>) {

    const { outputs, ...options } = this.config;
    return generate(outputs, inputs, options);

  };

};