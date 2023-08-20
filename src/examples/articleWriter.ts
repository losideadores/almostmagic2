import { MatchingOutput, Specs, generate } from "..";
import { JsonableObject, is } from 'vovas-utils';

const prelimSpecs = {
  title: 'string',
  intro: 'string',
  outline: 'array of strings, to be further expanded into sections',
} as const;

export type Prelims = MatchingOutput<typeof prelimSpecs>;

export const generatePrelims = ( topic: string ) =>
  generate(prelimSpecs, { topic });