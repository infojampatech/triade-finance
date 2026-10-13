import { createRequire } from "node:module";

const require = createRequire(new URL("../packages/db/package.json", import.meta.url));
const pg = require("pg");
const { Client } = pg;

const targetUrl =
  process.env.EXTERNAL_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.argv[2];

if (!targetUrl) {
  console.log(`
\x1b[33m[Tríade Finance — Supabase Check]\x1b[0m
Nenhuma string de conexão informada.

Para testar a conexão com o Supabase Free Tier, defina a variável:
  \x1b[36m$env:EXTERNAL_DATABASE_URL = "postgres://postgres.[REF]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?sslmode=require"\x1b[0m
  \x1b[32mpnpm db:supabase:check\x1b[0m

Ou passe como argumento:
  \x1b[32mnode scripts/supabase-check.mjs "postgres://..."\x1b[0m
`);
  process.exit(0);
}

console.log("\x1b[34m[Tríade Finance]\x1b[0m Testando conectividade com banco de dados externo...");

// Supabase requires SSL in cloud connections
const isSupabase = targetUrl.includes("supabase.co") || targetUrl.includes("supabase.com");
const clientConfig = {
  connectionString: targetUrl,
  ssl: isSupabase || targetUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
};

const client = new Client(clientConfig);

try {
  const startTime = Date.now();
  await client.connect();
  const latency = Date.now() - startTime;

  const versionRes = await client.query("SELECT version() as version, current_database() as db, current_user as user");
  const row = versionRes.rows[0];

  console.log(`\x1b[32m✔ Conexão estabelecida com sucesso!\x1b[0m (latência: ${latency}ms)`);
  console.log(`  Banco de dados: \x1b[36m${row.db}\x1b[0m`);
  console.log(`  Usuário: \x1b[36m${row.user}\x1b[0m`);
  console.log(`  PostgreSQL: \x1b[90m${row.version.split(" on ")[0]}\x1b[0m`);

  // Check drizzle migrations
  const migrationsCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
    ) as exists;
  `);

  if (migrationsCheck.rows[0]?.exists) {
    const countRes = await client.query("SELECT count(*) as total FROM drizzle.__drizzle_migrations");
    console.log(`  Migrations Drizzle aplicadas: \x1b[32m${countRes.rows[0].total}\x1b[0m`);
  } else {
    console.log("  Migrations Drizzle: \x1b[33mNenhuma migration encontrada ainda (execute 'pnpm db:migrate')\x1b[0m");
  }

  await client.end();
  process.exit(0);
} catch (error) {
  console.error(`\x1b[31m✖ Erro ao conectar ao banco de dados:\x1b[0m`, error.message);
  await client.end().catch(() => {});
  process.exit(1);
}
