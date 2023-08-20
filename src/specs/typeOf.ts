import { SpecTypes } from ".";

const join = <S1 extends string, S2 extends string>(s1: S1, s2: S2): `${S1}${S2}` => `${s1}${s2}`;

export const typeOf = (value: any): keyof SpecTypes | undefined => {
  const type = typeof value;
  switch (type) {
    case 'number':
    case 'boolean':
    case 'string':
      return type;
    case 'object':
      if (Array.isArray(value)) {
        let detectedType: string | undefined;
        for (const item of value) {
          const itemType = typeOf(item);
          if (!detectedType) {
            detectedType = itemType;
          } else if (itemType !== detectedType) {
            return;
          }
        };
        if (detectedType === 'string' || detectedType === 'number') {
          return join(detectedType, '[]');
        };
      };
  };
};
