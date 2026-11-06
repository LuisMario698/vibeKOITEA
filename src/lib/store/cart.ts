"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine, OrderItem, OrderType, PayMethod } from "../menu/types";
import { lineKey } from "../menu/helpers";

export interface ActiveOrder {
  code: string;
  createdAt: string;
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
  setActiveStatus: (s: number) => void;
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
      setActiveStatus: (status) => set((s) => (s.active ? { active: { ...s.active, status } } : {})),
    }),
    {
      name: "koi-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines, type: s.type, table: s.table, name: s.name, phone: s.phone, cc: s.cc, pm: s.pm, active: s.active }),
    },
  ),
);
