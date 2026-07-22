import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), "src");
const maximumLines = 250;

async function componentFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return componentFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  }));
  return nested.flat();
}

const violations = [];
for (const file of await componentFiles(root)) {
  const lines = (await readFile(file, "utf8")).split(/\r?\n/).length;
  if (lines > maximumLines) violations.push(`${file}: ${lines} lines`);
}

if (violations.length) {
  console.error(`Component files must not exceed ${maximumLines} lines:\n${violations.join("\n")}`);
  process.exit(1);
}

console.log(`Component size check passed (maximum ${maximumLines} lines).`);
