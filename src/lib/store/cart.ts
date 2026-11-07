"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine, Menu, OrderItem, OrderType, PayMethod } from "../menu/types";
import { drinkById, lineKey, linePrice, merchById } from "../menu/helpers";

export interface ActiveOrder {
  code: string;
  /** Secreto del enlace de seguimiento. */
  token: string;
  createdAt: string;
  /** Pago en línea iniciado y aún no confirmado: el carrito se conserva por si el cliente vuelve sin pagar. */
  pending?: boolean;
  /** Copia local del pedido para mostrarlo aunque no haya base de datos. */
  local: {
    items: OrderItem[];
    type: OrderType;
    table: number | null;
    name: string;
    tip: number;
    total: number;
    pm: PayMethod;
    paid: boolean;
    phone: string;
    cc: string;
    waUrl: string | null;
    waText: string;
    live: boolean;
  } | null;
  /** Estado conocido (lo actualiza el seguimiento). */
  status: number;
}

interface Cart {
  lines: CartLine[];
  type: OrderType;
  table: number;
  name: string;
  phone: string;
  cc: string;
  tipPct: number;
  pm: PayMethod;
  active: ActiveOrder | null;
  add: (l: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  patch: (p: Partial<Pick<Cart, "type" | "table" | "name" | "phone" | "cc" | "tipPct" | "pm">>) => void;
  setActive: (a: ActiveOrder | null) => void;
  /** Actualiza el estado solo si el pedido mostrado es el propio. */
  setActiveStatus: (code: string, s: number) => void;
  /** Recalcula los precios del carrito con el menú vigente y quita lo que ya no existe. */
  reprice: (menu: Menu) => void;
}

export const useCart = create<Cart>()(
  persist(
    (set, get) => ({
      lines: [],
      type: "togo",
      table: 1,
      name: "",
      phone: "",
      cc: "52",
      tipPct: 0,
      pm: "bar",
      active: null,
      add: (l) => {
        const key = lineKey(l);
        const lines = get().lines.slice();
        const ex = lines.find((x) => x.key === key);
        if (ex) ex.qty = Math.min(20, ex.qty + l.qty);
        else lines.push({ ...l, key });
        set({ lines });
      },
      setQty: (key, qty) => set({ lines: get().lines.map((x) => (x.key === key ? { ...x, qty } : x)).filter((x) => x.qty > 0) }),
      remove: (key) => set({ lines: get().lines.filter((x) => x.key !== key) }),
      clear: () => set({ lines: [], tipPct: 0 }),
      patch: (p) => set(p),
      setActive: (active) => set({ active }),
      setActiveStatus: (code, status) => set((s) => (s.active && s.active.code === code && s.active.status !== status ? { active: { ...s.active, status } } : {})),
      reprice: (menu) => {
        const cur = get().lines;
        const lines = cur
          .filter((l) => (l.kind === "drink" ? !!drinkById(menu, l.ref) : !!merchById(menu, l.ref)))
          .map((l) => { const price = linePrice(menu, l); return price === l.price ? l : { ...l, price }; });
        if (lines.length !== cur.length || lines.some((l, i) => l !== cur[i])) set({ lines });
      },
    }),
    {
      name: "koi-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines, type: s.type, table: s.table, name: s.name, phone: s.phone, cc: s.cc, pm: s.pm, active: s.active }),
    },
  ),
);
