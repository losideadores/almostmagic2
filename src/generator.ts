import { GenerateOptions } from "./GenerateOptions";
import { generate } from "./generate";
import { Inputs } from "./types";
import { Specs } from "./Specs";

export type GeneratorConfig<O extends Specs<string>, I extends Inputs<string>> =
  GenerateOptions<O, I> & {
    outputSpecs: O,
  }

export class Generator<
  O extends Specs<string>,
  I extends Inputs<string>
> {

  constructor(
    public config: GeneratorConfig<O, I>
  ) { };

  generateFor(inputs: I) {

    const { outputSpecs, ...options } = this.config;
    return generate(outputSpecs, inputs, options);

  };

};