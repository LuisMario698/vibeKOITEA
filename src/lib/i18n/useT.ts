"use client";
import { useCallback } from "react";
import { DICT, type Dict } from "./dict";
import { usePrefs } from "../store/prefs";
import type { Lang } from "../menu/types";

type StrKey = { [K in keyof Dict]: Dict[K] extends string ? K : never }[keyof Dict];
type FnKey = { [K in keyof Dict]: Dict[K] extends (n: number) => string ? K : never }[keyof Dict];

export function useT() {
  const lang = usePrefs((s) => s.lang);
  const t = useCallback((k: StrKey) => DICT[lang][k] as string, [lang]);
  const tn = useCallback((k: FnKey, n: number) => (DICT[lang][k] as (n: number) => string)(n), [lang]);
  return { t, tn, lang, dict: DICT[lang] };
}

export const tFor = (lang: Lang) => DICT[lang];
