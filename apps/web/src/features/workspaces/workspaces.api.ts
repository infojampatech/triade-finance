import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceOutput,
} from "@openmonetis/validators/workspaces";
import { requestApi as request } from "@/lib/api-client";

export const getWorkspaces = () => request<WorkspaceOutput[]>("/workspaces");
export const getWorkspace = (id: string) => request<WorkspaceOutput>(`/workspaces/${id}`);
export const createWorkspace = (input: CreateWorkspaceInput) =>
  request<WorkspaceOutput>("/workspaces", { method: "POST", body: JSON.stringify(input) });
export const updateWorkspace = (id: string, input: UpdateWorkspaceInput) =>
  request<WorkspaceOutput>(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteWorkspace = (id: string) =>
  request<{ id: string }>(`/workspaces/${id}`, { method: "DELETE" });
