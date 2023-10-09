import { generate } from "..";

/**
 * Example function that generates a postal code for a given location.
 * @param location The location to generate the postal code for.
 * @returns A string representing the generated postal code.
 * @example
 * await getPostalCode('New York') // => '10001'
 */
export function getPostalCode(location: string) {
  return generate('Postal code', location);
}

/**
 * Example function that generates a random but plausible address line for a given location.
 * @param location The location to generate the address line for. If no location is provided, a general address line is generated.
 * @returns A string representing the generated address line.
 * @example
 * await randomAddressLine('Paris') // => '1 rue de Rivoli'
 * await randomAddressLine() // => '1234 Elm Street'
 */
export function randomAddressLine(location?: string) {
  return generate('Random but plausible address line', location);
}

/**
 * Example function that generates baby name ideas based on a given request.
 * @param request The request to generate the baby name ideas for. If no request is provided, general baby name ideas are generated.
 * @returns An array of strings representing the generated baby name ideas.
 * @example
 * await babyNameIdeas('Something short but powerful for a boy') // => ['Max', 'Sam', 'Jake']
 */
export function babyNameIdeas(request?: string) {
  return generate('Baby name ideas (array of strings)', request);
}

/**
 * Example function that generates business ideas based on a given request.
 * @param request The request to generate the business ideas for. If no request is provided, general business ideas are generated.
 * @returns An array of strings representing the generated business ideas.
 * @example
 * await businessIdeas('Related to the environment') // => ['Eco-friendly packaging', 'Solar power installation', 'Composting service']
 */
export function businessIdeas(request?: string) {
  return generate('Business ideas (array of strings)', request);
}

/**
 * Example function that generates a SWOT analysis for a given idea.
 * @param idea The idea to generate the SWOT analysis for.
 * @returns An object with `strengths`, `weaknesses`, `opportunities`, and `threats` properties, each an array of strings representing the respective elements of the SWOT analysis.
 * @example
 * await swotAnalysis('Online tutoring service') 
 * // => { 
 * //   strengths: ['Flexible schedule', 'Low overhead'], 
 * //   weaknesses: ['Internet dependency', 'High competition'], 
 * //   opportunities: ['Increase in remote learning', 'Global market'], 
 * //   threats: ['Technical issues', 'Market saturation'] 
 * // }
 */
export function swotAnalysis(idea: string) {
  return generate({
    strengths: 'array of strings',
    weaknesses: 'array of strings',
    opportunities: 'array of strings',
    threats: 'array of strings',
  } as const, { idea });
}