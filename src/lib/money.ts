import type { Cur } from "./menu/types";

/** Formatea un precio en MXN según la moneda elegida. Los dólares se redondean al cuarto. */
export function formatPrice(mxn: number, cur: Cur, rate: number): string {
  if (cur === "usd") return `US$${(Math.round((mxn / rate) * 4) / 4).toFixed(2)}`;
  return `$${Number.isInteger(mxn) ? mxn : mxn.toFixed(2)} MXN`;
}
export const mxn = (n: number) => `$${n.toLocaleString("es-MX")} MXN`;
export const usdApprox = (mxnAmount: number, rate: number) => `US$${(mxnAmount / rate).toFixed(2)}`;
