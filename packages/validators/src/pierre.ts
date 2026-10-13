import { z } from "@hono/zod-openapi";
import { inboxParsedNameMaximumLength } from "@openmonetis/domain/inbox";
import { pierreBatchMaximumSize } from "@openmonetis/domain/pierre";

export const PierreTransactionInputSchema = z
  .object({
    externalId: z.string().trim().min(1).max(120).nullish().openapi({ example: "tx_9f2c" }),
    date: z.iso.date().openapi({ example: "2026-10-10" }),
    amount: z
      .number()
      .finite()
      .refine((value) => value !== 0 && Math.abs(value) <= 999_999_999.99, {
        message: "Amount must be non-zero and within range",
      })
      .openapi({ example: -42.9, description: "Negative values are expenses" }),
    accountId: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .openapi({ example: "acc_pj_01" }),
    accountName: z.string().trim().min(1).max(120).nullish().openapi({ example: "Conta PJ" }),
    description: z
      .string()
      .trim()
      .min(1)
      .max(inboxParsedNameMaximumLength)
      .openapi({ example: "Padaria Pão Quente" }),
  })
  .strict()
  .openapi("PierreTransactionInput");

export const PierreImportInputSchema = z
  .object({
    transactions: z.array(PierreTransactionInputSchema).min(1).max(pierreBatchMaximumSize),
  })
  .strict()
  .openapi("PierreImportInput");

export const PierreImportResultOutputSchema = z
  .object({
    index: z.number().int().nonnegative(),
    status: z.enum(["imported", "duplicate", "failed"]),
    inboxItemId: z.uuid().nullable(),
    error: z.string().nullable(),
  })
  .openapi("PierreImportResult");

export const PierreImportOutputSchema = z
  .object({
    total: z.number().int().nonnegative(),
    imported: z.number().int().nonnegative(),
    duplicates: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    results: z.array(PierreImportResultOutputSchema),
  })
  .openapi("PierreImportOutput");

export type PierreImportInput = z.infer<typeof PierreImportInputSchema>;
export type PierreImportOutput = z.infer<typeof PierreImportOutputSchema>;
