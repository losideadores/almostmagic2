import _ from "lodash";

export type JsonPrimitive = string | number | boolean | null;

export type Inputs<Keys extends string> = Record<Keys, string>;

export class GenerateMeta {
  rawContent?: string;
};