import cors from "@fastify/cors";
import Fastify from "fastify";
import type { ApiConfig } from "./config.js";
import { initSupabaseAuth } from "./lib/auth.js";
import { registerClientRoutes } from "./routes/client.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerStaffAdminRoutes } from "./routes/staff-admin.js";
import { registerStaffRoutes } from "./routes/staff.js";

export async function buildApp(config: ApiConfig) {
  initSupabaseAuth(config.supabaseUrl, config.supabaseAnonKey);

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await registerHealthRoutes(app);
  await registerClientRoutes(app);
  await registerStaffRoutes(app);
  await registerStaffAdminRoutes(app, config);

  return app;
}
