export type Lang = "es" | "en";
export type Cur = "mxn" | "usd";
export type Localized = { es: string; en: string };

/** Tipo de bebida: define textura, nivel y color del líquido en el vaso 3D. */
export type DrinkKind = "milk" | "brown" | "fruit" | "smooth";
export type ToppingType = "tapioca" | "pop" | "jelly";
export type MerchArt = "teeBlack" | "teeCream" | "tote" | "capBlack" | "capStone";

export interface Category {
  id: string;
  name: Localized;
  sub?: Localized;
  sort: number;
}

export interface Drink {
  id: string;
  cat: string;
  name: Localized;
  desc: Localized;
  /** Precio en pesos mexicanos (entero). */
  price: number;
  kind: DrinkKind;
  /** Color principal del líquido. */
  c1: string;
  /** Color superior (fruit tea en capas, jarabe en brown sugar). */
  c2?: string;
  /** Color "pop" para fondos y tarjetas. */
  pop: string;
  /** Color del texto sobre el fondo pop (por defecto blanco). */
  ink?: string;
  /** Topping incluido por defecto (id). */
  topping: string;
  featured: boolean;
  available: boolean;
  sort: number;
}

export interface Topping {
  id: string;
  name: Localized;
  color: string;
  type: ToppingType;
  /** Costo extra en MXN (0 = incluido). */
  price: number;
  available: boolean;
  sort: number;
}

export interface Merch {
  id: string;
  name: Localized;
  desc: Localized;
  price: number;
  sizes: string[] | null;
  art: MerchArt;
  bg: string;
  available: boolean;
  sort: number;
}

export interface Settings {
  /** Pesos por dólar. */
  rate: number;
  /** WhatsApp del negocio, solo dígitos con lada (52…); vacío = el cliente elige a quién mandarlo. */
  whatsapp: string;
  instagram: string;
  hours: string;
  /** Horario de apertura/cierre en minutos desde medianoche, por día (0 = domingo). null = cerrado. */
  schedule: Array<[number, number] | null>;
  address: string;
  city: string;
  mapsUrl: string;
  tagline: Localized;
  origin: Localized;
  acceptOrders: boolean;
  tableCount: number;
  tips: number[];
  promo: Localized | null;
  /** Métodos de pago en línea disponibles (lo decide el servidor según las variables de entorno). */
  payments: { stripe: boolean; mp: boolean };
  /** Hay base de datos: los pedidos se guardan y se pueden seguir en vivo. */
  live: boolean;
}

export interface Menu {
  categories: Category[];
  drinks: Drink[];
  toppings: Topping[];
  merch: Merch[];
  settings: Settings;
}

/** Opciones elegidas para una bebida. */
export interface DrinkOpts {
  top: string;
  /** Índice en SWEET (0…4). */
  sweet: number;
  /** 0 sin hielo · 1 poco · 2 normal */
  ice: number;
}

export interface CartLine {
  key: string;
  kind: "drink" | "merch";
  ref: string;
  opts?: DrinkOpts;
  size?: string | null;
  qty: number;
  /** Precio unitario en MXN al momento de agregar. */
  price: number;
}

export type OrderType = "togo" | "table";
export type PayMethod = "express" | "card" | "mp" | "bar";
/** 0 recibido · 1 preparando · 2 listo · 3 entregado · 9 cancelado */
export type OrderStatus = 0 | 1 | 2 | 3 | 9;

export interface OrderItem {
  kind: "drink" | "merch";
  ref: string;
  name: Localized;
  detail: Localized;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  type: OrderType;
  table: number | null;
  name: string;
  phone: string;
  cc: string;
  lang: Lang;
  items: OrderItem[];
  subtotal: number;
  tip: number;
  total: number;
  pm: PayMethod;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SWEET = ["0%", "25%", "50%", "75%", "100%"] as const;
