import type { FastifyInstance } from "fastify";
import {
  AccessBrokerError,
  invokeAccessBroker,
  type AccessBrokerUploadInput,
  type VaultPrefix,
} from "../lib/access-broker.js";
import { requireRole } from "../lib/auth.js";

type PresignUploadBody = AccessBrokerUploadInput & {
  reason?: string;
};

type PresignDownloadBody = {
  s3_key: string;
  reason?: string;
};

function vaultError(reply: { code: (status: number) => { send: (body: unknown) => unknown } }, error: unknown) {
  if (error instanceof AccessBrokerError) {
    return reply.code(error.statusCode).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "Vault request failed";
  return reply.code(500).send({ error: message });
}

export async function registerVaultClientRoutes(app: FastifyInstance) {
  await app.register(
    async (client) => {
      client.addHook("onRequest", requireRole("client"));

      client.post<{ Body: PresignUploadBody }>(
        "/vault/presign-upload",
        async (request, reply) => {
          const user = request.authUser!;
          if (!user.clientId) {
            return reply.code(403).send({ error: "Client scope missing on token" });
          }

          const body = request.body ?? ({} as PresignUploadBody);

          try {
            return await invokeAccessBroker({
              operation: "presign_put",
              client_id: user.clientId,
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

      client.post<{ Body: PresignDownloadBody }>(
        "/vault/presign-download",
        async (request, reply) => {
          const user = request.authUser!;
          if (!user.clientId) {
            return reply.code(403).send({ error: "Client scope missing on token" });
          }

          const body = request.body ?? ({} as PresignDownloadBody);
          if (!body.s3_key?.trim()) {
            return reply.code(400).send({ error: "s3_key is required" });
          }

          try {
            return await invokeAccessBroker({
              operation: "presign_get",
              client_id: user.clientId,
              actor_user_id: user.id,
              reason: body.reason,
              s3_key: body.s3_key.trim(),
            });
          } catch (error) {
            return vaultError(reply, error);
          }
        },
      );
    },
    { prefix: "/client" },
  );
}
