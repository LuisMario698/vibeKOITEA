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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** `supabase status` sale con error si algún servicio aún no pasa su chequeo de salud, pero igual imprime las claves. */
function readStatus() {
  let out = "";
  try { out = execFileSync("npx", ["supabase", "status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch (e) { out = String(e.stdout ?? ""); }
  const i = out.indexOf("{");
  if (i < 0) return null;
  try { const j = JSON.parse(out.slice(i, out.lastIndexOf("}") + 1)); return j.API_URL && j.ANON_KEY ? j : null; } catch { return null; }
}

let status = null;
for (let i = 0; i < 20 && !status; i++) { status = readStatus(); if (!status) await sleep(3000); }
if (!status) {
  console.error("La base local no está corriendo. Abre Docker Desktop y arráncala con: npm run db:start");
  process.exit(1);
}

/** En la primera arrancada (sobre todo en Mac) los servicios tardan en responder: esperamos hasta 2 minutos. */
async function waitFor(name, url, headers) {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(url, { headers }); if (r.status < 500) return true; } catch { /* aún arrancando */ }
    if (i === 0) process.stdout.write(`… esperando a ${name}`); else if (i % 5 === 0) process.stdout.write(".");
    await sleep(2000);
  }
  return false;
}
const key = { apikey: status.ANON_KEY };
const authOk = await waitFor("el inicio de sesión", `${status.API_URL}/auth/v1/health`, key);
const restOk = await waitFor("la API", `${status.API_URL}/rest/v1/settings?select=id`, key);
if (!authOk || !restOk) {
  console.error("\nLos servicios de la base no respondieron. Revisa en Docker Desktop que haya memoria suficiente (4 GB o más) y vuelve a correr: npm run db:start");
  process.exit(1);
}
process.stdout.write("\r");

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
const rt = await waitFor("el tiempo real", `${status.API_URL}/realtime/v1/api/ping`, key);
if (!rt) console.log("\n⚠ El tiempo real aún no responde: el tablero del panel se actualiza igual cada 30 s y se conecta solo cuando esté listo.");
console.log("\nListo. Arranca el sitio con: npm run dev  →  http://localhost:3456");
