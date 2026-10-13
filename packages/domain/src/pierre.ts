import {
  inboxOriginalTextMaximumLength,
  inboxParsedNameMaximumLength,
  normalizeInboxSingleLine,
} from "./inbox";

export const pierreSourceApp = "pierre-finance";
export const pierreSourceAppName = "Pierre Finance";
export const pierreBatchMaximumSize = 50;
export const pierreClientIdPrefix = "pierre_";

export type PierreTransaction = {
  externalId?: string | null;
  date: string;
  amount: number;
  accountId: string;
  accountName?: string | null;
  description: string;
};

export type PierreInboxItem = {
  sourceApp: string;
  sourceAppName: string;
  originalTitle: string;
  originalText: string;
  notificationTimestamp: string;
  timestampFormatVersion: 2;
  parsedName: string;
  parsedAmount: number;
  clientId: string;
};

export function normalizePierreText(value: string) {
  return normalizeInboxSingleLine(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function pierreAmountToCents(amount: number) {
  return Math.round(amount * 100);
}

/**
 * Canonical, deterministic key of an imported bank entry. Callers hash it with SHA-256:
 * Hash = SHA-256(date + amount + accountId + description). When the bank supplies a stable
 * `externalId`, it replaces date/amount/description so that two genuinely distinct purchases
 * that look identical (same day, value and merchant) are never collapsed into one.
 */
export function buildPierreDedupKey(transaction: PierreTransaction) {
  const account = normalizePierreText(transaction.accountId);
  const externalId = transaction.externalId?.trim();
  if (externalId) return ["pierre", "id", account, externalId].join("|");

  return [
    "pierre",
    "v1",
    transaction.date,
    pierreAmountToCents(transaction.amount),
    account,
    normalizePierreText(transaction.description),
  ].join("|");
}

export function toPierreInboxItem(transaction: PierreTransaction, clientId: string): PierreInboxItem {
  const description = normalizeInboxSingleLine(transaction.description);
  const accountLabel = normalizeInboxSingleLine(transaction.accountName?.trim() || transaction.accountId);
  const isExpense = transaction.amount < 0;
  const absoluteAmount = Math.abs(pierreAmountToCents(transaction.amount)) / 100;

  return {
    sourceApp: pierreSourceApp,
    sourceAppName: pierreSourceAppName,
    originalTitle: isExpense ? "Despesa" : "Receita",
    originalText: `${description} — ${accountLabel}`.slice(0, inboxOriginalTextMaximumLength),
    // Bank entries carry only a calendar date; noon in Brazil keeps the day stable across zones.
    notificationTimestamp: `${transaction.date}T12:00:00-03:00`,
    timestampFormatVersion: 2,
    parsedName: description.slice(0, inboxParsedNameMaximumLength),
    parsedAmount: absoluteAmount,
    clientId,
  };
}
