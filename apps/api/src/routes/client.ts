import type { FastifyInstance } from "fastify";
import { requireRole } from "../lib/auth.js";

export async function registerClientRoutes(app: FastifyInstance) {
  await app.register(
    async (client) => {
      client.addHook("onRequest", requireRole("client"));

      client.get("/me", async (request) => {
        const user = request.authUser!;
        return {
          user_id: user.id,
          email: user.email,
          role: user.role,
          client_id: user.clientId,
        };
      });

      client.get("/dashboard", async () => ({
        message: "Client API shell — Vault and plan routes come in Phase 1–2",
      }));
    },
    { prefix: "/client" },
  );
}
