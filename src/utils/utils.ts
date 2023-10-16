export function mutate<T extends Record<string, any>, U extends Partial<T>>(
  object: T,
  newValuesOrCallback: U | ((object: T) => U)
): asserts object is T & U {
  Object.assign(object, newValuesOrCallback);
};

export function $throw<T extends Error>(errorOrMessage: T | string): never {
  throw typeof errorOrMessage === 'string' ? new Error(errorOrMessage) : errorOrMessage;
};

export type Jsonable = string | number | boolean | null | undefined | Jsonable[] | { [key: string]: Jsonable };