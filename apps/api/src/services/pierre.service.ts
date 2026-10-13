import { createHash } from "node:crypto";
import {
  buildPierreDedupKey,
  pierreClientIdPrefix,
  toPierreInboxItem,
} from "@openmonetis/domain/pierre";
import type { PierreImportInput, PierreImportOutput } from "@openmonetis/validators/pierre";
import { ApiError } from "../utils/errors";
import type { InboxService } from "./inbox.service";

type PierreImportContext = {
  deviceTokenId: string;
  userId: string;
};

export function createPierreService(inbox: Pick<InboxService, "ingest">) {
  return {
    async importTransactions(
      input: PierreImportInput,
      context: PierreImportContext,
    ): Promise<PierreImportOutput> {
      const results: PierreImportOutput["results"] = [];

      for (const [index, transaction] of input.transactions.entries()) {
        const digest = createHash("sha256")
          .update(buildPierreDedupKey(transaction), "utf8")
          .digest("hex");

        try {
          const accepted = await inbox.ingest(
            toPierreInboxItem(transaction, `${pierreClientIdPrefix}${digest}`),
            context,
          );
          results.push({
            index,
            status: accepted.duplicate ? "duplicate" : "imported",
            inboxItemId: accepted.id,
            error: null,
          });
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
          results.push({ index, status: "failed", inboxItemId: null, error: error.code });
        }
      }

      const count = (status: PierreImportOutput["results"][number]["status"]) =>
        results.filter((result) => result.status === status).length;

      return {
        total: results.length,
        imported: count("imported"),
        duplicates: count("duplicate"),
        failed: count("failed"),
        results,
      };
    },
  };
}

export type PierreService = ReturnType<typeof createPierreService>;
