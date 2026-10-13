# Banco de Dados em Nuvem: Supabase Free Tier (Custo Zero)

Este guia orienta a configuração de um banco de dados PostgreSQL 16 gerenciado no **Supabase Free Tier** para hospedar os dados do **Tríade Finance** sem nenhum custo de infraestrutura.

---

## 1. Por Que o Supabase Free Tier?

- **Custo Zero:** Plano gratuito permanente com 500 MB de armazenamento em disco (suficiente para mais de 10 anos de lançamentos financeiros diários).
- **PostgreSQL Puro:** Totalmente compatível com o Drizzle ORM do Tríade Finance e as 13 migrations existentes.
- **Connection Pooling Embutido (Supavisor):** Suporta até 200 conexões simultâneas via pooler nas portas `6543` e `5432`.
- **SSL Obrigatório:** Criptografia de ponta a ponta na rede.

---

## 2. Passo a Passo: Criando o Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login (pode usar sua conta GitHub).
2. Clique em **"New Project"**.
3. Preencha as informações:
   - **Name:** `triade-finance`
   - **Database Password:** Gere uma senha forte (guarde com segurança).
   - **Region:** Selecione `South America (São Paulo) - sa-east-1` para menor latência ou `East US (North Virginia) - us-east-1`.
4. Clique em **"Create new project"** e aguarde cerca de 1 a 2 minutos até o provisionamento concluir.

---

## 3. Obtendo a String de Conexão (Connection Pooler)

No painel do projeto no Supabase:
1. Vá para **Project Settings** (ícone de engrenagem) $\rightarrow$ **Database**.
2. Role até a seção **Connection parameters** / **Connection Pooling**:
   - **Modo Session (Porta 5432):** Recomendado para rodar as migrações com Drizzle Kit.
   - **Modo Transaction (Porta 6543):** Recomendado para o runtime da API e conexões serverless.
3. Copie a URI de conexão (Node.js / URI). O formato será semelhante a:

```text
postgres://postgres.[PROJECT_REF]:[SUA_SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?sslmode=require
```

---

## 4. Testando a Conexão e Aplicando as Migrações

O Tríade Finance possui um script utilitário dedicado para diagnosticar a conexão com o Supabase antes de aplicar migrações:

### 4.1 Testar Conectividade
No PowerShell ou terminal:
```bash
node scripts/supabase-check.mjs "postgres://postgres.[REF]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?sslmode=require"
```

Saída esperada:
```text
[Tríade Finance] Testando conectividade com banco de dados externo...
✔ Conexão estabelecida com sucesso! (latência: 45ms)
  Banco de dados: postgres
  Usuário: postgres.[REF]
  PostgreSQL: PostgreSQL 16
  Migrations Drizzle: Nenhuma migration encontrada ainda (execute 'pnpm db:migrate')
```

### 4.2 Executar as Migrações
Com a conectividade confirmada, execute as migrações do schema:

**No Windows (PowerShell):**
```powershell
$env:EXTERNAL_DATABASE_URL = "postgres://postgres.[REF]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:5432/postgres?sslmode=require"
pnpm db:migrate
```

**No Linux / macOS (Bash):**
```bash
EXTERNAL_DATABASE_URL="postgres://postgres.[REF]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:5432/postgres?sslmode=require" pnpm db:migrate
```

O Drizzle criará automaticamente as tabelas (`users`, `workspaces`, `financial_accounts`, `categories`, `inbox_rules`, `budgets`, etc.) e aplicará os índices de performance.

---

## 5. Conectando a Aplicação Tríade

### 5.1 No `.env` Local (Desenvolvimento contra o Supabase)
Basta adicionar ao seu `.env` da raiz:
```dotenv
EXTERNAL_DATABASE_URL=postgres://postgres.[REF]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?sslmode=require
```
E desligar o container local de PostgreSQL (`docker compose stop db`). O Tríade Finance conectará automaticamente ao Supabase.

### 5.2 Em Produção (Docker / Nuvem)
No ambiente de produção, configure:
```dotenv
DATABASE_URL=postgres://postgres.[REF]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?sslmode=require
```

---

## 6. Prevenção de Auto-Pause no Plano Gratuito

O Supabase pausa projetos no Free Tier se passarem **7 dias seguidos sem nenhuma requisição ao banco**.

Para manter seu projeto ativo continuamente com custo zero:
- A automação do GitHub Actions de sincronização com o Pierre Finance (`.github/workflows/sync-pierre.yml`), agendada para rodar a cada 4 horas (`cron: "0 */4 * * *"`), faz chamadas regulares que mantêm o banco acordado 24 horas por dia, 7 dias por semana.
