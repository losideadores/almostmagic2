import { generate } from "../generate";

// await getPostalCode( 'Paris' ) // => '75001'

export const languages = [
  'en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'bn', 'pa', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'ml', 'sd', 'or', 'as', 'bh', 'ks', 'ne', 'si', 'sa', 'my', 'km', 'lo', 'th', 'lo', 'vi', 'id', 'ms', 'tl', 'jv', 'su', 'tl', 'ceb', 'ny', 'ha', 'yo', 'ig', 'yo', 'zu', 'xh', 'st', 'tn', 'sn', 'so', 'rw', 'rn', 'ny', 'lg', 'sw', 'mg', 'eo', 'cy', 'eu', 'gl', 'ca', 'ast', 'eu', 'qu', 'ay', 'gn', 'tt', 'ug', 'dz', 'bo', 'ii', 'chr', 'iu', 'oj', 'cr', 'km', 'mn', 'yi', 'he', 'yi', 'ur', 'ar', 'fa', 'ps', 'ks', 'sd'
] as const;

export type Language = (typeof languages)[number];

export const translate = <T extends Language[]>(text: string, ...toLanguages: T) => generate(toLanguages, text);
