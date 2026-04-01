import { defineConfig } from "../../../../src/index.ts"

export default defineConfig({
  localePattern: "custom/locales/**/*.json",
  srcPattern: "custom/src/**/*.ts",
  ignorePatterns: ["custom/node_modules/**"],
})
