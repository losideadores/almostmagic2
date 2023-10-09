import { Jsonable, is } from "vovas-utils";
import { MatchingOutput, SpecTypeName, SpecTypes, Specs, matchingOutputTypeKeys, specTypeKeysIsDict, tryConvert } from ".";
import { GenerateException, SpecMismatchException, specTypeKey } from "..";

/**
 * A typeguard that checks if a {@link Jsonable} value is *not* of a given type, as represented by its {@link SpecTypeName}.
 * 
 * @param value - The value to check.
 * @param type - The type to check against.
 */
export function isNotSameType<T extends SpecTypeName>(value: Jsonable, type: T): value is Exclude<Jsonable, SpecTypes[T]> {
  return specTypeKey(value) !== type;
}

/**
 * Tries to cast a value to given {@link Specs}, throwing a {@link GenerateException} if the value cannot be cast.
 * 
 * @param output - The value to cast.
 * @param specs - The specs to cast to.
 * @returns The casted value as a {@link MatchingOutput} for the given {@link Specs}.
 */
export function castToSpecs<S extends Specs>(output: any, specs: S): MatchingOutput<S> {

  if ( !is.jsonable(output) )
    throw new GenerateException('outputNotJsonable', { output });
  
  const expectedTypes = matchingOutputTypeKeys(specs);

  if ( specTypeKeysIsDict(expectedTypes) ) {

    if ( !is.jsonableObject(output) )
      throw new GenerateException('outputNotJsonableObject', { output });

    for ( const key in expectedTypes ) {
      const expectedType = expectedTypes[key];
      const actualValue = output[key];
      if ( isNotSameType(actualValue, expectedType) ) {
        const convertedValue = tryConvert(actualValue, expectedType);
        if ( typeof convertedValue === undefined )
          throw new SpecMismatchException(specs, key, expectedType, actualValue);
        output[key] = convertedValue;
      }
    };

  } else {

    if ( isNotSameType(output, expectedTypes) ) {
      const convertedValue = tryConvert(output, expectedTypes);
      if ( typeof convertedValue === undefined )
        throw new SpecMismatchException(specs, undefined, expectedTypes,  output)
      output = convertedValue;
    };

  };

  return output as MatchingOutput<S>;

};