import { EPSTemplate, MatchesTemplate, SpecType, specKeyTemplates, specValueTemplates } from ".";

const findKey = <O extends Record<string, any>>(obj: O, predicate: (value: any) => boolean): keyof O | undefined => Object.keys(obj).find(key => predicate(obj[key]));
const endsWith = <S extends string>(str: string, suffix: S): str is `${string}${S}` => str.endsWith(suffix);
const startsWith = <S extends string>(str: string, prefix: S): str is `${S}${string}` => str.startsWith(prefix);

/**
 * Checks if a string matches a given template, narrowing the type of the string accordingly.
 * @template T Type of the template, extending {@link EPSTemplate}.
 * @param {string} str String to check.
 * @param {T} template Template to match against.
 * @returns {boolean} True if the string matches the template, false otherwise.
 */
export function matchesTemplate<T extends EPSTemplate>(str: string, [exact, prefix, suffix]: T): str is MatchesTemplate<T> {
  return str === exact || !!prefix && startsWith(str, prefix) || !!suffix && endsWith(str, suffix);
};

/**
 * Function to determine the type of a specification based on its value.
 * @param {string} specValue Value of the specification.
 * @returns {SpecType | undefined} The type of the specification if it matches a known type, undefined otherwise.
 */
export function typeBasedOnSpecValue(specValue: string): SpecType | undefined {
  return findKey(specValueTemplates, template => matchesTemplate(specValue, template));
};

/**
 * Function to determine the type of a specification based on its key.
 * @param {string} specKey Key of the specification.
 * @returns {SpecType | undefined} The type of the specification if it matches a known type, undefined otherwise.
 */
export function typeBasedOnSpecKey(specKey: string): SpecType | undefined {
  return findKey(specKeyTemplates, template => matchesTemplate(specKey, template));
};

/**
 * Function to determine the type of a specification entry based on its key and value.
 * @template S Type of the specification, extending Record<string, string>.
 * @param {S} spec The specification.
 * @param {keyof S} key Key of the specification entry.
 * @returns {SpecType | undefined} The type of the specification entry if it matches a known type, undefined otherwise.
 */
export function typeBasedOnSpecEntry<S extends Record<string, string>>(spec: S, key: keyof S): SpecType | undefined {
  return typeBasedOnSpecKey(key as string) || typeBasedOnSpecValue(spec[key]);
};