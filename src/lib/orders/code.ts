/** Código corto y legible para la barra: K-100 … K-999 (cíclico). */
export const formatCode = (n: number) => `K-${100 + (Math.abs(n) % 900)}`;
export const randomCode = () => formatCode(Math.floor(Math.random() * 900));
export const isCode = (s: string) => /^K-\d{3}$/.test(s);
