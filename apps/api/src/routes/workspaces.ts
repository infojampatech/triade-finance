import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ok } from "@openmonetis/shared/api";
import {
  CreateWorkspaceInputSchema,
  UpdateWorkspaceInputSchema,
  WorkspaceOutputSchema,
  WorkspaceParamsSchema,
} from "@openmonetis/validators/workspaces";
import type { WorkspacesService } from "../services/workspaces.service";
import type { ApiVariables } from "../types/context";
import { errorResponse as error, validationHook } from "../utils/openapi";

const OneSchema = z.object({ data: WorkspaceOutputSchema, error: z.null() });
const ManySchema = z.object({ data: z.array(WorkspaceOutputSchema), error: z.null() });
const DeletedSchema = z.object({ data: z.object({ id: z.uuid() }), error: z.null() });

export function createWorkspacesRoute(service: WorkspacesService) {
  const route = new OpenAPIHono<{ Variables: ApiVariables }>({ defaultHook: validationHook });

  route.openapi(
    createRoute({
      method: "post",
      path: "/",
      tags: ["Workspaces"],
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: CreateWorkspaceInputSchema } },
        },
      },
      responses: {
        201: {
          description: "Workspace criado",
          content: { "application/json": { schema: OneSchema } },
        },
        400: error("Invalid request"),
        401: error("Authentication required"),
      },
    }),
    async (c) => c.json(ok(await service.create(c.req.valid("json"), c.get("userId"))), 201),
  );

  route.openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["Workspaces"],
      responses: {
        200: {
          description: "Lista de workspaces do usuário",
          content: { "application/json": { schema: ManySchema } },
        },
        401: error("Authentication required"),
      },
    }),
    async (c) => c.json(ok(await service.list(c.get("userId"))), 200),
  );

  route.openapi(
    createRoute({
      method: "get",
      path: "/{id}",
      tags: ["Workspaces"],
      request: {
        params: WorkspaceParamsSchema,
      },
      responses: {
        200: {
          description: "Detalhes do workspace",
          content: { "application/json": { schema: OneSchema } },
        },
        401: error("Authentication required"),
        404: error("Workspace not found"),
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      return c.json(ok(await service.getById(id, c.get("userId"))), 200);
    },
  );

  route.openapi(
    createRoute({
      method: "patch",
      path: "/{id}",
      tags: ["Workspaces"],
      request: {
        params: WorkspaceParamsSchema,
        body: {
          required: true,
          content: { "application/json": { schema: UpdateWorkspaceInputSchema } },
        },
      },
      responses: {
        200: {
          description: "Workspace atualizado",
          content: { "application/json": { schema: OneSchema } },
        },
        400: error("Invalid request"),
        401: error("Authentication required"),
        404: error("Workspace not found"),
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      return c.json(ok(await service.update(id, c.get("userId"), c.req.valid("json"))), 200);
    },
  );

  route.openapi(
    createRoute({
      method: "delete",
      path: "/{id}",
      tags: ["Workspaces"],
      request: {
        params: WorkspaceParamsSchema,
      },
      responses: {
        200: {
          description: "Workspace excluído",
          content: { "application/json": { schema: DeletedSchema } },
        },
        401: error("Authentication required"),
        404: error("Workspace not found"),
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      return c.json(ok(await service.delete(id, c.get("userId"))), 200);
    },
  );

  return route;
}
