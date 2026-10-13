import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrganizzeService,
  type OrganizzeRepository,
} from "./organizze.service";

const userId = "00000000-0000-4000-8000-000000000001";
const familyWorkspaceId = "00000000-0000-4000-8000-000000000010";
const personalWorkspaceId = "00000000-0000-4000-8000-000000000011";
const businessWorkspaceId = "00000000-0000-4000-8000-000000000012";

function createMockRepository(overrides: Partial<OrganizzeRepository> = {}): OrganizzeRepository {
  const workspaces = [
    { id: personalWorkspaceId, name: "Pessoal", type: "personal" as const },
    { id: familyWorkspaceId, name: "Familiar", type: "family" as const },
    { id: businessWorkspaceId, name: "Negócio", type: "business" as const },
  ];

  let accounts: Array<{ id: string; name: string; type: "checking" | "savings" | "investment" | "cash" | "benefits" | "other" }> = [
    { id: "acc-1", name: "Nubank", type: "checking" },
  ];

  let categories: Array<{ id: string; name: string; type: "expense" | "income"; workspaceId: string | null }> = [
    { id: "cat-1", name: "Alimentação", type: "expense", workspaceId: familyWorkspaceId },
  ];

  let budgets: Array<{ id: string; categoryId: string; amount: string; period: string; workspaceId: string | null }> = [
    { id: "bgt-1", categoryId: "cat-1", amount: "1000.00", period: "2026-10", workspaceId: familyWorkspaceId },
  ];

  return {
    findWorkspacesByUser: async () => workspaces,
    findAccountsByUser: async () => accounts,
    createAccounts: async (data) => {
      const created = data.map((a, i) => ({ id: `acc-new-${i}`, name: a.name, type: a.type }));
      accounts = [...accounts, ...created];
      return created;
    },
    findCategoriesByUser: async () => categories,
    createCategories: async (data) => {
      const created = data.map((c, i) => ({
        id: `cat-new-${i}`,
        name: c.name,
        type: c.type,
        workspaceId: c.workspaceId,
      }));
      categories = [...categories, ...created];
      return created;
    },
    findBudgetsByUserAndPeriod: async (_uid, period) => budgets.filter((b) => b.period === period),
    upsertBudget: async (data) => {
      const existing = budgets.find((b) => b.categoryId === data.categoryId && b.period === data.period);
      if (existing) {
        existing.amount = data.amount;
        return { id: existing.id };
      }
      const newBudget = { id: `bgt-new-${budgets.length + 1}`, ...data };
      budgets.push(newBudget);
      return { id: newBudget.id };
    },
    ...overrides,
  };
}

test("preview calculates correct summaries and classifies workspaces without persisting", async () => {
  const repo = createMockRepository();
  const service = createOrganizzeService(repo);

  const preview = await service.preview(userId, {
    accounts: [{ name: "Inter PJ", type: "checking" }],
    categories: [
      { name: "Supermercado", parentName: "Alimentação", type: "expense" },
      { name: "Servidores Cloud", type: "expense" },
    ],
    budgets: [{ categoryName: "Supermercado", amount: 1500, period: "2026-10" }],
    defaultPeriod: "2026-10",
  });

  assert.equal(preview.totalAccounts, 1);
  assert.equal(preview.totalCategories, 2);
  assert.equal(preview.totalBudgets, 1);

  const mercado = preview.categories.find((c) => c.name === "Supermercado");
  assert.equal(mercado?.targetWorkspaceType, "family");

  const servers = preview.categories.find((c) => c.name === "Servidores Cloud");
  assert.equal(servers?.targetWorkspaceType, "business");
});

test("sync idempotently creates missing accounts, categories and upserts budgets into Family workspace", async () => {
  let createdCategoryRows: Array<{ name: string; workspaceId: string | null }> = [];
  let upsertedBudgetRows: Array<{ categoryId: string; amount: string; workspaceId: string | null }> = [];

  const repo = createMockRepository({
    createCategories: async (data) => {
      createdCategoryRows = data;
      return data.map((c, i) => ({ id: `cat-created-${i}`, name: c.name, type: c.type, workspaceId: c.workspaceId }));
    },
    upsertBudget: async (data) => {
      upsertedBudgetRows.push(data);
      return { id: "bgt-1" };
    },
  });

  const service = createOrganizzeService(repo);

  const result = await service.sync(userId, {
    accounts: [
      { name: "Nubank", type: "checking" }, // already exists
      { name: "Inter PJ", type: "checking" }, // new
    ],
    categories: [
      { name: "Alimentação", type: "expense" }, // already exists
      { name: "Supermercado", type: "expense" }, // new (should be assigned to family)
      { name: "DAS MEI", type: "expense" }, // new (should be assigned to business)
    ],
    budgets: [
      { categoryName: "Alimentação", amount: 1200, period: "2026-10" }, // already exists -> update
      { categoryName: "Supermercado", amount: 800, period: "2026-10" }, // newly created -> create
    ],
    defaultPeriod: "2026-10",
  });

  assert.equal(result.accountsCreated, 1);
  assert.equal(result.accountsExisting, 1);
  assert.equal(result.categoriesCreated, 2);
  assert.equal(result.categoriesExisting, 1);
  assert.equal(result.budgetsCreated, 1);
  assert.equal(result.budgetsUpdated, 1);

  // Validate workspace routing
  const mercadoCat = createdCategoryRows.find((c) => c.name === "Supermercado");
  assert.equal(mercadoCat?.workspaceId, familyWorkspaceId);

  const dasCat = createdCategoryRows.find((c) => c.name === "DAS MEI");
  assert.equal(dasCat?.workspaceId, businessWorkspaceId);

  // Validate budgets linked to Family workspace
  assert.equal(upsertedBudgetRows.length, 2);
  assert.equal(upsertedBudgetRows[0]?.amount, "1200.00");
  assert.equal(upsertedBudgetRows[0]?.workspaceId, familyWorkspaceId);
  assert.equal(upsertedBudgetRows[1]?.amount, "800.00");
  assert.equal(upsertedBudgetRows[1]?.workspaceId, familyWorkspaceId);
});
