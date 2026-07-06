import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

for (const file of [
  ".env",
  "apps/web/.env",
  "apps/web/.env.local",
  "apps/api/.env",
]) {
  const path = resolve(repoRoot, file);
  if (existsSync(path)) {
    dotenv.config({ path, override: true });
  }
}
