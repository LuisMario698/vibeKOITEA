-- Koi Tea · esquema inicial
-- Menú editable, pedidos en vivo y personal del panel. Ejecutar en el SQL Editor de Supabase o con `supabase db push`.

create extension if not exists pgcrypto;

-- ---------- personal con acceso al panel ----------
create table if not exists public.staff (
  email text primary key,
  name text,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where lower(s.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- ---------- menú ----------
create table if not exists public.categories (
  id text primary key,
  name_es text not null,
  name_en text,
  sub_es text,
  sub_en text,
  sort int not null default 0
);

create table if not exists public.products (
  id text primary key,
  category_id text not null references public.categories(id) on delete cascade,
  name_es text not null,
  name_en text,
  desc_es text default '',
  desc_en text default '',
  price_mxn int not null check (price_mxn >= 0),
  kind text not null default 'milk' check (kind in ('milk','brown','fruit','smooth')),
  c1 text not null default '#C9A27E',
  c2 text,
  pop text not null default '#B07D55',
  ink text,
  topping text not null default 'tapioca',
  featured boolean not null default false,
  available boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.toppings (
  id text primary key,
  name_es text not null,
  name_en text,
  color text not null default '#2A1810',
  type text not null default 'tapioca' check (type in ('tapioca','pop','jelly')),
  price_mxn int not null default 0 check (price_mxn >= 0),
  available boolean not null default true,
  sort int not null default 0
);

create table if not exists public.merch (
  id text primary key,
  name_es text not null,
  name_en text,
  desc_es text default '',
  desc_en text default '',
  price_mxn int not null check (price_mxn >= 0),
  sizes jsonb,
  art text not null default 'teeBlack' check (art in ('teeBlack','teeCream','tote','capBlack','capStone')),
  bg text not null default '#E9E2D8',
  available boolean not null default true,
  sort int not null default 0
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  rate numeric(8,2) not null default 18,
  whatsapp text default '',
  instagram text default 'koitea.mx',
  hours text default '11:00 – 21:30',
  schedule jsonb default '[[660,1290],[660,1290],[660,1290],[660,1290],[660,1290],[660,1290],[660,1290]]'::jsonb,
  address text default 'C. Benito Juárez 276, Col. José López Portillo',
  city text default 'Puerto Peñasco, Sonora · Rocky Point',
  maps_url text default 'https://www.google.com/maps/search/?api=1&query=Koi+Tea+Boba+Shop+Puerto+Pe%C3%B1asco',
  tagline_es text default 'Donde el sabor y el arte se unen',
  tagline_en text default 'Where flavor meets art',
  origin_es text default 'Ingredientes importados de Taiwán',
  origin_en text default 'Ingredients imported from Taiwan',
  accept_orders boolean not null default true,
  table_count int not null default 8,
  tips jsonb default '[0,10,15]'::jsonb,
  promo_es text,
  promo_en text,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------- pedidos ----------
create sequence if not exists public.order_code_seq;

create or replace function public.next_order_code() returns text
language sql volatile security definer set search_path = public as $$
  select 'K-' || (100 + (nextval('public.order_code_seq') % 900))::text;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  status smallint not null default 0 check (status in (0,1,2,3,9)),
  type text not null default 'togo' check (type in ('togo','table')),
  table_no int,
  name text default '',
  phone text default '',
  cc text default '52',
  lang text default 'es',
  items jsonb not null default '[]'::jsonb,
  subtotal int not null default 0,
  tip int not null default 0,
  total int not null default 0,
  pm text not null default 'bar' check (pm in ('express','card','mp','bar')),
  paid boolean not null default false,
  payment_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_code_idx on public.orders (code, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ---------- seguridad (RLS) ----------
alter table public.staff enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.toppings enable row level security;
alter table public.merch enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;

drop policy if exists "staff self" on public.staff;
create policy "staff self" on public.staff for select to authenticated using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- el menú es público de lectura; solo el personal lo edita
do $$
declare t text;
begin
  foreach t in array array['categories','products','toppings','merch','settings'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "staff write" on public.%I', t);
    execute format('create policy "staff write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- los pedidos los crea el servidor (clave de servicio); el personal los ve y actualiza
drop policy if exists "staff orders" on public.orders;
create policy "staff orders" on public.orders for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------- tiempo real para el panel ----------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
