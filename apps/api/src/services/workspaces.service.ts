import type { WorkspaceType } from "@openmonetis/domain/workspaces";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceOutput,
} from "@openmonetis/validators/workspaces";
import { notFound } from "../utils/errors";

export type WorkspaceRecord = {
  id: string;
  userId: string;
  name: string;
  type: WorkspaceType;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkspaceCreateRecord = Omit<WorkspaceRecord, "id" | "createdAt" | "updatedAt">;
export type WorkspaceUpdateRecord = Partial<Pick<WorkspaceRecord, "name" | "type">>;

export type WorkspacesRepository = {
  insert(data: WorkspaceCreateRecord): Promise<WorkspaceRecord>;
  listByUser(userId: string): Promise<WorkspaceRecord[]>;
  findByIdForUser(id: string, userId: string): Promise<WorkspaceRecord | null>;
  updateForUser(
    id: string,
    userId: string,
    data: WorkspaceUpdateRecord,
  ): Promise<WorkspaceRecord | null>;
  deleteForUser(id: string, userId: string): Promise<WorkspaceRecord | null>;
};

export type WorkspacesService = ReturnType<typeof createWorkspacesService>;

function toOutput(record: WorkspaceRecord): WorkspaceOutput {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function createWorkspacesService(repository: WorkspacesRepository) {
  return {
    async create(input: CreateWorkspaceInput, userId: string): Promise<WorkspaceOutput> {
      const created = await repository.insert({
        userId,
        name: input.name,
        type: input.type,
      });
      return toOutput(created);
    },

    async list(userId: string): Promise<WorkspaceOutput[]> {
      const records = await repository.listByUser(userId);
      // Se o usuário não tiver nenhum workspace, cria automaticamente os três pilares padrão
      if (records.length === 0) {
        const defaults: Array<{ name: string; type: WorkspaceType }> = [
          { name: "Pessoal", type: "personal" },
          { name: "Familiar", type: "family" },
          { name: "Negócio", type: "business" },
        ];
        const createdDefaults: WorkspaceRecord[] = [];
        for (const item of defaults) {
          const rec = await repository.insert({ userId, name: item.name, type: item.type });
          createdDefaults.push(rec);
        }
        return createdDefaults.map(toOutput);
      }
      return records.map(toOutput);
    },

    async getById(id: string, userId: string): Promise<WorkspaceOutput> {
      const record = await repository.findByIdForUser(id, userId);
      if (!record) throw notFound("Workspace not found", "workspace_not_found");
      return toOutput(record);
    },

    async update(id: string, userId: string, input: UpdateWorkspaceInput): Promise<WorkspaceOutput> {
      const updated = await repository.updateForUser(id, userId, {
        ...(input.name ? { name: input.name } : {}),
        ...(input.type ? { type: input.type } : {}),
      });
      if (!updated) throw notFound("Workspace not found", "workspace_not_found");
      return toOutput(updated);
    },

    async delete(id: string, userId: string): Promise<{ id: string }> {
      const deleted = await repository.deleteForUser(id, userId);
      if (!deleted) throw notFound("Workspace not found", "workspace_not_found");
      return { id: deleted.id };
    },
  };
}
