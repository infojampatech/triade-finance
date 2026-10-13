import type { AccountType } from "./accounts";
import type { CategoryType } from "./categories";
import type { WorkspaceType } from "./workspaces";

export type OrganizzeAccountInput = {
  id?: string;
  name: string;
  type?: string;
  balance?: number;
};

export type OrganizzeCategoryInput = {
  id?: string;
  name: string;
  parentName?: string | null;
  type?: string;
  icon?: string | null;
  color?: string | null;
  targetWorkspaceType?: WorkspaceType | null;
};

export type OrganizzeBudgetInput = {
  categoryName: string;
  amount: number | string;
  period?: string;
  targetWorkspaceType?: WorkspaceType | null;
};

export type OrganizzeImportPayload = {
  accounts?: OrganizzeAccountInput[];
  categories?: OrganizzeCategoryInput[];
  budgets?: OrganizzeBudgetInput[];
  defaultPeriod?: string;
  csvContent?: string;
};

export type NormalizedOrganizzeCategory = {
  name: string;
  parentName: string | null;
  fullName: string;
  type: CategoryType;
  icon: string | null;
  targetWorkspaceType: WorkspaceType;
};

export type NormalizedOrganizzeAccount = {
  name: string;
  type: AccountType;
  initialBalance?: number;
};

export type NormalizedOrganizzeBudget = {
  categoryName: string;
  amount: number;
  period: string;
  targetWorkspaceType: WorkspaceType;
};

export type OrganizzeSyncDraft = {
  accounts: NormalizedOrganizzeAccount[];
  categories: NormalizedOrganizzeCategory[];
  budgets: NormalizedOrganizzeBudget[];
  defaultPeriod: string;
};

const familyCategoryKeywords = [
  "supermercado",
  "mercado",
  "feira",
  "hortifruti",
  "aluguel",
  "condominio",
  "condomínio",
  "luz",
  "energia",
  "agua",
  "água",
  "gas",
  "gás",
  "internet",
  "iptu",
  "moradia",
  "casa",
  "reforma",
  "manutencao",
  "manutenção",
  "diarista",
  "empregada",
  "escola",
  "colegio",
  "colégio",
  "faculdade",
  "educacao",
  "educação",
  "filhos",
  "bebe",
  "bebê",
  "pet",
  "veterinario",
  "veterinário",
  "farmacia",
  "farmácia",
  "saude",
  "saúde",
  "plano de saude",
  "familia",
  "família",
];

const businessCategoryKeywords = [
  "das",
  "simples nacional",
  "contador",
  "contabilidade",
  "imposto pj",
  "impostos",
  "servidor",
  "hosting",
  "dominio",
  "domínio",
  "software",
  "saas",
  "fornecedor",
  "empresa",
  "pj",
  "pro-labore",
  "prolabore",
  "nota fiscal",
  "marketing digital",
];

export function normalizeOrganizzeCategoryType(type?: string): CategoryType {
  if (!type) return "expense";
  const normalized = type.trim().toLowerCase();
  if (normalized === "receita" || normalized === "income" || normalized === "entrada") {
    return "income";
  }
  return "expense";
}

export function normalizeOrganizzeAccountType(type?: string): AccountType {
  if (!type) return "checking";
  const normalized = type.trim().toLowerCase();
  if (
    normalized.includes("corrente") ||
    normalized.includes("checking") ||
    normalized.includes("cartao") ||
    normalized.includes("cartão")
  ) {
    return "checking";
  }
  if (normalized.includes("poupanc") || normalized.includes("poupanç") || normalized.includes("savings")) {
    return "savings";
  }
  if (normalized.includes("invest") || normalized.includes("investment")) {
    return "investment";
  }
  if (normalized.includes("carteira") || normalized.includes("dinheiro") || normalized.includes("cash")) {
    return "cash";
  }
  if (normalized.includes("vale") || normalized.includes("beneficio") || normalized.includes("benefício") || normalized.includes("benefits")) {
    return "benefits";
  }
  return "checking";
}

export function parseOrganizzeCategoryHierarchy(
  name: string,
  parentNameInput?: string | null,
): { parentName: string | null; leafName: string; fullName: string } {
  const trimmed = name.trim();
  let parent = parentNameInput?.trim() || null;
  let leaf = trimmed;

  if (!parent) {
    if (trimmed.includes(" / ")) {
      const parts = trimmed.split(" / ").map((p) => p.trim());
      parent = parts[0] ?? null;
      leaf = parts.slice(1).join(" / ");
    } else if (trimmed.includes(" > ")) {
      const parts = trimmed.split(" > ").map((p) => p.trim());
      parent = parts[0] ?? null;
      leaf = parts.slice(1).join(" > ");
    } else if (trimmed.includes(" - ")) {
      const parts = trimmed.split(" - ").map((p) => p.trim());
      parent = parts[0] ?? null;
      leaf = parts.slice(1).join(" - ");
    }
  }

  const fullName = parent ? `${parent} > ${leaf}` : leaf;
  return { parentName: parent, leafName: leaf, fullName };
}

function matchesKeyword(normalizedText: string, keyword: string): boolean {
  const normalizedKeyword = keyword
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const pattern = new RegExp(`(^|[^a-z0-9])${normalizedKeyword}(?:s|es)?([^a-z0-9]|$)`, "i");
  return pattern.test(normalizedText);
}

