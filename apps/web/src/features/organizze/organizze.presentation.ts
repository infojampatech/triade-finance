import type { WorkspaceType } from "@openmonetis/domain/workspaces";
import type { OrganizzeSyncResultOutput } from "@openmonetis/validators/organizze";

export function formatWorkspaceTarget(type: WorkspaceType): string {
  switch (type) {
    case "family":
      return "Familiar (Despesas da Casa)";
    case "business":
      return "Negócio (PJ / Comercial)";
    case "personal":
      return "Pessoal (Individual)";
  }
}

export function formatWorkspaceBadge(type: WorkspaceType): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  switch (type) {
    case "family":
      return { label: "Familiar", variant: "default" };
    case "business":
      return { label: "Negócio", variant: "secondary" };
    case "personal":
      return { label: "Pessoal", variant: "outline" };
  }
}

export function describeSyncSuccessMessage(result: OrganizzeSyncResultOutput): string {
  const parts: string[] = [];
  if (result.accountsCreated > 0) {
    parts.push(`${result.accountsCreated} conta(s) criada(s)`);
  }
  if (result.categoriesCreated > 0) {
    parts.push(`${result.categoriesCreated} categoria(s) criada(s)`);
  }
  if (result.budgetsCreated > 0 || result.budgetsUpdated > 0) {
    const totalBudgets = result.budgetsCreated + result.budgetsUpdated;
    parts.push(`${totalBudgets} teto(s) de orçamento sincronizado(s) no Workspace Familiar`);
  }
  return parts.length > 0 ? parts.join(", ") : "Sincronização concluída com sucesso!";
}
