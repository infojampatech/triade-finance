import { z } from "@hono/zod-openapi";
import { workspaceTypes } from "@openmonetis/domain/workspaces";

export const OrganizzeAccountInputSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    name: z.string().trim().min(1).max(120).openapi({ example: "Nubank Conta" }),
    type: z.string().trim().max(50).optional().openapi({ example: "checking" }),
    balance: z.number().finite().optional().openapi({ example: 1500 }),
  })
  .openapi("OrganizzeAccountInput");

export const OrganizzeCategoryInputSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    name: z.string().trim().min(1).max(120).openapi({ example: "Supermercado" }),
    parentName: z.string().trim().max(120).nullish().openapi({ example: "Alimentação" }),
    type: z.string().trim().max(50).optional().openapi({ example: "expense" }),
    icon: z.string().trim().max(100).nullish().openapi({ example: "shopping-basket" }),
    color: z.string().trim().max(50).nullish(),
    targetWorkspaceType: z.enum(workspaceTypes).nullish().openapi({ example: "family" }),
  })
  .openapi("OrganizzeCategoryInput");

export const OrganizzeBudgetInputSchema = z
  .object({
    categoryName: z.string().trim().min(1).max(120).openapi({ example: "Supermercado" }),
    amount: z.union([z.number().finite().positive(), z.string().trim().min(1)]).openapi({ example: 1800 }),
    period: z
      .string()
      .regex(/^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/)
      .optional()
      .openapi({ example: "2026-10" }),
    targetWorkspaceType: z.enum(workspaceTypes).nullish().openapi({ example: "family" }),
  })
  .openapi("OrganizzeBudgetInput");

export const OrganizzeSyncInputSchema = z
  .object({
    accounts: z.array(OrganizzeAccountInputSchema).optional(),
    categories: z.array(OrganizzeCategoryInputSchema).optional(),
    budgets: z.array(OrganizzeBudgetInputSchema).optional(),
    defaultPeriod: z
      .string()
      .regex(/^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/)
      .optional()
      .openapi({ example: "2026-10" }),
    csvContent: z.string().max(500_000).optional(),
  })
  .openapi("OrganizzeSyncInput");

export const OrganizzeSyncPreviewOutputSchema = z
  .object({
    totalAccounts: z.number().int().nonnegative(),
    totalCategories: z.number().int().nonnegative(),
    totalBudgets: z.number().int().nonnegative(),
    defaultPeriod: z.string(),
    accounts: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
      }),
    ),
    categories: z.array(
      z.object({
        name: z.string(),
        parentName: z.string().nullable(),
        fullName: z.string(),
        type: z.enum(["income", "expense"]),
        targetWorkspaceType: z.enum(workspaceTypes),
      }),
    ),
    budgets: z.array(
      z.object({
        categoryName: z.string(),
        amount: z.number(),
        period: z.string(),
        targetWorkspaceType: z.enum(workspaceTypes),
      }),
    ),
  })
  .openapi("OrganizzeSyncPreviewOutput");

export const OrganizzeSyncResultOutputSchema = z
  .object({
    accountsCreated: z.number().int().nonnegative(),
    accountsExisting: z.number().int().nonnegative(),
    categoriesCreated: z.number().int().nonnegative(),
    categoriesExisting: z.number().int().nonnegative(),
    budgetsCreated: z.number().int().nonnegative(),
    budgetsUpdated: z.number().int().nonnegative(),
    defaultPeriod: z.string(),
  })
  .openapi("OrganizzeSyncResultOutput");

export type OrganizzeAccountInput = z.infer<typeof OrganizzeAccountInputSchema>;
export type OrganizzeCategoryInput = z.infer<typeof OrganizzeCategoryInputSchema>;
export type OrganizzeBudgetInput = z.infer<typeof OrganizzeBudgetInputSchema>;
export type OrganizzeSyncInput = z.infer<typeof OrganizzeSyncInputSchema>;
export type OrganizzeSyncPreviewOutput = z.infer<typeof OrganizzeSyncPreviewOutputSchema>;
export type OrganizzeSyncResultOutput = z.infer<typeof OrganizzeSyncResultOutputSchema>;
