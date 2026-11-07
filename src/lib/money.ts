import type { Cur } from "./menu/types";

/** Pesos con separador de miles, igual en el menú, el carrito, WhatsApp y el panel: "$1,170 MXN". */
export const mxn = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`;

/** Conversión a dólares con centavos (sin redondeos por partida, para que las sumas del carrito cuadren). */
const usd = (mxnAmount: number, rate: number) => `US$${(mxnAmount / (rate || 1)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Formatea un precio en MXN según la moneda elegida. */
export function formatPrice(amount: number, cur: Cur, rate: number): string {
  return cur === "usd" ? usd(amount, rate) : mxn(amount);
}
export const usdApprox = (mxnAmount: number, rate: number) => usd(mxnAmount, rate);
