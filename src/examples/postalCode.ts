import { generate } from "../generate";

export const getPostalCode = ( city: string ) =>
  generate( 'postalCode', { city } );