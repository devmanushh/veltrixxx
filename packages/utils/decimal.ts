export type NumericLike = number | string | null | undefined | { toNumber?: () => number; toString: () => string };

export const toNumber = (value: NumericLike): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value.toNumber === "function") return value.toNumber();

  return Number(value.toString());
};