import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "src");
const BRIDGE_ROOT = join(ROOT, "bridge");
const SDK_IMPORT = '@evenrealities/even_hub_sdk';
const SOURCE_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

describe("architecture guard: sdk import boundary", () => {
  it("allows @evenrealities/even_hub_sdk imports only in src/bridge", () => {
    const violations: string[] = [];

    for (const filePath of walkSourceFiles(ROOT)) {
      if (filePath.startsWith(BRIDGE_ROOT)) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");
      if (source.includes(SDK_IMPORT)) {
        violations.push(relative(process.cwd(), filePath));
      }
    }

    expect(
      violations,
      `Found forbidden SDK imports outside src/bridge:\n${violations.join("\n")}`
    ).toEqual([]);
  });
});

function walkSourceFiles(startDir: string): string[] {
  const out: string[] = [];
  const stack: string[] = [startDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!hasAllowedExtension(entry.name)) {
        continue;
      }

      out.push(fullPath);
    }
  }

  return out;
}

function hasAllowedExtension(fileName: string): boolean {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) {
    return false;
  }
  return SOURCE_FILE_EXTENSIONS.has(fileName.slice(dot));
}
