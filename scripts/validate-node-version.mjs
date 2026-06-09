import fs from "node:fs";
import { coerce, satisfies } from "semver";

const nvm = fs.readFileSync(".nvmrc", "utf8").trim();
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const engine = String(pkg?.engines?.node || "").trim();

if (!engine) {
  throw new Error("package.json does not define engines.node");
}

const nvmVersion = coerce(nvm);
if (!nvmVersion) {
  throw new Error(`Invalid .nvmrc version format: "${nvm}"`);
}

if (!satisfies(nvmVersion.version, engine)) {
  throw new Error(`Node version policy mismatch: .nvmrc "${nvm}" does not satisfy package engines "${engine}".`);
}

const nvmMajor = nvmVersion.major;
const engineMajorMatch = engine.match(/\d+/);
const engineMajor = Number(engineMajorMatch?.[0] ?? nvmMajor);

if (!Number.isFinite(nvmMajor) || !Number.isFinite(engineMajor)) {
  throw new Error("Failed to parse numeric Node major versions");
}

if (nvmMajor < engineMajor) {
  throw new Error(`Node major version mismatch: .nvmrc (${nvmMajor}) is lower than package engines.node (${engineMajor}).`);
}

console.log(`Node version policy aligned (engine ${engine}, .nvmrc ${nvmVersion.version}).`);
