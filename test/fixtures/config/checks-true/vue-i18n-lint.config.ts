import { defineConfig } from "../../../../src/index.ts"

export default defineConfig({
  checks: {
    missingKeys: true,
    unusedKeys: true,
    dynamicKeys: true,
  },
})
