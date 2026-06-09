import fs from "node:fs";

function extractMajor(versionLike) {
  const match = versionLike.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Invalid Node version format: "${versionLike}"`);
  }
  return Number(match[1]);
}

const nvm = fs.readFileSync(".nvmrc", "utf8").trim();
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const engine = String(pkg?.engines?.node || "").trim();

const nvmMajor = extractMajor(nvm);
if (!engine) {
  throw new Error("package.json does not define engines.node");
}

const engineMatch = engine.match(/[0-9]+\.[0-9]+\.[0-9]+/);
if (!engineMatch) {
  throw new Error(`Unsupported engines.node format: "${engine}"`);
}
const engineMajor = extractMajor(engineMatch[0]);

if (nvmMajor < engineMajor) {
  throw new Error(
    `Node major version mismatch: .nvmrc (${nvmMajor}) is lower than package engines.node (${engineMajor}).`
  );
}

console.log(`Node version policy aligned (engine major ${engineMajor}, .nvmrc ${nvmMajor}).`);
