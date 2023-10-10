import { GenerateOptions, GenerateOptionsBase } from "./GenerateOptions";
import { generate } from "./generate";
import { Inputs } from "./specs/Inputs";
import { Specs } from "./specs/Specs";

/**
 * Class that, when instantiated, provides a handier alternative to the {@link generate} function if you want to reuse the same generation configuration (e.g. `openaiApiKey`, `dangerouslyAllowBrowser`, etc.) from multiple places.
 */
export class Generator<
  O extends Specs,
  I extends Inputs
> {

  /**
   * Creates a new Generator with the given options.
   */
  constructor(
    public options: GenerateOptionsBase
  ) { };

  /**
   * Generates data using the Generator's configuration. @see {@link generate} for more information.
   */
  generate<I extends Inputs, O extends Specs>(
    outputSpecs: O,
    inputs?: I,
    additionalOptions?: GenerateOptions<O, I>
  ) {
    return generate(outputSpecs, inputs, {
      ...this.options,
      ...additionalOptions
    });
  };

};