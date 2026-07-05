export type NumericLike = number | string | null | undefined | { toNumber?: () => number; toString: () => string };

export const toNumber = (value: NumericLike): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value.toNumber === "function") return value.toNumber();

  return Number(value.toString());
};

const DEFAULT_DECIMAL_SCALE = 12;

export const toDecimalString = (value: NumericLike, scale = DEFAULT_DECIMAL_SCALE): string => {
  const numeric = toNumber(value);

  if (!Number.isFinite(numeric)) {
    throw new Error("Invalid decimal value");
  }

  const fixed = numeric.toFixed(scale).replace(/\.?0+$/, "");
  return fixed === "-0" || fixed === "" ? "0" : fixed;
};

export const toDecimalNumber = (value: NumericLike, scale = DEFAULT_DECIMAL_SCALE): number => {
  return Number(toDecimalString(value, scale));
};
