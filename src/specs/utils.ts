import { EPSTemplate, MatchesTemplate, SpecType, specKeyTemplates, specValueTemplates } from ".";

const findKey = <O extends Record<string, any>>(obj: O, predicate: (value: any) => boolean): keyof O | undefined => Object.keys(obj).find(key => predicate(obj[key]));
const endsWith = <S extends string>(str: string, suffix: S): str is `${string}${S}` => str.endsWith(suffix);
const startsWith = <S extends string>(str: string, prefix: S): str is `${S}${string}` => str.startsWith(prefix);

export function matchesTemplate<T extends EPSTemplate>(str: string, [exact, prefix, suffix]: T): str is MatchesTemplate<T> {
  return str === exact || !!prefix && startsWith(str, prefix) || !!suffix && endsWith(str, suffix);
};

export function typeBasedOnSpecValue(specValue: string): SpecType | undefined {
  return findKey(specValueTemplates, template => matchesTemplate(specValue, template));
};

export function typeBasedOnSpecKey(specKey: string): SpecType | undefined {
  return findKey(specKeyTemplates, template => matchesTemplate(specKey, template));
};

export function typeBasedOnSpecEntry<S extends Record<string, string>>(spec: S, key: keyof S): SpecType | undefined {
  return typeBasedOnSpecKey(key as string) || typeBasedOnSpecValue(spec[key]);
};
