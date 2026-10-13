import type { WorkspaceOutput, WorkspaceType } from "@openmonetis/validators/workspaces";

export const workspaceTypeLabels: Record<WorkspaceType, string> = {
  personal: "Pessoal",
  family: "Familiar",
  business: "Negócio (PJ)",
};

export const workspaceTypeIcons: Record<WorkspaceType, string> = {
  personal: "👤",
  family: "🏠",
  business: "💼",
};

export function getWorkspaceLabel(workspace: WorkspaceOutput): string {
  return workspace.name || workspaceTypeLabels[workspace.type];
}
