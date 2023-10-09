import yaml from 'js-yaml';
import { GenerateOptions, MatchingSpecs, SpecType, SpecTypeOrDict, generate, matchingSpecs } from ".";


/**
 * Improves the output of the {@link generate} function by providing a request to improve the output.
 * 
 * @param output Current output.
 * @param requestToImprove Request to improve the output, as a free-form string (e.g. "Make the output more human-readable")
 * @param options Options for the generation.
 * @returns The improved output.
 */
export const improve = <O extends SpecTypeOrDict>(
  output: O,
  requestToImprove: string,
  options: GenerateOptions<MatchingSpecs<O>, { current: string, requestToImprove: string }>
) => generate(matchingSpecs(output), { current: yaml.dump(output), requestToImprove }, options);