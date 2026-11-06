import type { Category, Drink, Menu, Merch, Settings, Topping } from "./types";

/* Menú de Koi Tea leído de las pantallas del local (nov 2026).
   PRECIOS ILUSTRATIVOS: hay que confirmarlos con el negocio antes de salir a producción.
   Cuando hay Supabase, estos datos solo sirven de semilla y de respaldo. */

export const CATEGORIES: Category[] = [
  { id: "milk", name: { es: "Milk Tea", en: "Milk Tea" }, sub: { es: "Té con leche", en: "Milk tea" }, sort: 1 },
  { id: "fruit", name: { es: "Fruit Tea", en: "Fruit Tea" }, sub: { es: "Té verde con fruta", en: "Green tea with fruit" }, sort: 2 },
  { id: "smooth", name: { es: "Smoothies", en: "Smoothies" }, sub: { es: "Frappé de fruta", en: "Blended fruit" }, sort: 3 },
];

export const TOPPINGS: Topping[] = [
  { id: "tapioca", name: { es: "Tapioca", en: "Tapioca pearls" }, color: "#2A1810", type: "tapioca", price: 0, available: true, sort: 1 },
  { id: "pop-lichi", name: { es: "Perlas de lichi", en: "Lychee pops" }, color: "#F4DCD6", type: "pop", price: 0, available: true, sort: 2 },
  { id: "pop-fresa", name: { es: "Perlas de fresa", en: "Strawberry pops" }, color: "#E3304C", type: "pop", price: 0, available: true, sort: 3 },
  { id: "pop-mango", name: { es: "Perlas de mango", en: "Mango pops" }, color: "#F5AE1E", type: "pop", price: 0, available: true, sort: 4 },
  { id: "pop-maracuya", name: { es: "Perlas de maracuyá", en: "Passion fruit pops" }, color: "#F2B33A", type: "pop", price: 0, available: true, sort: 5 },
  { id: "pop-cereza", name: { es: "Perlas de cereza", en: "Cherry pops" }, color: "#B5172F", type: "pop", price: 0, available: true, sort: 6 },
  { id: "pop-coco", name: { es: "Perlas de coco", en: "Coconut pops" }, color: "#F6F1E7", type: "pop", price: 0, available: true, sort: 7 },
  { id: "jelly-lichi", name: { es: "Jelly de lichi", en: "Lychee jelly" }, color: "#F2ECE2", type: "jelly", price: 0, available: true, sort: 8 },
  { id: "jelly-fresa", name: { es: "Jelly de fresa", en: "Strawberry jelly" }, color: "#EE8A98", type: "jelly", price: 0, available: true, sort: 9 },
  { id: "jelly-mango", name: { es: "Jelly de mango", en: "Mango jelly" }, color: "#F7C35A", type: "jelly", price: 0, available: true, sort: 10 },
  { id: "jelly-maracuya", name: { es: "Jelly de maracuyá", en: "Passion fruit jelly" }, color: "#F3BE4E", type: "jelly", price: 0, available: true, sort: 11 },
  { id: "aloe", name: { es: "Aloe vera", en: "Aloe vera" }, color: "#D7EDC6", type: "jelly", price: 0, available: true, sort: 12 },
  { id: "jelly-cafe", name: { es: "Jelly de café", en: "Coffee jelly" }, color: "#5B3A28", type: "jelly", price: 0, available: true, sort: 13 },
];

const D = (
  id: string,
  cat: string,
  es: string,
  en: string,
  desc: [string, string],
  price: number,
  kind: Drink["kind"],
  c1: string,
  pop: string,
  topping: string,
  extra: Partial<Drink> = {},
): Drink => ({
  id, cat, name: { es, en }, desc: { es: desc[0], en: desc[1] }, price, kind, c1, pop, topping,
  featured: false, available: true, sort: 0, ...extra,
});

