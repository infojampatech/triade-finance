import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ok } from "@openmonetis/shared/api";
import { CompanionDeviceAuthenticationErrorSchema } from "@openmonetis/validators/device-tokens";
import { PierreImportInputSchema, PierreImportOutputSchema } from "@openmonetis/validators/pierre";
import type { PierreService } from "../services/pierre.service";
import type { ApiVariables } from "../types/context";
import { ErrorResponseSchema as errorSchema, validationHook } from "../utils/openapi";

export function createPierreRoute(service: PierreService) {
  const route = new OpenAPIHono<{ Variables: ApiVariables }>({ defaultHook: validationHook });

  route.openapi(
    createRoute({
      method: "post",
      path: "/transactions",
      tags: ["Pierre Finance"],
      security: [{ deviceBearer: [] }],
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: PierreImportInputSchema } },
        },
      },
      responses: {
        200: {
          description: "Bank entries queued in the inbox for review, idempotently",
          content: {
            "application/json": {
              schema: z.object({ data: PierreImportOutputSchema, error: z.null() }),
            },
          },
        },
        400: {
          description: "Invalid request",
          content: { "application/json": { schema: errorSchema } },
        },
        401: {
          description: "Invalid integration token",
          content: { "application/json": { schema: CompanionDeviceAuthenticationErrorSchema } },
        },
        413: {
          description: "Payload too large",
          content: { "application/json": { schema: errorSchema } },
        },
        429: {
          description: "Too many requests",
          content: { "application/json": { schema: errorSchema } },
        },
      },
    }),
    async (context) =>
      context.json(
        ok(
          await service.importTransactions(context.req.valid("json"), {
            deviceTokenId: context.get("deviceTokenId"),
            userId: context.get("userId"),
          }),
        ),
        200,
      ),
  );

  return route;
}
