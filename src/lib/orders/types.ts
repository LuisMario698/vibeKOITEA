import type { CartLine, Cur, Lang, OrderItem, OrderStatus, OrderType, PayMethod } from "../menu/types";

/** Lo que el cliente manda al crear un pedido. */
export interface CreateOrderInput {
  items: CartLine[];
  type: OrderType;
  table: number | null;
  name: string;
  phone: string;
  cc: string;
  lang: Lang;
  tipPct: number;
  pm: PayMethod;
  cur: Cur;
}

/** Lo que el cliente puede ver de un pedido. */
export interface PublicOrder {
  code: string;
  status: OrderStatus;
  type: OrderType;
  table: number | null;
  name: string;
  items: OrderItem[];
  subtotal: number;
  tip: number;
  total: number;
  paid: boolean;
  pm: PayMethod;
  lang: Lang;
  phoneTail: string | null;
  cc: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderResult {
  ok: true;
  code: string;
  subtotal: number;
  tip: number;
  total: number;
  live: boolean;
  paid: boolean;
  waUrl: string;
  waText: string;
  checkoutUrl?: string;
  items: OrderItem[];
}
export type CreateOrderError = { ok: false; error: "closed" | "invalid" | "unavailable" | "server" | "payment"; message?: string };
