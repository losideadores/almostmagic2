import { dump } from "js-yaml";
import { Jsonable } from "vovas-utils";
import { MatchingOutput, SpecTypeKeys, SpecTypeKeysDict, SpecTypeKeysSingle, Specs, matchingOutputTypeKeys } from "./specs";

export type GenerateExceptionType = 'noOutput' | 'outputNotJsonable' | 'outputNotJsonableObject' | 'specMismatch' | 'yamlError';

export class GenerateException<T extends GenerateExceptionType> extends Error {
  constructor(
    public readonly code: T,
    public readonly meta?: any
  ) {
    super(`${code}:\n${dump(meta)}`);
  };
};

export class SpecMismatchException<
  S extends Specs,
  HasKey extends boolean,
  K extends HasKey extends true ? Extract<keyof SpecTypeKeysDict<MatchingOutput<S>>, string> : undefined,
  T extends Jsonable
> extends GenerateException<'specMismatch'> {
  constructor(
    public specs: S,
    public key: K,
    public expectedType:
      HasKey extends true
        ? SpecTypeKeysDict<MatchingOutput<S>>[Extract<keyof SpecTypeKeysDict<MatchingOutput<S>>, string>]
        : SpecTypeKeysSingle<MatchingOutput<S>>,
    public actualValue: T,
  ) {
    super('specMismatch', { specs, key, expectedType, actualValue });
  };
};