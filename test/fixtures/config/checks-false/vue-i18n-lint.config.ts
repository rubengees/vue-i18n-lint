import { defineConfig } from "../../../../src/index.ts"

export default defineConfig({
  checks: {
    missingKeys: {
      severity: "off",
    },
    unusedKeys: false,
  },
})
