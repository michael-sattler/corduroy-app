import type { FastifyInstance } from "fastify";
import { requireRole } from "../lib/auth.js";

export async function registerStaffRoutes(app: FastifyInstance) {
  await app.register(
    async (staff) => {
      staff.addHook("onRequest", requireRole("staff"));

      staff.get("/me", async (request) => {
        const user = request.authUser!;
        return {
          user_id: user.id,
          email: user.email,
          role: user.role,
          staff_role: user.staffRole,
        };
      });

      staff.get("/dashboard", async () => ({
        message: "Staff API shell — admin CRUD routes come in B1 supplemental",
      }));
    },
    { prefix: "/staff" },
  );
}
