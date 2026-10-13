import { z } from "@hono/zod-openapi";
import { workspaceTypes } from "@openmonetis/domain/workspaces";

export { type WorkspaceType, workspaceTypes } from "@openmonetis/domain/workspaces";

export const CreateWorkspaceInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: z.enum(workspaceTypes),
  })
  .openapi("CreateWorkspaceInput");

export const UpdateWorkspaceInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    type: z.enum(workspaceTypes).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, "Provide at least one field to update")
  .openapi("UpdateWorkspaceInput");

export const WorkspaceParamsSchema = z
  .object({ id: z.uuid().openapi({ param: { name: "id", in: "path" } }) })
  .openapi("WorkspaceParams");

export const WorkspaceOutputSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    type: z.enum(workspaceTypes),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("WorkspaceOutput");

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceInputSchema>;
export type WorkspaceOutput = z.infer<typeof WorkspaceOutputSchema>;
