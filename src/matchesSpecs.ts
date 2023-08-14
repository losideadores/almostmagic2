import { Specs, ExpectedModelOutput } from "./Specs";


export function matchesSpecs<S extends Specs<string>>(obj: any, specs: S): obj is ExpectedModelOutput<S> {
  if (typeof specs === 'string') {
    return typeof obj[specs] === 'string';
  };
  if (Array.isArray(specs)) {
    return specs.every(spec => typeof obj[spec] === 'string');
  }
  for (const key in specs as Record<string, string>) {
    const spec = specs[key];
    const value = obj[key];
    if (/^(number|amount) | \(number\)$/.test(spec)
      && typeof value === 'number'
      || /^(true|false) (if|when) | \(boolean\)$/.test(spec)
      && typeof value === 'boolean'
      || /^(array|list) of (numbers|amounts) | \(array of numbers\)$/.test(spec)
      && Array.isArray(value) && value.every(item => typeof item === 'number')
      || /^(array|list) of | \(array of strings\)$/.test(spec) && Array.isArray(value)
      && value.every(item => typeof item === 'string')
      || typeof value === 'string')
      continue;
    return false;
  };
  return true;
}
;