export const DRINKS: Drink[] = [
  D("classic-milk-tea", "milk", "Classic Milk Tea", "Classic Milk Tea", ["Té negro con leche, suave y balanceado.", "Black tea with milk, smooth and balanced."], 85, "milk", "#C9A27E", "#B07D55", "tapioca", { sort: 1 }),
  D("brown-sugar-milk-tea", "milk", "Brown Sugar Milk Tea", "Brown Sugar Milk Tea", ["Leche con jarabe de azúcar morena que pinta el vaso.", "Milk with brown sugar syrup streaking the cup."], 95, "brown", "#EAD7BE", "#7A4527", "tapioca", { c2: "#5A2E14", featured: true, sort: 2 }),
  D("taro-milk-tea", "milk", "Taro Milk Tea", "Taro Milk Tea", ["Cremoso, con raíz de taro. Favorito en reseñas.", "Creamy taro root milk tea. A reviewer favorite."], 90, "milk", "#B79AD0", "#8A66B4", "tapioca", { featured: true, sort: 3 }),
  D("strawberry-milk-tea", "milk", "Strawberry Milk Tea", "Strawberry Milk Tea", ["Té con leche y fresa.", "Milk tea with strawberry."], 90, "milk", "#F2B5C0", "#DF6F87", "pop-fresa", { sort: 4 }),
  D("mango-milk-tea", "milk", "Mango Milk Tea", "Mango Milk Tea", ["Té con leche y mango.", "Milk tea with mango."], 90, "milk", "#F4C46A", "#F0B442", "pop-mango", { ink: "#27211E", sort: 5 }),
  D("koi-tea", "fruit", "Koi Tea", "Koi Tea", ["La bebida de la casa, en capas de rojo a naranja.", "Our house signature, layered red to orange."], 95, "fruit", "#D8283F", "#E2482B", "pop-fresa", { c2: "#F39A2B", featured: true, sort: 1 }),
  D("maracuya-green-tea", "fruit", "Maracuyá Green Tea", "Passion Fruit Green Tea", ["Té verde con maracuyá.", "Green tea with passion fruit."], 85, "fruit", "#E99417", "#F2B33A", "pop-maracuya", { c2: "#F7D46B", ink: "#27211E", sort: 2 }),
  D("fresa-green-tea", "fruit", "Fresa Green Tea", "Strawberry Green Tea", ["Té verde con fresa.", "Green tea with strawberry."], 85, "fruit", "#D72A45", "#D83A52", "pop-fresa", { c2: "#F2848A", sort: 3 }),
  D("durazno-green-tea", "fruit", "Durazno Green Tea", "Peach Green Tea", ["Té verde con durazno. Pruébalo con jelly de lichi.", "Green tea with peach. Try it with lychee jelly."], 85, "fruit", "#EE7F2A", "#F09A45", "jelly-lichi", { c2: "#F8BE68", ink: "#27211E", featured: true, sort: 4 }),
  D("mango-green-tea", "fruit", "Mango Green Tea", "Mango Green Tea", ["Té verde con mango.", "Green tea with mango."], 85, "fruit", "#F2A01E", "#F5BC3C", "pop-mango", { c2: "#F8CE5E", ink: "#27211E", sort: 5 }),
  D("lichi-green-tea", "fruit", "Lichi Green Tea", "Lychee Green Tea", ["Té verde con lichi.", "Green tea with lychee."], 85, "fruit", "#F1C2C0", "#E58E9C", "pop-lichi", { c2: "#FBEDE8", sort: 6 }),
  D("smoothie-mango", "smooth", "Smoothie de Mango", "Mango Smoothie", ["Frappé cremoso de mango.", "Creamy blended mango."], 90, "smooth", "#F6B93B", "#F2A92C", "tapioca", { ink: "#27211E", sort: 1 }),
  D("smoothie-fresa", "smooth", "Smoothie de Fresa", "Strawberry Smoothie", ["Frappé cremoso de fresa.", "Creamy blended strawberry."], 90, "smooth", "#EC6A7A", "#D9475D", "tapioca", { sort: 2 }),
  D("smoothie-taro", "smooth", "Smoothie de Taro", "Taro Smoothie", ["Frappé cremoso de taro.", "Creamy blended taro."], 90, "smooth", "#B79AD0", "#8E6CBA", "tapioca", { sort: 3 }),
  D("smoothie-maracuya", "smooth", "Smoothie de Maracuyá", "Passion Fruit Smoothie", ["Frappé cremoso de maracuyá.", "Creamy blended passion fruit."], 90, "smooth", "#F2B53C", "#EAA126", "tapioca", { ink: "#27211E", sort: 4 }),
];

