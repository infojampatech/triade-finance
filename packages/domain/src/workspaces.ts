export const workspaceTypes = ["personal", "family", "business"] as const;
export type WorkspaceType = (typeof workspaceTypes)[number];

export type Workspace = {
  id: string;
  userId: string;
  name: string;
  type: WorkspaceType;
  createdAt: Date;
  updatedAt: Date;
};
