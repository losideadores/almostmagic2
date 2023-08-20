import { Jsonable, is } from "vovas-utils";
import { MatchingOutput, SpecTypeKey, SpecTypes, Specs, matchingOutputTypeKeys, specTypeKeysIsObject, tryConvert, typeOf } from ".";
import { GenerateException, SpecMismatchException } from "..";

export const isNotSameType = <T extends SpecTypeKey>(value: Jsonable, type: T): value is Exclude<Jsonable, SpecTypes[T]> =>
  typeOf(value) !== type;


export function makeOutputMatchSpecs<S extends Specs>(output: any, specs: S) {

  if ( !is.jsonable(output) )
    throw new GenerateException('outputNotJsonable', { output });
  
  const expectedTypes = matchingOutputTypeKeys(specs);

  if ( specTypeKeysIsObject(expectedTypes) ) {

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