import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectDuckPackPath } from "../apps/desktop/src/packs.ts";

const command = process.argv[2];
const target = process.argv[3];
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (command !== "validate" || !target) {
  console.error("Usage: npm run duckpack -- validate <pack.duckpack|folder>");
  process.exit(1);
}

function resolveTarget(value: string): string {
  if (path.isAbsolute(value) && fs.existsSync(value)) {
    return value;
  }
  const fromCwd = path.resolve(value);
  if (fs.existsSync(fromCwd)) {
    return fromCwd;
  }
  return path.resolve(repoRoot, value);
}

try {
  const inspected = await inspectDuckPackPath(resolveTarget(target));
  console.log(`${inspected.manifest.name} ${inspected.manifest.packVersion} (${inspected.manifest.license})`);
  if (inspected.review.length === 0) {
    console.log("- No overlay changes; preview and media only.");
  }
  for (const change of inspected.review) {
    console.log(`- ${change.label}: ${change.detail}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
