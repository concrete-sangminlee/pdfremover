import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const configPath = path.join(root, "app", "lib", "config.ts");
const appBuildDir = path.join(root, ".next", "server", "app");
const prerenderManifestPath = path.join(root, ".next", "prerender-manifest.json");

function readToolIds() {
  const sourceText = readFileSync(configPath, "utf8");
  const sourceFile = ts.createSourceFile(configPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const ids = [];

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "TOOLS" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue;
        const idProperty = element.properties.find(
          (property) =>
            ts.isPropertyAssignment(property) &&
            ts.isIdentifier(property.name) &&
            property.name.text === "id" &&
            ts.isStringLiteral(property.initializer)
        );
        if (idProperty && ts.isPropertyAssignment(idProperty) && ts.isStringLiteral(idProperty.initializer)) {
          ids.push(idProperty.initializer.text);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (ids.length === 0) {
    throw new Error(`No tool ids found in ${configPath}`);
  }
  return ids;
}

function assertNoMissing(label, values) {
  const missing = values.filter((value) => !value.ok);
  if (missing.length === 0) return;

  console.error(`${label} missing:`);
  for (const item of missing) {
    console.error(`- ${item.name}`);
  }
  process.exit(1);
}

const toolIds = readToolIds();
const expectedHtml = ["index", ...toolIds].map((name) => ({
  name: `${name}.html`,
  ok: existsSync(path.join(appBuildDir, `${name}.html`)),
}));
assertNoMissing("Static HTML output", expectedHtml);

const prerenderManifest = JSON.parse(readFileSync(prerenderManifestPath, "utf8"));
const prerenderRoutes = new Set(Object.keys(prerenderManifest.routes ?? {}));
const expectedRoutes = ["/", ...toolIds.map((id) => `/${id}`)].map((route) => ({
  name: route,
  ok: prerenderRoutes.has(route),
}));
assertNoMissing("Prerender manifest route", expectedRoutes);

console.log(`Verified ${expectedHtml.length} static HTML pages for ${toolIds.length} tools.`);
