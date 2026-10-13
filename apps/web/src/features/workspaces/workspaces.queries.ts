import { queryOptions } from "@tanstack/react-query";
import { getWorkspace, getWorkspaces } from "./workspaces.api";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  detail: (id: string) => ["workspaces", id] as const,
};

export const workspacesQueryOptions = () =>
  queryOptions({
    queryKey: workspaceKeys.all,
    queryFn: getWorkspaces,
    staleTime: 1000 * 60 * 5,
  });

export const workspaceQueryOptions = (id: string) =>
  queryOptions({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => getWorkspace(id),
  });