export const MERCH: Merch[] = [
  { id: "tee-negra", name: { es: "Playera Koi Tea · negra", en: "Koi Tea tee · black" }, desc: { es: "Algodón, con KOI TEA · BOBA SHOP al pecho.", en: "Cotton, KOI TEA · BOBA SHOP chest print." }, price: 390, sizes: ["S", "M", "L", "XL"], art: "teeBlack", bg: "#E9E2D8", available: true, sort: 1 },
  { id: "tee-crema", name: { es: "Playera Peñasco · crema", en: "Peñasco tee · cream" }, desc: { es: "Boba, cangrejo, gaviota y olas de Puerto Peñasco.", en: "Boba, crab, seagull and Rocky Point waves." }, price: 390, sizes: ["S", "M", "L", "XL"], art: "teeCream", bg: "#DCE5DF", available: true, sort: 2 },
  { id: "tote", name: { es: "Tote Rocky Point", en: "Rocky Point tote" }, desc: { es: "Manta natural con dos koi dibujados.", en: "Natural canvas with two hand-drawn koi." }, price: 280, sizes: null, art: "tote", bg: "#F1E6D3", available: true, sort: 3 },
  { id: "gorra-negra", name: { es: "Gorra koi · negra", en: "Koi cap · black" }, desc: { es: "Con la mascota bordada al frente.", en: "With the embroidered mascot." }, price: 320, sizes: null, art: "capBlack", bg: "#E6DED3", available: true, sort: 4 },
  { id: "gorra-beige", name: { es: "Gorra koi · beige", en: "Koi cap · stone" }, desc: { es: "Con la mascota bordada al frente.", en: "With the embroidered mascot." }, price: 320, sizes: null, art: "capStone", bg: "#E2E7E0", available: true, sort: 5 },
];

export const DEFAULT_SETTINGS: Settings = {
  rate: 18,
  whatsapp: "",
  instagram: "koitea.mx",
  hours: "11:00 – 21:30",
  schedule: [
    [11 * 60, 21 * 60 + 30], [11 * 60, 21 * 60 + 30], [11 * 60, 21 * 60 + 30], [11 * 60, 21 * 60 + 30],
    [11 * 60, 21 * 60 + 30], [11 * 60, 21 * 60 + 30], [11 * 60, 21 * 60 + 30],
  ],
  address: "C. Benito Juárez 276, Col. José López Portillo",
  city: "Puerto Peñasco, Sonora · Rocky Point",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Koi+Tea+Boba+Shop+Puerto+Pe%C3%B1asco",
  tagline: { es: "Donde el sabor y el arte se unen", en: "Where flavor meets art" },
  origin: { es: "Ingredientes importados de Taiwán", en: "Ingredients imported from Taiwan" },
  acceptOrders: true,
  tableCount: 8,
  tips: [0, 10, 15],
  promo: null,
  payments: { stripe: false, mp: false },
  live: false,
};

export const STATIC_MENU: Menu = {
  categories: CATEGORIES,
  drinks: DRINKS,
  toppings: TOPPINGS,
  merch: MERCH,
  settings: DEFAULT_SETTINGS,
};

export const RATE_DEFAULT = 18;
