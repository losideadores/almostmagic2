
export type JsonPrimitive = string | number | boolean | null;

export type Outputs<Keys extends string> = Keys | Keys[] | Record<Keys, string>;
export type Inputs<Keys extends string> = Record<Keys, string>;

export class GenerateMeta {
  rawContent?: string;
};
