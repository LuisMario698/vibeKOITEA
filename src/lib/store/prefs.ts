"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Cur, Lang } from "../menu/types";

interface Prefs {
  lang: Lang;
  cur: Cur;
  /** Koi que nadan en el estanque (1–3). */
  koi: number;
  splashSeen: boolean;
  setLang: (l: Lang) => void;
  setCur: (c: Cur) => void;
  setKoi: (n: number) => void;
  setSplashSeen: (v: boolean) => void;
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      lang: "es",
      cur: "mxn",
      koi: 3,
      splashSeen: false,
      setLang: (lang) => set({ lang }),
      setCur: (cur) => set({ cur }),
      setKoi: (koi) => set({ koi: Math.max(1, Math.min(3, koi | 0)) }),
      setSplashSeen: (splashSeen) => set({ splashSeen }),
    }),
    {
      name: "koi-prefs",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lang: s.lang, cur: s.cur, koi: s.koi }),
    },
  ),
);
