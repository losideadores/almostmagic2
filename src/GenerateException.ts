import { dump } from "js-yaml";
import { Jsonable } from "vovas-utils";
import { MatchingOutput, SpecTypeNamesDict, SpecTypeNamesSingle, Specs } from "./specs";
import { generate } from "./generate";

/**
 * Type for exceptions that can be generated.
 */
export type GenerateExceptionType =
  /**
   * Indicates that no output was produced when one was expected.
   */
  | 'noOutput'
  
  /**
   * Indicates that the output could not be converted to JSON.
   */
  | 'outputNotJsonable'
  
  /**
   * Indicates that the output is not a JSON object.
   */
  | 'outputNotJsonableObject'
  
  /**
   * Indicates that the output does not match the expected specification (@see {@link Specs}).
   */
  | 'specMismatch'
  
  /**
   * Indicates that an error occurred while processing YAML.
   */
  | 'yamlError';

/**
 * An exception that can be thrown while {@link generate}-ing.
 */
export class GenerateException<T extends GenerateExceptionType> extends Error {

  /**
   * Creates a new {@link GenerateException}.
   * @param code The code for the exception (one of {@link GenerateExceptionType}s).
   * @param meta Additional metadata for the exception.
   */
  constructor(
    public readonly code: T,
    public readonly meta?: any
  ) {
    super(`${code}:\n${dump(meta)}`);
  };

};

/**
 * An exception that can be thrown while {@link generate}-ing if the output does not match the expected {@link Specs}.
 */
export class SpecMismatchException<
  S extends Specs,
  HasKey extends boolean,
  K extends HasKey extends true ? Extract<keyof SpecTypeNamesDict<MatchingOutput<S>>, string> : undefined,
  T extends Jsonable
> extends GenerateException<'specMismatch'> {


  /**
   * Creates a new {@link SpecMismatchException}.
   * @param specs The {@link Specs} that were expected.
   * @param key The key of the {@link Specs} for which the mismatch occurred, if any.
   * @param expectedType The expected {@link SpecTypeName}.
   * @param actualValue The actual value that was generated.
   */
  constructor(
    public specs: S,
    public key: K,
    public expectedType:
      HasKey extends true
        ? SpecTypeNamesDict<MatchingOutput<S>>[Extract<keyof SpecTypeNamesDict<MatchingOutput<S>>, string>]
        : SpecTypeNamesSingle<MatchingOutput<S>>,
    public actualValue: T,
  ) {
    super('specMismatch', { specs, key, expectedType, actualValue });
  };

};