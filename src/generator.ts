import { GenerateOptions } from "./GenerateOptions";
import { generate } from "./generate";
import { Inputs } from "./specs/Inputs";
import { Specs } from "./specs/Specs";

/**
 * Type for the configuration of a {@link Generator}.
 * @template O Type of the outputs, extending {@link Specs}.
 * @template I Type of the inputs, extending {@link Inputs}.
 * @property {O} outputSpecs Output specifications for the generation (@see {@link Specs}).
 * @property {GenerateOptions<O, I>} options Options for the generation.
 */
export type GeneratorConfig<O extends Specs, I extends Inputs> =
  GenerateOptions<O, I> & {
    outputSpecs: O,
  }

/**
 * Class representing a Generator. This can be a handier alternative to the {@link generate} function if you want to reuse the same generation configuration (e.g. OpenAI API key, output specifications, etc.) from multiple places.
 * @template O Type of the outputs, extending {@link Specs}.
 * @template I Type of the inputs, extending {@link Inputs}.
 */
export class Generator<
  O extends Specs,
  I extends Inputs
> {

  /**
   * Creates a new Generator.
   * @param {GeneratorConfig<O, I>} config Configuration for the Generator.
   */
  constructor(
    public config: GeneratorConfig<O, I>
  ) { };

  /**
   * Generates data for the given inputs using the Generator's configuration. @see {@link generate} for more information.
   * @param {I} inputs Inputs for the generation.
   * @returns {Promise<MatchingOutput<O> | undefined>} Generated data according to the output specifications, or undefined if the generation failed and `options.throwOnFailure` is false.
   * @throws {Error} if an error occurred and `options.throwOnFailure` is true.
   */
  generateFor(inputs: I) {

    const { outputSpecs, ...options } = this.config;
    return generate(outputSpecs, inputs, options);

  };

};