const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

const PATTERNS = [
  { from: "src={item.imageUrl}", to: "src={resolveImageUrl(item.imageUrl)}" },
  {
    from: "src={memo.items[0].imageUrl}",
    to: "src={resolveImageUrl(memo.items[0].imageUrl)}",
  },
  {
    from: "src={selectedImageUrl}",
    to: "src={resolveImageUrl(selectedImageUrl)}",
  },
];

function getRelativeConfigPath(filePath) {
  const depth =
    filePath.replace(srcDir + path.sep, "").split(path.sep).length - 1;
  return depth === 0 ? "./config" : "../".repeat(depth) + "config";
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  for (const { from, to } of PATTERNS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }

  if (changed) {
    // Add import if not already present
    if (
      !content.includes("resolveImageUrl } from") &&
      !content.includes("{ resolveImageUrl }")
    ) {
      const importPath = getRelativeConfigPath(filePath);
      // Insert after the last import statement
      const lastImportMatch = [...content.matchAll(/^import .+;\r?\n/gm)];
      if (lastImportMatch.length > 0) {
        const last = lastImportMatch[lastImportMatch.length - 1];
        const insertAt = last.index + last[0].length;
        content =
          content.slice(0, insertAt) +
          `import { resolveImageUrl } from "${importPath}";\n` +
          content.slice(insertAt);
      }
    }
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Fixed:", path.basename(filePath));
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") walkDir(full);
    else if (entry.name.endsWith(".jsx") || entry.name.endsWith(".js"))
      processFile(full);
  }
}

walkDir(srcDir);
console.log("Done!");
