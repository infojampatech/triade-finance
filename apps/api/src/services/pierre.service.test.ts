import assert from "node:assert/strict";
import test from "node:test";
import { createPierreService } from "./pierre.service";
import { badRequest } from "../utils/errors";

const context = {
  deviceTokenId: "00000000-0000-4000-8000-000000000002",
  userId: "00000000-0000-4000-8000-000000000001",
};

const transaction = {
  date: "2026-10-10",
  amount: -42.9,
  accountId: "acc-1",
  accountName: "Conta PJ",
  description: "Padaria",
};

function createFakeInbox() {
  const seen = new Map<string, string>();
  const calls: Array<{ clientId?: string | null; sourceApp: string; parsedAmount?: number | null }> =
    [];
  return {
    calls,
    ingest: async (input: { clientId?: string | null; sourceApp: string; parsedAmount?: number | null }) => {
      calls.push(input);
      const clientId = input.clientId ?? "";
      const existing = seen.get(clientId);
      const id = existing ?? `00000000-0000-4000-8000-${String(seen.size + 1).padStart(12, "0")}`;
      seen.set(clientId, id);
      return { clientId, id, duplicate: existing !== undefined };
    },
  };
}

test("importing the same bank entry twice is idempotent", async () => {
  const inbox = createFakeInbox();
  const service = createPierreService(inbox);

  const first = await service.importTransactions({ transactions: [transaction] }, context);
  const second = await service.importTransactions({ transactions: [transaction] }, context);

  assert.deepEqual([first.imported, first.duplicates], [1, 0]);
  assert.deepEqual([second.imported, second.duplicates], [0, 1]);
  assert.equal(first.results[0]?.inboxItemId, second.results[0]?.inboxItemId);
  assert.match(inbox.calls[0]?.clientId ?? "", /^pierre_[0-9a-f]{64}$/);
});

test("entries are sent to the inbox as pending Pierre items with absolute amounts", async () => {
  const inbox = createFakeInbox();
  const service = createPierreService(inbox);

  await service.importTransactions({ transactions: [transaction] }, context);

  assert.equal(inbox.calls[0]?.sourceApp, "pierre-finance");
  assert.equal(inbox.calls[0]?.parsedAmount, 42.9);
});

test("one rejected entry does not stop the rest of the batch", async () => {
  const inbox = createFakeInbox();
  const service = createPierreService({
    ingest: async (input) => {
      if (input.parsedAmount === 1) {
        throw badRequest("Notification timestamp is outside the accepted range", "inbox_notification_timestamp_invalid");
      }
      return inbox.ingest(input);
    },
  });

  const result = await service.importTransactions(
    { transactions: [{ ...transaction, amount: 1 }, transaction] },
    context,
  );

  assert.equal(result.total, 2);
  assert.equal(result.failed, 1);
  assert.equal(result.imported, 1);
  assert.equal(result.results[0]?.error, "inbox_notification_timestamp_invalid");
});

test("unexpected errors are not swallowed", async () => {
  const service = createPierreService({
    ingest: async () => {
      throw new Error("database down");
    },
  });
  await assert.rejects(service.importTransactions({ transactions: [transaction] }, context), /database down/);
});
