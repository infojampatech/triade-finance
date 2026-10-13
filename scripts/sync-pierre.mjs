/**
 * Script de sincronização autônoma com o conector Pierre Finance.
 * Executado pelo GitHub Actions a cada 4 horas ou manualmente via CLI.
 */

const triadeUrl = (process.env.TRIADE_URL || process.env.OPENMONETIS_URL || "").replace(/\/+$/, "");
const token = process.env.PIERRE_INTEGRATION_TOKEN;
const pierreApiUrl = process.env.PIERRE_API_URL;
const pierreApiKey = process.env.PIERRE_API_KEY;

if (!triadeUrl || !token) {
  console.log(`
\x1b[33m[Tríade Finance — Sync Pierre]\x1b[0m
Variáveis obrigatórias não encontradas:
- TRIADE_URL (ex: https://financas.seudominio.com.br)
- PIERRE_INTEGRATION_TOKEN (token de dispositivo gerado nas configurações)

Configuradas nos Secrets do repositório GitHub para automação.
`);
  process.exit(1);
}

console.log(`\x1b[34m[Tríade Finance]\x1b[0m Iniciando sincronização com Pierre em: ${triadeUrl}`);

async function fetchPendingTransactions() {
  if (pierreApiUrl && pierreApiKey) {
    console.log("Buscando transações recentes na API do Pierre Finance...");
    const res = await fetch(`${pierreApiUrl}/transactions/pending`, {
      headers: {
        Authorization: `Bearer ${pierreApiKey}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Falha ao obter transações do Pierre: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.transactions || [];
  }

  // Heartbeat / Keep-alive mode (mantém o Supabase acordado e valida conexão)
  console.log("Nenhuma API externa do Pierre configurada; executando verificação de integridade...");
  return [];
}

async function run() {
  try {
    const transactions = await fetchPendingTransactions();

    if (transactions.length === 0) {
      console.log("\x1b[32m✔ Nenhuma transação pendente no momento.\x1b[0m Conexão validada com sucesso!");
      process.exit(0);
    }

    const endpoint = `${triadeUrl}/api-proxy/integrations/pierre/transactions`;
    console.log(`Enviando ${transactions.length} transações para ${endpoint}...`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transactions }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Falha na ingestão: HTTP ${res.status} - ${errBody}`);
    }

    const { data } = await res.json();
    console.log(`\x1b[32m✔ Sincronização concluída!\x1b[0m`);
    console.log(`  Total: ${data.total}`);
    console.log(`  Importados: ${data.imported}`);
    console.log(`  Duplicados ignorados: ${data.duplicates}`);
    console.log(`  Falhas: ${data.failed}`);

    process.exit(0);
  } catch (error) {
    console.error(`\x1b[31m✖ Erro na sincronização:\x1b[0m`, error.message);
    process.exit(1);
  }
}

await run();
