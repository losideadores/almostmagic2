import yaml from "js-yaml";
import { Jsonable, check, is, $throw, give } from "vovas-utils";
import { SpecTypes, SpecTypeKey } from ".";

/**
 * Tries to convert a value to a given type.
 * 
 * @param value - The value to convert.
 * @param type - The type to convert the value to, expressed as a string from the `SpecTypes` type.
 * @returns The converted value, or undefined if the conversion failed.
 * 
 * Note: We can convert most values to strings, and strings to most other types.
 * Apart from that, we return undefined as we don’t want to make any assumptions.
 */
export const tryConvert = <T extends keyof SpecTypes>(value: Exclude<Jsonable, SpecTypes[T]>, type: T) => (
  type === 'string'
    ? check(value as Jsonable)
      .if( is.array, items =>
        items.every(item => typeof item === 'number' || (typeof item === 'string' && /^[^\s]+$/.test(item)))
          ? items.join(', ')
          : yaml.dump(items)
      )
      .if( is.jsonableObject, yaml.dump )
      .else( String )
    : check(value as Jsonable)
      .if( is.string, string =>
        check(type as SpecTypeKey)
          .if( is.exactly('number' as const), () => !isNaN(Number(string)) ? Number(string) : undefined )
          .if( is.exactly('boolean' as const), () => /^true|false$/.test(string) ? string === 'true' : undefined )
          .if( is.exactly('string[]' as const), () => {
            try {
              const result = yaml.load(string);
              return Array.isArray(result) && result.length > 0 && result.every(item => typeof item === 'string') ? result : undefined;
            } catch ( error ) {
              return undefined;
            };
          } )
          .if( is.exactly('number[]' as const), () => {
            const result = string.split(',').map(item => item.trim());
            return result.every(item => !isNaN(Number(item))) ? result.map(item => Number(item)) : undefined;
          } )
          .else( type => $throw(`Unexpected type: ${type}`) )
      )
      .else( give.undefined )
) as SpecTypes[T] | undefined;