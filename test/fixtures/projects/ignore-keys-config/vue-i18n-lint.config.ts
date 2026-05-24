import { defineConfig } from "../../../../src/index.ts"

export default defineConfig({
  checks: {
    missingKeys: {
      ignore: ["missing.key"],
    },
    unusedKeys: {
      ignore: ["unused"],
    },
  },
})
