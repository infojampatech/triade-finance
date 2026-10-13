import {
  budgets,
  categories,
  db,
  financialAccounts,
  workspaces,
} from "@openmonetis/db";
import { and, eq } from "drizzle-orm";
import type { OrganizzeRepository } from "../services/organizze.service";

export const organizzeRepository: OrganizzeRepository = {
  async findWorkspacesByUser(userId: string) {
    return db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        type: workspaces.type,
      })
      .from(workspaces)
      .where(eq(workspaces.userId, userId));
  },

  async findAccountsByUser(userId: string) {
    return db
      .select({
        id: financialAccounts.id,
        name: financialAccounts.name,
        type: financialAccounts.type,
      })
      .from(financialAccounts)
      .where(eq(financialAccounts.userId, userId));
  },

  async createAccounts(data) {
    if (data.length === 0) return [];
    return db.insert(financialAccounts).values(data).returning({
      id: financialAccounts.id,
      name: financialAccounts.name,
      type: financialAccounts.type,
    });
  },

  async findCategoriesByUser(userId: string) {
    return db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
        workspaceId: categories.workspaceId,
      })
      .from(categories)
      .where(eq(categories.userId, userId));
  },

  async createCategories(data) {
    if (data.length === 0) return [];
    return db.insert(categories).values(data).returning({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      workspaceId: categories.workspaceId,
    });
  },

  async findBudgetsByUserAndPeriod(userId: string, period: string) {
    return db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        amount: budgets.amount,
        period: budgets.period,
        workspaceId: budgets.workspaceId,
      })
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.period, period)));
  },

  async upsertBudget(data) {
    const [result] = await db
      .insert(budgets)
      .values({
        userId: data.userId,
        categoryId: data.categoryId,
        period: data.period,
        amount: data.amount,
        workspaceId: data.workspaceId,
      })
      .onConflictDoUpdate({
        target: [budgets.userId, budgets.categoryId, budgets.period],
        set: {
          amount: data.amount,
          workspaceId: data.workspaceId,
          updatedAt: new Date(),
        },
      })
      .returning({ id: budgets.id });
    return result ?? null;
  },
};
