#!/usr/bin/env node
// Localiza un negocio YA EXISTENTE en RYVO y devuelve su identidad real
// (branding + URL pública) como JSON — punto de entrada del flujo
// GENERATE/REVIEW de la skill ryvo-qr-materials.
//
// Deliberadamente de solo lectura: usa el cliente Supabase con la ANON
// KEY (misma que src/lib/supabase.ts expone como `supabase`, respeta
// RLS), nunca la service role key — esta skill no crea ni edita
// negocios, así que no hay ninguna razón para poder saltarse RLS.
//
// Uso:
//   node resolve-business.js --slug bella-vista
//   node resolve-business.js --name "Fernando Puliotti"
//   node resolve-business.js --id <uuid>
//   node resolve-business.js --url https://ryvo-arg.vercel.app/bella-vista

const path = require("path");
const fs = require("fs");

function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
      if (pkg.name === "ryvo") return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "No se encontró la raíz del repo RYVO (package.json con name:'ryvo') subiendo desde " +
      startDir
  );
}

const REPO_ROOT = findRepoRoot(__dirname);

// Mismas columnas públicas que BUSINESS_PUBLIC_COLUMNS en
// src/lib/data/business-repository.ts — NUNCA select("*") acá. RLS filtra
// por fila, no por columna: un select("*") sobre `businesses` devolvería
// también admin_password_hash con la anon key igual (ver skill `ryvo`,
// sección Supabase y seguridad). Si esa constante cambia, replicar acá.
const BUSINESS_PUBLIC_COLUMNS = [
  "id",
  "name",
  "slug",
  "description",
  "logo",
  "primary_color",
  "secondary_color",
  "whatsapp",
  "instagram",
  "address",
  "phone",
  "email",
  "city",
  "hero_image",
  "favicon",
  "background_color",
  "text_color",
  "typography_preset",
  "button_style",
  "published",
  "created_at",
].join(", ");

const KNOWN_PRODUCTION_DOMAIN = "https://ryvo-arg.vercel.app";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

function slugFromUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const segment = u.pathname.split("/").filter(Boolean)[0];
    return { slug: segment || null, host: u.host };
  } catch {
    return { slug: null, host: null };
  }
}

function loadEnv() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch (err) {
      console.error(`[resolve-business] no se pudo leer .env.local: ${err.message}`);
    }
  }
}

function siteUrlBase() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    return { base: fromEnv.replace(/\/+$/, ""), source: "env:NEXT_PUBLIC_SITE_URL" };
  }
  // Dominio real de producción documentado en la skill ryvo-onboarding
  // (references/onboarding-mode.md) — no es un valor inventado, es el
  // mismo que ya se usa para cargar negocios en RYVO. Se usa solo como
  // respaldo cuando la env var no está seteada en este entorno local.
  return { base: KNOWN_PRODUCTION_DOMAIN, source: "fallback:known-production-domain" };
}

function missingFields(business) {
  const missing = [];
  if (!business.logo) missing.push("logo");
  if (!business.primary_color) missing.push("primary_color");
  if (!business.whatsapp) missing.push("whatsapp");
  if (!business.instagram) missing.push("instagram");
  if (!business.favicon) missing.push("favicon");
  return missing;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let urlHint = null;
  let slugArg = args.slug;
  if (args.url) {
    const parsed = slugFromUrl(String(args.url));
    urlHint = parsed;
    if (!slugArg) slugArg = parsed.slug;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log(
      JSON.stringify(
        {
          found: false,
          error:
            "Supabase no está configurado en este entorno (falta NEXT_PUBLIC_SUPABASE_URL/ANON_KEY en .env.local). No se puede localizar un negocio real sin esto — no hay modo demo para esta skill porque el objetivo es generar materiales de negocios ya publicados.",
        },
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  // Lectura directa contra PostgREST (la misma API que usa el cliente
  // supabase-js por debajo) con `fetch` nativo, en vez de instanciar
  // @supabase/supabase-js: ese cliente deja handles de red pendientes
  // (auth/realtime) que en Windows crashean el proceso al salir
  // (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`). Un
  // request puntual y sin estado evita el problema y sigue respetando
  // RLS igual, porque pega con la misma anon key.
  const restUrl = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/businesses`;
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };

  async function queryBusinesses(filter) {
    const url = `${restUrl}?select=${encodeURIComponent(BUSINESS_PUBLIC_COLUMNS)}&${filter}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Supabase REST respondió ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  let business = null;
  let candidates = null;

  if (args.id) {
    const rows = await queryBusinesses(`id=eq.${encodeURIComponent(String(args.id))}`);
    business = rows[0] ?? null;
  } else if (slugArg) {
    const rows = await queryBusinesses(`slug=eq.${encodeURIComponent(String(slugArg))}`);
    business = rows[0] ?? null;
  } else if (args.name) {
    const rows = await queryBusinesses(`name=ilike.${encodeURIComponent(`*${String(args.name)}*`)}`);
    if (rows.length === 1) {
      business = rows[0];
    } else if (rows.length > 1) {
      candidates = rows.map((b) => ({ id: b.id, name: b.name, slug: b.slug, published: b.published }));
    }
  } else {
    console.log(
      JSON.stringify(
        { found: false, error: "Falta --slug, --name, --id o --url para localizar el negocio." },
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  // exitCode + return en vez de process.exit(): forzar un exit inmediato
  // acá, justo después de un fetch, puede correr una carrera de cierre de
  // socket que crashea el proceso en Windows (assertion de libuv en
  // undici) — dejar que el event loop drene solo evita la carrera.
  if (candidates) {
    console.log(JSON.stringify({ found: false, ambiguous: true, candidates }, null, 2));
    process.exitCode = 0;
    return;
  }

  if (!business) {
    console.log(
      JSON.stringify(
        { found: false, error: "No se encontró ningún negocio con esos datos en RYVO." },
        null,
        2
      )
    );
    process.exitCode = 0;
    return;
  }

  const { base, source } = siteUrlBase();
  const publicUrl = `${base}/${business.slug}`;
  const bookingUrl = `${base}/${business.slug}?reservar=1`;

  const warnings = [];
  if (business.published === false) {
    warnings.push(
      "El negocio tiene published=false: todavía no es visible en /[slug]. El QR apuntaría a una página que los clientes no pueden ver — confirmar con el usuario antes de imprimir."
    );
  }
  if (urlHint && urlHint.host && !urlHint.host.includes(new URL(base).host)) {
    warnings.push(
      `La URL pasada (${urlHint.host}) no coincide con el dominio de sitio esperado (${new URL(base).host}). Verificar que sea la URL correcta antes de continuar.`
    );
  }

  console.log(
    JSON.stringify(
      {
        found: true,
        business,
        publicUrl,
        bookingUrl,
        siteUrlSource: source,
        missing: missingFields(business),
        warnings,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(JSON.stringify({ found: false, error: err.message }, null, 2));
  process.exitCode = 1;
});
