import type { FastifyInstance } from "fastify";
import type { ApiConfig } from "../config.js";
import {
  AccessBrokerError,
  checkAccessBrokerHealth,
  invokeAccessBroker,
  type AccessBrokerUploadInput,
  type VaultPrefix,
} from "../lib/access-broker.js";
import {
  ContentProcessorError,
  invokeContentProcessorReanalysis,
} from "../lib/content-processor.js";
import { requireRole } from "../lib/auth.js";
import {
  assertStaffCanAccessClient,
  StaffClientAccessError,
} from "../lib/staff-client-access.js";

type PresignUploadBody = AccessBrokerUploadInput & {
  client_id: string;
  reason?: string;
};

type PresignDownloadBody = {
  client_id: string;
  s3_key: string;
  reason?: string;
};

type ReprocessBody = {
  client_id: string;
  vault_object_id: string;
};

function vaultError(
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  error: unknown,
) {
  if (error instanceof StaffClientAccessError) {
    return reply.code(error.statusCode).send({ error: error.message });
  }

  if (error instanceof AccessBrokerError) {
    return reply.code(error.statusCode).send({ error: error.message });
  }
  if (error instanceof ContentProcessorError) {
    return reply.code(error.statusCode).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "Vault request failed";
  return reply.code(500).send({ error: message });
}

export async function registerStaffVaultRoutes(
  app: FastifyInstance,
  config: ApiConfig,
) {
  await app.register(
    async (staff) => {
      staff.addHook("onRequest", requireRole("staff"));

      staff.get("/vault/access-broker-status", async () => {
        return checkAccessBrokerHealth();
      });

      staff.post<{ Body: PresignUploadBody }>(
        "/vault/presign-upload",
        async (request, reply) => {
          const user = request.authUser!;
          const body = request.body ?? ({} as PresignUploadBody);

          if (!body.client_id?.trim()) {
            return reply.code(400).send({ error: "client_id is required" });
          }

          try {
            await assertStaffCanAccessClient(config, request, body.client_id);

            return await invokeAccessBroker({
              operation: "presign_put",
              client_id: body.client_id.trim(),
              actor_user_id: user.id,
              reason: body.reason,
              upload: {
                filename: body.filename,
                content_type: body.content_type,
                source: body.source,
                prefix: (body.prefix ?? "raw") as VaultPrefix,
              },
            });
          } catch (error) {
            return vaultError(reply, error);
          }
        },
      );

      staff.post<{ Body: PresignDownloadBody }>(
        "/vault/presign-download",
        async (request, reply) => {
          const user = request.authUser!;
          const body = request.body ?? ({} as PresignDownloadBody);

          if (!body.client_id?.trim()) {
            return reply.code(400).send({ error: "client_id is required" });
          }

          if (!body.s3_key?.trim()) {
            return reply.code(400).send({ error: "s3_key is required" });
          }

          try {
            await assertStaffCanAccessClient(config, request, body.client_id);

            return await invokeAccessBroker({
              operation: "presign_get",
              client_id: body.client_id.trim(),
              actor_user_id: user.id,
              reason: body.reason,
              s3_key: body.s3_key.trim(),
            });
          } catch (error) {
            return vaultError(reply, error);
          }
        },
      );

      staff.post<{ Body: ReprocessBody }>("/vault/reprocess", async (request, reply) => {
        const body = request.body ?? ({} as ReprocessBody);
        if (!body.client_id?.trim() || !body.vault_object_id?.trim()) {
          return reply
            .code(400)
            .send({ error: "client_id and vault_object_id are required" });
        }
        try {
          await assertStaffCanAccessClient(config, request, body.client_id);
          await invokeContentProcessorReanalysis({
            client_id: body.client_id.trim(),
            vault_object_id: body.vault_object_id.trim(),
          });
          return { queued: true };
        } catch (error) {
          return vaultError(reply, error);
        }
      });
    },
    { prefix: "/staff" },
  );
}
