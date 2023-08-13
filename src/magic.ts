import { GenerateOptions } from "./GenerateOptions";
import { generate } from "./generate";
import { Inputs } from "./types";
import { PropertySpecs } from "./PropertySpecs";

export type MagicConfig<O extends string, I extends string> =
  GenerateOptions<O | I> & {
    outputs: PropertySpecs<O>
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