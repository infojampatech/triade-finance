import { db, workspaces } from "@openmonetis/db";
import { and, asc, eq } from "drizzle-orm";
import type { WorkspacesRepository } from "../services/workspaces.service";

export const workspacesRepository: WorkspacesRepository = {
  async insert(data) {
    const [record] = await db.insert(workspaces).values(data).returning();
    return record;
  },

  async listByUser(userId) {
    return db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, userId))
      .orderBy(asc(workspaces.createdAt));
  },

  async findByIdForUser(id, userId) {
    const [record] = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
      .limit(1);
    return record ?? null;
  },

  async updateForUser(id, userId, data) {
    const [record] = await db
      .update(workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
      .returning();
    return record ?? null;
  },

  async deleteForUser(id, userId) {
    const [record] = await db
      .delete(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
      .returning();
    return record ?? null;
  },
};
