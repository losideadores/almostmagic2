import { generate } from "../generate";

/**
 * Array of language codes representing the languages supported by the {@link translate} function.
 * @example
 * console.log(languages) // => ['en', 'fr', 'de', ...]
 */
export const languages = [
  'en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'bn', 'pa', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'ml', 'sd', 'or', 'as', 'bh', 'ks', 'ne', 'si', 'sa', 'my', 'km', 'lo', 'th', 'lo', 'vi', 'id', 'ms', 'tl', 'jv', 'su', 'tl', 'ceb', 'ny', 'ha', 'yo', 'ig', 'yo', 'zu', 'xh', 'st', 'tn', 'sn', 'so', 'rw', 'rn', 'ny', 'lg', 'sw', 'mg', 'eo', 'cy', 'eu', 'gl', 'ca', 'ast', 'eu', 'qu', 'ay', 'gn', 'tt', 'ug', 'dz', 'bo', 'ii', 'chr', 'iu', 'oj', 'cr', 'km', 'mn', 'yi', 'he', 'yi', 'ur', 'ar', 'fa', 'ps', 'ks', 'sd'
] as const;

/**
 * Type representing a language code from the {@link languages} array.
 */
export type Language = (typeof languages)[number];

/**
 * Example function that translates a given text into the specified languages.
 * @param text The text to translate.
 * @param toLanguages The languages to translate the text into. Each language should be represented by its code from the {@link languages} array (type {@link Language}).
 * @returns An object where each key is a language code and the corresponding value is the translation of the text into that language.
 * @example
 * await translate('Hello, world!', 'fr', 'de') // => { fr: 'Bonjour, monde!', de: 'Hallo, Welt!' }
 */
export function translate<T extends Language[]>(text: string, ...toLanguages: T) {
  return generate(toLanguages, text);
};