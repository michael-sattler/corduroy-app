import type { FastifyInstance } from "fastify";
import { checkAccessBrokerHealth } from "../lib/access-broker.js";
import { requireRole } from "../lib/auth.js";

export async function registerStaffVaultRoutes(app: FastifyInstance) {
  await app.register(
    async (staff) => {
      staff.addHook("onRequest", requireRole("staff"));

      staff.get("/vault/access-broker-status", async () => {
        return checkAccessBrokerHealth();
      });
    },
    { prefix: "/staff" },
  );
}
