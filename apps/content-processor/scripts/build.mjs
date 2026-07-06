import * as esbuild from "esbuild";
import { mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = resolve(root, "dist/index.js");

await mkdir(dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: [resolve(root, "src/handler.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile,
  sourcemap: false,
  minify: false,
});

console.log(`Built ${outfile}`);
