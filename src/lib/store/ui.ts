"use client";
import { create } from "zustand";

interface UI {
  drink: string | null;
  origin: { x: number; y: number } | null;
  merch: string | null;
  orderOpen: boolean;
  toast: { msg: string; id: number } | null;
  openDrink: (id: string, origin?: { x: number; y: number }) => void;
  closeDrink: () => void;
  openMerch: (id: string) => void;
  closeMerch: () => void;
  setOrderOpen: (v: boolean) => void;
  showToast: (msg: string) => void;
}

export const useUI = create<UI>((set) => ({
  drink: null,
  origin: null,
  merch: null,
  orderOpen: false,
  toast: null,
  openDrink: (drink, origin) => set({ drink, origin: origin ?? null }),
  closeDrink: () => set({ drink: null }),
  openMerch: (merch) => set({ merch }),
  closeMerch: () => set({ merch: null }),
  setOrderOpen: (orderOpen) => set({ orderOpen }),
  showToast: (msg) => set({ toast: { msg, id: Date.now() } }),
}));
