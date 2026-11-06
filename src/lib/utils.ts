export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isTouch = () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
export const uid = () => Math.random().toString(36).slice(2, 9);
export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
