/** Mezcla un color hex con blanco (a > 0) o con negro (a < 0). */
export function tint(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = (x: number) => Math.round(a >= 0 ? x + (255 - x) * a : x * (1 + a));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
