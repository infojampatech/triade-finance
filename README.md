<p align="center">
  <h1 align="center">Tríade Finance</h1>
</p>

<p align="center">
  Sistema integrado de gestão financeira pessoal, familiar e empresarial (PJ).
  Arquitetura API-first, self-hosted e privacy-focused com orquestração de dados bancários.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licen%C3%A7a-Sustainable%20Use%201.0-f97316" alt="Licença" /></a>
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/version-0.10.2-f97316" alt="Versão 0.10.2" /></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-22c55e" alt="Node.js" />
  <img src="https://img.shields.io/badge/Docker-Self--Hosted-2496ED?logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <a href="#inicialização-rápida-desenvolvimento-local">Instalação</a> ·
  <a href="docs/production-deployment.md">Produção</a> ·
  <a href="docs/architecture.md">Arquitetura</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="CONTRIBUTING.md">Contribuir</a>
</p>

---

## Os Três Pilares da Tríade

1. **Pessoal**: Gastos individuais, patrimônio líquido, investimentos e metas próprias.
2. **Familiar**: Orçamento doméstico compartilhado, divisão de despesas do lar e contas conjuntas.
3. **Negócio (PJ / Autônomo)**: Fluxo de caixa corporativo, controle de notas, previsão de impostos e pró-labore segregado.

## Arquitetura Tecnológica

- **Backend**: Hono, Drizzle ORM, Zod, OpenAPI, PostgreSQL 16.
- **Frontend**: TanStack Start / Router / Query, React 19, Tailwind CSS, shadcn/ui.
- **Automação & Hub**: Conectores de sincronização bancária e motor de conciliação por regras.
- **Multiplataforma**: Suporte nativo para desenvolvimento e execução em Linux, macOS e Windows (usando flags nativas `--env-file`).

## Inicialização Rápida (Desenvolvimento Local)

### Pré-requisitos
- Node.js >= 20.19 (compatível com Node 22 e 24+)
- pnpm >= 9 (recomendado pnpm 11)
- Docker e Docker Compose

```bash
# 1. Clonar repositório
git clone https://github.com/infojampatech/triade-finance.git
cd triade-finance

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Iniciar banco de dados e aplicar migrações
pnpm docker:db
pnpm db:migrate

# 5. Iniciar aplicação (API e Web em paralelo)
pnpm dev
```

- **Web UI**: [http://localhost:7002](http://localhost:7002)
- **API Backend**: [http://localhost:7001](http://localhost:7001)
- **Banco de Dados (Host)**: `127.0.0.1:7000`
- **Drizzle Studio**: `pnpm db:studio`

## Execução via Docker Compose (Produção / Homologação)

```bash
docker compose up -d
```

Para publicar a aplicação com HTTPS, storage privado e segredos próprios, consulte o [guia de produção](docs/production-deployment.md).

## Comandos Úteis

```bash
pnpm check      # Checagem de tipos TypeScript
pnpm test       # Execução da suíte de testes
pnpm build      # Build de produção de todos os pacotes e apps
pnpm lint       # Verificação com Biome e Oxlint
```

## Arquitetura do Monorepo

O projeto segue Clean Architecture leve API-first. A API é a fonte de verdade, o domínio concentra as regras financeiras puras e o cliente web consulta e renderiza esse estado.

```text
apps/web (TanStack Start) -> apps/api (Hono) -> services -> domain
                                                    └-----> repositories -> Drizzle -> PostgreSQL
```

Veja mais detalhes técnicos e padrões no [guia de arquitetura](docs/architecture.md).

## Documentação

- [`docs/production-deployment.md`](docs/production-deployment.md): instalação, atualização, segurança operacional e backups;
- [`docs/architecture.md`](docs/architecture.md): camadas, decisões e estrutura do monorepo;
- [`docs/companion-api.md`](docs/companion-api.md): contrato do Companion;
- [`CONTRIBUTING.md`](CONTRIBUTING.md): fluxo para contribuições;
- [`SECURITY.md`](SECURITY.md): comunicação responsável de vulnerabilidades.

## Licença

O projeto utiliza a [Sustainable Use License 1.0](LICENSE). O uso pessoal, não comercial e interno é permitido; exploração comercial exige autorização separada do titular.
