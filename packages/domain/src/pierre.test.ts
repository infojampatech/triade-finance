import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPierreDedupKey,
  type PierreTransaction,
  pierreAmountToCents,
  toPierreInboxItem,
} from "./pierre";

const base: PierreTransaction = {
  date: "2026-10-10",
  amount: -42.9,
  accountId: "ACC-1",
  accountName: "Conta PJ",
  description: "Padaria  Pão Quente",
};

test("dedup key ignores case, accents and spacing in the description and account", () => {
  const variant = { ...base, accountId: "acc-1", description: " padaria pao   quente " };
  assert.equal(buildPierreDedupKey(base), buildPierreDedupKey(variant));
});

test("dedup key separates different dates, amounts and signs", () => {
  const key = buildPierreDedupKey(base);
  assert.notEqual(key, buildPierreDedupKey({ ...base, date: "2026-10-11" }));
  assert.notEqual(key, buildPierreDedupKey({ ...base, amount: -43 }));
  assert.notEqual(key, buildPierreDedupKey({ ...base, amount: 42.9 }));
});

test("an external id keeps identical-looking purchases distinct", () => {
  const first = buildPierreDedupKey({ ...base, externalId: "tx-1" });
  const second = buildPierreDedupKey({ ...base, externalId: "tx-2" });
  assert.notEqual(first, second);
  assert.equal(first, buildPierreDedupKey({ ...base, externalId: "tx-1", amount: -1 }));
});

test("amounts are converted to cents without floating-point drift", () => {
  assert.equal(pierreAmountToCents(-0.1 - 0.2), -30);
  assert.equal(pierreAmountToCents(1234.56), 123456);
});

test("negative entries become expenses and positive entries become income", () => {
  const expense = toPierreInboxItem(base, "pierre_x");
  assert.equal(expense.originalTitle, "Despesa");
  assert.equal(expense.parsedAmount, 42.9);
  assert.equal(expense.parsedName, "Padaria Pão Quente");
  assert.equal(expense.originalText, "Padaria Pão Quente — Conta PJ");
  assert.equal(expense.notificationTimestamp, "2026-10-10T12:00:00-03:00");

  const income = toPierreInboxItem({ ...base, amount: 100 }, "pierre_y");
  assert.equal(income.originalTitle, "Receita");
  assert.equal(income.clientId, "pierre_y");
});

test("the account id replaces a missing account name", () => {
  const item = toPierreInboxItem({ ...base, accountName: null }, "pierre_z");
  assert.equal(item.originalText, "Padaria Pão Quente — ACC-1");
});
