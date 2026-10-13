import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspacesService, type WorkspaceRecord, type WorkspacesRepository } from "./workspaces.service";

function createMockRepository(initialRecords: WorkspaceRecord[] = []): WorkspacesRepository {
  const records = [...initialRecords];
  return {
    async insert(data) {
      const record: WorkspaceRecord = {
        id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: data.userId,
        name: data.name,
        type: data.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      records.push(record);
      return record;
    },
    async listByUser(userId) {
      return records.filter((r) => r.userId === userId);
    },
    async findByIdForUser(id, userId) {
      return records.find((r) => r.id === id && r.userId === userId) ?? null;
    },
    async updateForUser(id, userId, data) {
      const idx = records.findIndex((r) => r.id === id && r.userId === userId);
      if (idx === -1) return null;
      records[idx] = {
        ...records[idx]!,
        ...(data.name ? { name: data.name } : {}),
        ...(data.type ? { type: data.type } : {}),
        updatedAt: new Date(),
      };
      return records[idx]!;
    },
    async deleteForUser(id, userId) {
      const idx = records.findIndex((r) => r.id === id && r.userId === userId);
      if (idx === -1) return null;
      const [removed] = records.splice(idx, 1);
      return removed ?? null;
    },
  };
}

test("provisions the 3 default Triade pillars when a user has no workspaces", async () => {
  const repository = createMockRepository();
  const service = createWorkspacesService(repository);
  const userId = "user-123";

  const list = await service.list(userId);

  assert.equal(list.length, 3);
  assert.equal(list[0]?.name, "Pessoal");
  assert.equal(list[0]?.type, "personal");
  assert.equal(list[1]?.name, "Familiar");
  assert.equal(list[1]?.type, "family");
  assert.equal(list[2]?.name, "Negócio");
  assert.equal(list[2]?.type, "business");
});

test("returns existing workspaces without duplicating default pillars", async () => {
  const existing: WorkspaceRecord = {
    id: "ws-existing",
    userId: "user-456",
    name: "Meu Workspace",
    type: "personal",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repository = createMockRepository([existing]);
  const service = createWorkspacesService(repository);

  const list = await service.list("user-456");

  assert.equal(list.length, 1);
  assert.equal(list[0]?.id, "ws-existing");
  assert.equal(list[0]?.name, "Meu Workspace");
});

test("allows creating, updating and deleting custom workspaces", async () => {
  const repository = createMockRepository();
  const service = createWorkspacesService(repository);
  const userId = "user-789";

  const created = await service.create({ name: "Consultoria PJ", type: "business" }, userId);
  assert.equal(created.name, "Consultoria PJ");
  assert.equal(created.type, "business");

  const updated = await service.update(created.id, userId, { name: "Consultoria & Tech PJ" });
  assert.equal(updated.name, "Consultoria & Tech PJ");

  const deleted = await service.delete(created.id, userId);
  assert.equal(deleted.id, created.id);

  await assert.rejects(
    () => service.getById(created.id, userId),
    (err: Error) => err.message === "Workspace not found",
  );
});
