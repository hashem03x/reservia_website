/** Empty or non-numeric input becomes 0, which the calculator treats as "no estimate". */
export const toNumber = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
