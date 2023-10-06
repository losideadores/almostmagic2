import { generate } from "..";

export const getPostalCode = ( location: string ) =>
  generate( 'Postal code', location );

export const randomAddressLine = ( location?: string ) =>
  generate( 'Random but plausible address line', location );

// await randomAddressLine( 'Paris' ) // => '1 rue de Rivoli'
// await randomAddressLine() // => 1234 Elm Street

export const babyNameIdeas = ( request?: string ) =>
  generate( 'Baby name ideas (array of strings)', request );

// await babyNameIdeas('Something short but powerful for a boy')

export const businessIdeas = ( request?: string ) =>
  generate( 'Business ideas (array of strings)', request );

// await businessIdeas('Related to the environment')

export const swotAnalysis = ( idea: string ) =>
  generate({
    strengths: 'array of strings',
    weaknesses: 'array of strings',
    opportunities: 'array of strings',
    threats: 'array of strings',
  } as const, { idea });