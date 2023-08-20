import yaml from 'js-yaml';
import { GenerateOptions, MatchingSpecs, SpecType, generate, matchingSpecs } from ".";


export const improve = <O extends SpecType | Record<string, SpecType>>(
  output: O,
  requestToImprove: string,
  options: GenerateOptions<MatchingSpecs<O>, { current: string, requestToImprove: string }>
) => generate(matchingSpecs(output), { current: yaml.dump(output), requestToImprove }, options);