import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    isolate: false,
    benchmark: {
      suppressExportGetterWarnings: true,
    },
    env: {
      FORCE_COLOR: "0", // Work around IDEs setting this to 1, causing issues with some tests.
    },
  },
})
