import yaml from 'js-yaml';
import { GenerateOptions, MatchingSpecs, SpecType, SpecTypeOrDict, generate, matchingSpecs } from ".";


export const improve = <O extends SpecTypeOrDict>(
  output: O,
  requestToImprove: string,
  options: GenerateOptions<MatchingSpecs<O>, { current: string, requestToImprove: string }>
) => generate(matchingSpecs(output), { current: yaml.dump(output), requestToImprove }, options);