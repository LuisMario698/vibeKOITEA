// Prepara el entorno local después de `supabase start`:
//  1. escribe en .env.local la URL y las claves de la base local (conserva lo demás que tengas ahí)
//  2. crea el usuario del panel y lo da de alta en la tabla staff
//
// Uso: node scripts/local-db.mjs [correo] [contraseña]
// Por defecto: dueno@koitea.local / koitea-local
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] ?? "dueno@koitea.local").toLowerCase();
const password = process.argv[3] ?? "koitea-local";

let status;
try {
  const out = execFileSync("npx", ["supabase", "status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  status = JSON.parse(out.slice(out.indexOf("{")));
} catch {
  console.error("La base local no está corriendo. Arráncala con: npm run db:start");
  process.exit(1);
}

// ---------- .env.local ----------
const local = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3456",
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  ADMIN_EMAILS: email,
};
const file = ".env.local";
const lines = existsSync(file) ? readFileSync(file, "utf8").split("\n") : ["# Entorno local (generado por scripts/local-db.mjs; puedes agregar más variables)"];
for (const [k, v] of Object.entries(local)) {
  const i = lines.findIndex((l) => l.startsWith(`${k}=`));
  if (i >= 0) lines[i] = `${k}=${v}`; else lines.push(`${k}=${v}`);
}
writeFileSync(file, lines.join("\n").replace(/\n*$/, "\n"));
console.log(`✓ ${file} apunta a la base local (${status.API_URL})`);

// ---------- usuario del panel ----------
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error && !/already|registered|exists/i.test(error.message)) { console.error("No se pudo crear el usuario:", error.message); process.exit(1); }
const staff = await admin.from("staff").upsert({ email, name: "Koi Tea" }, { onConflict: "email" });
if (staff.error) { console.error("No se pudo dar de alta en staff:", staff.error.message); process.exit(1); }
console.log(`✓ Panel: http://localhost:3456/admin  ·  ${email} / ${error ? "(contraseña que ya tenía)" : password}`);
console.log(`✓ Studio (ver y editar tablas): ${status.STUDIO_URL}`);
console.log(`✓ Correos de prueba (enlace mágico): ${status.MAILPIT_URL ?? status.INBUCKET_URL}`);
console.log(`✓ Postgres directo: ${status.DB_URL}`);
