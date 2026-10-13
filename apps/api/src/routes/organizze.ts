import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ok } from "@openmonetis/shared/api";
import {
  OrganizzeSyncInputSchema,
  OrganizzeSyncPreviewOutputSchema,
  OrganizzeSyncResultOutputSchema,
} from "@openmonetis/validators/organizze";
import type { OrganizzeService } from "../services/organizze.service";
import type { ApiVariables } from "../types/context";
import { errorResponse as error, validationHook } from "../utils/openapi";

const PreviewSchema = z.object({
  data: OrganizzeSyncPreviewOutputSchema,
  error: z.null(),
});

const ResultSchema = z.object({
  data: OrganizzeSyncResultOutputSchema,
  error: z.null(),
});

export function createOrganizzeRoute(service: OrganizzeService) {
  const route = new OpenAPIHono<{ Variables: ApiVariables }>({ defaultHook: validationHook });

  route.openapi(
    createRoute({
      method: "post",
      path: "/preview",
      tags: ["Organizze"],
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: OrganizzeSyncInputSchema } },
        },
      },
      responses: {
        200: {
          description: "Prévia de sincronização do plano de contas, categorias e orçamentos Organizze",
          content: { "application/json": { schema: PreviewSchema } },
        },
        400: error("Invalid request"),
        401: error("Authentication required"),
      },
    }),
    async (c) => c.json(ok(await service.preview(c.get("userId"), c.req.valid("json"))), 200),
  );

  route.openapi(
    createRoute({
      method: "post",
      path: "/sync",
      tags: ["Organizze"],
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: OrganizzeSyncInputSchema } },
        },
      },
      responses: {
        200: {
          description: "Resultado da sincronização e importação do Organizze",
          content: { "application/json": { schema: ResultSchema } },
        },
        400: error("Invalid request"),
        401: error("Authentication required"),
      },
    }),
    async (c) => c.json(ok(await service.sync(c.get("userId"), c.req.valid("json"))), 200),
  );

  return route;
}
