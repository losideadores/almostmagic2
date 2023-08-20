import { GenerateOptions } from "./GenerateOptions";
import { generate } from "./generate";
import { Inputs } from "./specs/Inputs";
import { Specs } from "./specs/Specs";

export type GeneratorConfig<O extends Specs, I extends Inputs> =
  GenerateOptions<O, I> & {
    outputSpecs: O,
  }

export class Generator<
  O extends Specs,
  I extends Inputs
> {

  constructor(
    public config: GeneratorConfig<O, I>
  ) { };

  generateFor(inputs: I) {

    const { outputSpecs, ...options } = this.config;
    return generate(outputSpecs, inputs, options);

  };

};