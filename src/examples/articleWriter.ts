import { MatchingOutput, Specs, generate } from "..";
import { JsonableObject, is } from 'vovas-utils';

const prelimSpecs = {
  title: 'article title',
  intro: 'article intro',
  outline: 'section titles (array of strings)',
} as const;

/**
 * Example function that generates article title, intro, and outline (array of section titles) for given topic.
 * @param topic Topic to generate the article for.
 * @returns An object with `title`, `intro`, and `outline` properties.
 */
export const generatePrelims = ( topic: string ) =>
  generate(prelimSpecs, { topic });