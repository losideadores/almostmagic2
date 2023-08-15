import _ from "lodash";
import { Specs, ExpectedModelOutput, valueRepresentsNumber, valueRepresentsBoolean, keyRepresentsBoolean, valueRepresentsNumberArray, valueRepresentsStringArray, keyRepresentsStringArray } from "./types/Specs";


export function matchesSpecs<S extends Specs>(obj: any, specs: S): obj is ExpectedModelOutput<S> {

  if (typeof specs === 'string') {
    return typeof obj[specs] === 'string';
  };

  if (Array.isArray(specs)) {
    return specs.every(specKey =>
      /Array$/.test(specKey)
        ? _.isArray(obj[specKey]) && _.every(obj[specKey] as any[], _.isString)
        : _.isString(obj[specKey])
    );
  };
  
  for (const key in specs as Record<string, string>) {
    const spec = specs[key];
    const value = obj[key];
    if (
      valueRepresentsNumber(spec)
        && typeof value === 'number'
      || ( valueRepresentsBoolean(spec) || keyRepresentsBoolean(key) )
        && typeof value === 'boolean'
      || valueRepresentsNumberArray(spec)
        && _.isArray(value) && value.every(_.isNumber)
      || ( valueRepresentsStringArray(spec) || keyRepresentsStringArray(key) )
        && _.isArray(value) && value.every(_.isString)
      || typeof value === 'string'
    )
      continue;
    return false;
  };
  return true;
}
;
