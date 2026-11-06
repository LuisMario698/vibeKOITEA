// Genera supabase/seed.sql a partir de los datos estáticos del menú (src/lib/menu/data.ts).
// Uso: node scripts/seed-sql.mjs > supabase/seed.sql
import { CATEGORIES, DRINKS, MERCH, TOPPINGS } from "../src/lib/menu/data.ts";

const q = (v) => (v == null ? "null" : typeof v === "number" ? String(v) : typeof v === "boolean" ? (v ? "true" : "false") : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const out = [];
out.push("-- Semilla del menú de Koi Tea (precios ILUSTRATIVOS: confirmar con el negocio). Generado por scripts/seed-sql.mjs");
for (const c of CATEGORIES) out.push(`insert into public.categories (id,name_es,name_en,sub_es,sub_en,sort) values (${q(c.id)},${q(c.name.es)},${q(c.name.en)},${q(c.sub?.es)},${q(c.sub?.en)},${c.sort}) on conflict (id) do update set name_es=excluded.name_es,name_en=excluded.name_en,sub_es=excluded.sub_es,sub_en=excluded.sub_en,sort=excluded.sort;`);
for (const t of TOPPINGS) out.push(`insert into public.toppings (id,name_es,name_en,color,type,price_mxn,available,sort) values (${q(t.id)},${q(t.name.es)},${q(t.name.en)},${q(t.color)},${q(t.type)},${t.price},${t.available},${t.sort}) on conflict (id) do update set name_es=excluded.name_es,name_en=excluded.name_en,color=excluded.color,type=excluded.type,sort=excluded.sort;`);
for (const d of DRINKS) out.push(`insert into public.products (id,category_id,name_es,name_en,desc_es,desc_en,price_mxn,kind,c1,c2,pop,ink,topping,featured,available,sort) values (${q(d.id)},${q(d.cat)},${q(d.name.es)},${q(d.name.en)},${q(d.desc.es)},${q(d.desc.en)},${d.price},${q(d.kind)},${q(d.c1)},${q(d.c2)},${q(d.pop)},${q(d.ink)},${q(d.topping)},${d.featured},${d.available},${d.sort}) on conflict (id) do update set category_id=excluded.category_id,name_es=excluded.name_es,name_en=excluded.name_en,desc_es=excluded.desc_es,desc_en=excluded.desc_en,kind=excluded.kind,c1=excluded.c1,c2=excluded.c2,pop=excluded.pop,ink=excluded.ink,topping=excluded.topping,sort=excluded.sort;`);
for (const m of MERCH) out.push(`insert into public.merch (id,name_es,name_en,desc_es,desc_en,price_mxn,sizes,art,bg,available,sort) values (${q(m.id)},${q(m.name.es)},${q(m.name.en)},${q(m.desc.es)},${q(m.desc.en)},${m.price},${m.sizes ? j(m.sizes) : "null"},${q(m.art)},${q(m.bg)},${m.available},${m.sort}) on conflict (id) do update set name_es=excluded.name_es,name_en=excluded.name_en,desc_es=excluded.desc_es,desc_en=excluded.desc_en,sizes=excluded.sizes,art=excluded.art,bg=excluded.bg,sort=excluded.sort;`);
out.push("-- Da de alta aquí a quien podrá entrar al panel (debe coincidir con el correo con el que inicia sesión):");
out.push("-- insert into public.staff (email, name) values ('dueno@koitea.mx', 'Koi Tea') on conflict do nothing;");
console.log(out.join("\n"));
