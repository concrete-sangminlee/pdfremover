import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  ...nextConfig,
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/public/**"],
  },
];

/** @type {import("eslint").Linter.FlatConfig[]} */
export default config;
