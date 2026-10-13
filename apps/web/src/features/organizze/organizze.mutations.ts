import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshFinancialQueries } from "@/lib/financial-query-invalidation";
import { previewOrganizzeSync, syncOrganizze } from "./organizze.api";

export function useOrganizzePreviewMutation() {
  return useMutation({
    mutationFn: previewOrganizzeSync,
  });
}

export function useOrganizzeSyncMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: syncOrganizze,
    onSuccess: () => {
      refreshFinancialQueries(client);
      client.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
