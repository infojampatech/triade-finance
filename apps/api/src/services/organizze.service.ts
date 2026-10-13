import type { AccountType } from "@openmonetis/domain/accounts";
import type { CategoryType } from "@openmonetis/domain/categories";
import { buildOrganizzeSyncDraft } from "@openmonetis/domain/organizze";
import type { WorkspaceType } from "@openmonetis/domain/workspaces";
import type {
  OrganizzeSyncInput,
  OrganizzeSyncPreviewOutput,
  OrganizzeSyncResultOutput,
} from "@openmonetis/validators/organizze";

export type WorkspaceRecord = {
  id: string;
  name: string;
  type: WorkspaceType;
};

export type AccountRecord = {
  id: string;
  name: string;
  type: AccountType;
};

export type CategoryRecord = {
  id: string;
  name: string;
  type: CategoryType;
  workspaceId: string | null;
};

export type BudgetRecord = {
  id: string;
  categoryId: string;
  amount: string;
  period: string;
  workspaceId: string | null;
};

export type OrganizzeRepository = {
  findWorkspacesByUser(userId: string): Promise<WorkspaceRecord[]>;
  findAccountsByUser(userId: string): Promise<AccountRecord[]>;
  createAccounts(
    data: Array<{
      userId: string;
      name: string;
      type: AccountType;
      workspaceId?: string | null;
    }>,
  ): Promise<AccountRecord[]>;
  findCategoriesByUser(userId: string): Promise<CategoryRecord[]>;
  createCategories(
    data: Array<{
      userId: string;
      name: string;
      type: CategoryType;
      icon: string | null;
      workspaceId: string | null;
      isSystem: boolean;
    }>,
  ): Promise<CategoryRecord[]>;
  findBudgetsByUserAndPeriod(userId: string, period: string): Promise<BudgetRecord[]>;
  upsertBudget(data: {
    userId: string;
    categoryId: string;
    period: string;
    amount: string;
    workspaceId: string | null;
  }): Promise<{ id: string } | null>;
};

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function createOrganizzeService(repository: OrganizzeRepository) {
  return {
    async preview(
      _userId: string,
      input: OrganizzeSyncInput,
    ): Promise<OrganizzeSyncPreviewOutput> {
      const draft = buildOrganizzeSyncDraft(input);

      return {
        totalAccounts: draft.accounts.length,
        totalCategories: draft.categories.length,
        totalBudgets: draft.budgets.length,
        defaultPeriod: draft.defaultPeriod,
        accounts: draft.accounts.map((a) => ({
          name: a.name,
          type: a.type,
        })),
        categories: draft.categories.map((c) => ({
          name: c.name,
          parentName: c.parentName,
          fullName: c.fullName,
          type: c.type,
          targetWorkspaceType: c.targetWorkspaceType,
        })),
        budgets: draft.budgets.map((b) => ({
          categoryName: b.categoryName,
          amount: b.amount,
          period: b.period,
          targetWorkspaceType: b.targetWorkspaceType,
        })),
      };
    },

    async sync(
      userId: string,
      input: OrganizzeSyncInput,
    ): Promise<OrganizzeSyncResultOutput> {
      const draft = buildOrganizzeSyncDraft(input);

      // 1. Resolve workspaces by type
      const userWorkspaces = await repository.findWorkspacesByUser(userId);
      const workspaceByType = new Map<WorkspaceType, string>();
      for (const ws of userWorkspaces) {
        workspaceByType.set(ws.type, ws.id);
      }

      // 2. Synchronize Accounts
      const existingAccounts = await repository.findAccountsByUser(userId);
      const existingAccountNames = new Set(existingAccounts.map((a) => normalizeName(a.name)));

      const accountsToCreate = draft.accounts.filter(
        (a) => !existingAccountNames.has(normalizeName(a.name)),
      );

      let accountsCreated = 0;
      if (accountsToCreate.length > 0) {
        const created = await repository.createAccounts(
          accountsToCreate.map((a) => ({
            userId,
            name: a.name,
            type: a.type,
            workspaceId: workspaceByType.get("personal") ?? null,
          })),
        );
        accountsCreated = created.length;
      }
      const accountsExisting = draft.accounts.length - accountsCreated;

      // 3. Synchronize Categories
      const existingCategories = await repository.findCategoriesByUser(userId);
      const existingCategoryMap = new Map<string, CategoryRecord>();
      for (const cat of existingCategories) {
        existingCategoryMap.set(`${normalizeName(cat.name)}:${cat.type}`, cat);
      }

      const categoriesToCreate: Array<{
        userId: string;
        name: string;
        type: CategoryType;
        icon: string | null;
        workspaceId: string | null;
        isSystem: boolean;
      }> = [];

      // Avoid duplicates within the draft itself
      const seenInBatch = new Set<string>();

      for (const cat of draft.categories) {
        const key = `${normalizeName(cat.name)}:${cat.type}`;
        if (!existingCategoryMap.has(key) && !seenInBatch.has(key)) {
          seenInBatch.add(key);
          const targetWorkspaceId = workspaceByType.get(cat.targetWorkspaceType) ?? null;
          categoriesToCreate.push({
            userId,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            workspaceId: targetWorkspaceId,
            isSystem: false,
          });
        }
      }

      let categoriesCreated = 0;
      if (categoriesToCreate.length > 0) {
        const created = await repository.createCategories(categoriesToCreate);
        categoriesCreated = created.length;
        for (const cat of created) {
          existingCategoryMap.set(`${normalizeName(cat.name)}:${cat.type}`, cat);
        }
      }
      const categoriesExisting = draft.categories.length - categoriesCreated;

      // 4. Synchronize Budgets
      // Find existing budgets for the default period or all affected periods
      const periods = new Set(draft.budgets.map((b) => b.period));
      const existingBudgetsByKey = new Set<string>();

      for (const p of periods) {
        const pBudgets = await repository.findBudgetsByUserAndPeriod(userId, p);
        for (const b of pBudgets) {
          existingBudgetsByKey.add(`${b.categoryId}:${b.period}`);
        }
      }

      let budgetsCreated = 0;
      let budgetsUpdated = 0;

      for (const b of draft.budgets) {
        // Match with category (only expense categories can have budgets)
        const matchedCategory = existingCategoryMap.get(`${normalizeName(b.categoryName)}:expense`);
        if (!matchedCategory) {
          continue;
        }

        const targetWorkspaceId =
          workspaceByType.get(b.targetWorkspaceType) ?? workspaceByType.get("family") ?? null;

        const isExisting = existingBudgetsByKey.has(`${matchedCategory.id}:${b.period}`);

        await repository.upsertBudget({
          userId,
          categoryId: matchedCategory.id,
          period: b.period,
          amount: b.amount.toFixed(2),
          workspaceId: targetWorkspaceId,
        });

        if (isExisting) {
          budgetsUpdated++;
        } else {
          budgetsCreated++;
          existingBudgetsByKey.add(`${matchedCategory.id}:${b.period}`);
        }
      }

      return {
        accountsCreated,
        accountsExisting,
        categoriesCreated,
        categoriesExisting,
        budgetsCreated,
        budgetsUpdated,
        defaultPeriod: draft.defaultPeriod,
      };
    },
  };
}

export type OrganizzeService = ReturnType<typeof createOrganizzeService>;