export function resolveSuggestedWorkspaceForCategory(
  categoryName: string,
  categoryType: CategoryType,
): WorkspaceType {
  if (categoryType === "income") {
    return "personal";
  }

  const normalized = categoryName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  for (const keyword of familyCategoryKeywords) {
    if (matchesKeyword(normalized, keyword)) {
      return "family";
    }
  }

  for (const keyword of businessCategoryKeywords) {
    if (matchesKeyword(normalized, keyword)) {
      return "business";
    }
  }

  return "personal";
}

export function normalizeOrganizzeBudgetAmount(amount: number | string): number {
  if (typeof amount === "number") {
    return Math.abs(Math.round(amount * 100) / 100);
  }
  const cleanStr = String(amount)
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3})/g, "") // remove thousands separators
    .replace(",", "."); // convert decimal separator
  const parsed = Number.parseFloat(cleanStr);
  return Number.isFinite(parsed) ? Math.abs(Math.round(parsed * 100) / 100) : 0;
}

export function resolveCurrentPeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseOrganizzeCsv(csv: string): {
  categories: OrganizzeCategoryInput[];
  budgets: OrganizzeBudgetInput[];
  accounts: OrganizzeAccountInput[];
} {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { categories: [], budgets: [], accounts: [] };
  }

  const headerLine = lines[0] ?? "";
  const delimiter = headerLine.includes(";") ? ";" : ",";
  const headers = headerLine.split(delimiter).map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim(),
  );

  const catIdx = headers.findIndex((h) => h.includes("categoria"));
  const subIdx = headers.findIndex((h) => h.includes("subcategoria") || h.includes("pai"));
  const typeIdx = headers.findIndex((h) => h.includes("tipo"));
  const budgetIdx = headers.findIndex(
    (h) => h.includes("orcamento") || h.includes("limite") || h.includes("valor"),
  );

  const categories: OrganizzeCategoryInput[] = [];
  const budgets: OrganizzeBudgetInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]?.split(delimiter).map((col) => col.trim()) ?? [];
    if (row.length === 0 || !row[catIdx >= 0 ? catIdx : 0]) continue;

    const rawCategory = row[catIdx >= 0 ? catIdx : 0] ?? "";
    const rawSubcategory = subIdx >= 0 ? row[subIdx] : null;
    const rawType = typeIdx >= 0 ? row[typeIdx] : "despesa";
    const rawBudget = budgetIdx >= 0 ? row[budgetIdx] : "";

    const parsedHierarchy = parseOrganizzeCategoryHierarchy(rawCategory, rawSubcategory);
    const catType = normalizeOrganizzeCategoryType(rawType);

    categories.push({
      name: parsedHierarchy.leafName,
      parentName: parsedHierarchy.parentName,
      type: catType,
    });

    if (rawBudget && rawBudget.trim().length > 0) {
      const amount = normalizeOrganizzeBudgetAmount(rawBudget);
      if (amount > 0) {
        budgets.push({
          categoryName: parsedHierarchy.leafName,
          amount,
        });
      }
    }
  }

  return { categories, budgets, accounts: [] };
}

export function buildOrganizzeSyncDraft(payload: OrganizzeImportPayload): OrganizzeSyncDraft {
  const defaultPeriod = payload.defaultPeriod?.trim() || resolveCurrentPeriod();

  let inputCategories = [...(payload.categories ?? [])];
  let inputBudgets = [...(payload.budgets ?? [])];
  let inputAccounts = [...(payload.accounts ?? [])];

  if (payload.csvContent?.trim()) {
    const parsedCsv = parseOrganizzeCsv(payload.csvContent);
    inputCategories = [...inputCategories, ...parsedCsv.categories];
    inputBudgets = [...inputBudgets, ...parsedCsv.budgets];
    inputAccounts = [...inputAccounts, ...parsedCsv.accounts];
  }

  const normalizedAccounts: NormalizedOrganizzeAccount[] = inputAccounts.map((account) => ({
    name: account.name.trim(),
    type: normalizeOrganizzeAccountType(account.type),
    initialBalance: account.balance,
  }));

  const normalizedCategories: NormalizedOrganizzeCategory[] = inputCategories.map((category) => {
    const hierarchy = parseOrganizzeCategoryHierarchy(category.name, category.parentName);
    const type = normalizeOrganizzeCategoryType(category.type);
    const targetWorkspaceType =
      category.targetWorkspaceType ?? resolveSuggestedWorkspaceForCategory(hierarchy.leafName, type);

    return {
      name: hierarchy.leafName,
      parentName: hierarchy.parentName,
      fullName: hierarchy.fullName,
      type,
      icon: category.icon ?? null,
      targetWorkspaceType,
    };
  });

  const normalizedBudgets: NormalizedOrganizzeBudget[] = inputBudgets.map((budget) => {
    const amount = normalizeOrganizzeBudgetAmount(budget.amount);
    const period = budget.period?.trim() || defaultPeriod;
    // Budgets are linked to the family workspace by default for domestic expense caps
    const targetWorkspaceType = budget.targetWorkspaceType ?? "family";

    return {
      categoryName: budget.categoryName.trim(),
      amount,
      period,
      targetWorkspaceType,
    };
  });

  return {
    accounts: normalizedAccounts,
    categories: normalizedCategories,
    budgets: normalizedBudgets,
    defaultPeriod,
  };
}
