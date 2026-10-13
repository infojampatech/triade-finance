import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOrganizzeSyncDraft,
  normalizeOrganizzeAccountType,
  normalizeOrganizzeBudgetAmount,
  normalizeOrganizzeCategoryType,
  parseOrganizzeCategoryHierarchy,
  parseOrganizzeCsv,
  resolveSuggestedWorkspaceForCategory,
} from "./organizze";

test("normalizeOrganizzeCategoryType maps brazilian and english terms to category types", () => {
  assert.equal(normalizeOrganizzeCategoryType("receita"), "income");
  assert.equal(normalizeOrganizzeCategoryType("RECEITA"), "income");
  assert.equal(normalizeOrganizzeCategoryType("income"), "income");
  assert.equal(normalizeOrganizzeCategoryType("despesa"), "expense");
  assert.equal(normalizeOrganizzeCategoryType("expense"), "expense");
  assert.equal(normalizeOrganizzeCategoryType(undefined), "expense");
  assert.equal(normalizeOrganizzeCategoryType(""), "expense");
});

test("normalizeOrganizzeAccountType maps Organizze types to Triade account types", () => {
  assert.equal(normalizeOrganizzeAccountType("checking"), "checking");
  assert.equal(normalizeOrganizzeAccountType("conta corrente"), "checking");
  assert.equal(normalizeOrganizzeAccountType("poupanca"), "savings");
  assert.equal(normalizeOrganizzeAccountType("poupança"), "savings");
  assert.equal(normalizeOrganizzeAccountType("investimento"), "investment");
  assert.equal(normalizeOrganizzeAccountType("carteira"), "cash");
  assert.equal(normalizeOrganizzeAccountType("vale"), "benefits");
  assert.equal(normalizeOrganizzeAccountType("desconhecido"), "checking");
});

test("parseOrganizzeCategoryHierarchy splits hierarchy strings and normalizes names", () => {
  assert.deepEqual(parseOrganizzeCategoryHierarchy("Alimentação / Supermercado"), {
    parentName: "Alimentação",
    leafName: "Supermercado",
    fullName: "Alimentação > Supermercado",
  });

  assert.deepEqual(parseOrganizzeCategoryHierarchy("Moradia > Aluguel"), {
    parentName: "Moradia",
    leafName: "Aluguel",
    fullName: "Moradia > Aluguel",
  });

  assert.deepEqual(parseOrganizzeCategoryHierarchy("Supermercado", "Alimentação"), {
    parentName: "Alimentação",
    leafName: "Supermercado",
    fullName: "Alimentação > Supermercado",
  });

  assert.deepEqual(parseOrganizzeCategoryHierarchy("Lazer"), {
    parentName: null,
    leafName: "Lazer",
    fullName: "Lazer",
  });
});

test("resolveSuggestedWorkspaceForCategory routes domestic categories to family, PJ to business, and others to personal", () => {
  // Familiar
  assert.equal(resolveSuggestedWorkspaceForCategory("Supermercado", "expense"), "family");
  assert.equal(resolveSuggestedWorkspaceForCategory("Aluguel", "expense"), "family");
  assert.equal(resolveSuggestedWorkspaceForCategory("Conta de Luz", "expense"), "family");
  assert.equal(resolveSuggestedWorkspaceForCategory("Condomínio", "expense"), "family");
  assert.equal(resolveSuggestedWorkspaceForCategory("Educação / Escola", "expense"), "family");
  assert.equal(resolveSuggestedWorkspaceForCategory("Ração Pet", "expense"), "family");

  // Negócio (PJ)
  assert.equal(resolveSuggestedWorkspaceForCategory("DAS MEI", "expense"), "business");
  assert.equal(resolveSuggestedWorkspaceForCategory("Servidor AWS", "expense"), "business");
  assert.equal(resolveSuggestedWorkspaceForCategory("Contador", "expense"), "business");
  assert.equal(resolveSuggestedWorkspaceForCategory("Fornecedor Embalagens", "expense"), "business");

  // Pessoal
  assert.equal(resolveSuggestedWorkspaceForCategory("Cinema", "expense"), "personal");
  assert.equal(resolveSuggestedWorkspaceForCategory("Roupas", "expense"), "personal");
  assert.equal(resolveSuggestedWorkspaceForCategory("Salário", "income"), "personal");
});

test("normalizeOrganizzeBudgetAmount parses numbers and PT-BR strings accurately", () => {
  assert.equal(normalizeOrganizzeBudgetAmount(1500), 1500);
  assert.equal(normalizeOrganizzeBudgetAmount("1500.50"), 1500.5);
  assert.equal(normalizeOrganizzeBudgetAmount("1.250,75"), 1250.75);
  assert.equal(normalizeOrganizzeBudgetAmount("R$ 2.400,00"), 2400);
});

test("parseOrganizzeCsv extracts categories and budgets from CSV formats", () => {
  const csv = `Categoria;Tipo;Orcamento
Alimentacao / Supermercado;Despesa;1500,00
Moradia / Aluguel;Despesa;2200,00
Salario;Receita;
Lazer;Despesa;400,00`;

  const parsed = parseOrganizzeCsv(csv);

  assert.equal(parsed.categories.length, 4);
  assert.equal(parsed.categories[0]?.name, "Supermercado");
  assert.equal(parsed.categories[0]?.parentName, "Alimentacao");
  assert.equal(parsed.categories[0]?.type, "expense");

  assert.equal(parsed.budgets.length, 3);
  assert.equal(parsed.budgets[0]?.categoryName, "Supermercado");
  assert.equal(parsed.budgets[0]?.amount, 1500);
  assert.equal(parsed.budgets[1]?.categoryName, "Aluguel");
  assert.equal(parsed.budgets[1]?.amount, 2200);
});

test("buildOrganizzeSyncDraft consolidates accounts, categories and family budgets", () => {
  const draft = buildOrganizzeSyncDraft({
    accounts: [{ name: "Nubank Conta", type: "checking" }, { name: "Inter PJ", type: "checking" }],
    categories: [
      { name: "Alimentação / Supermercado", type: "expense" },
      { name: "Servidores Cloud", type: "expense" },
      { name: "Salário Mensal", type: "income" },
    ],
    budgets: [
      { categoryName: "Supermercado", amount: 1800 },
      { categoryName: "Servidores Cloud", amount: 500 },
    ],
    defaultPeriod: "2026-10",
  });

  assert.equal(draft.accounts.length, 2);
  assert.equal(draft.categories.length, 3);

  const mercadoCategory = draft.categories.find((c) => c.name === "Supermercado");
  assert.ok(mercadoCategory);
  assert.equal(mercadoCategory.targetWorkspaceType, "family");

  const cloudCategory = draft.categories.find((c) => c.name === "Servidores Cloud");
  assert.ok(cloudCategory);
  assert.equal(cloudCategory.targetWorkspaceType, "business");

  assert.equal(draft.budgets.length, 2);
  assert.equal(draft.budgets[0]?.period, "2026-10");
  assert.equal(draft.budgets[0]?.targetWorkspaceType, "family");
});
