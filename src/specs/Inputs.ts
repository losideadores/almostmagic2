import { SpecType } from "./SpecTypes";

/**
 * A type representing the input to the {@link generate} function: either a string (simple description of the input), or a mapping between string keys and {@link SpecType}s.
 */
export type Inputs = string | Record<string, SpecType>;