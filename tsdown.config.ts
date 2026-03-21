import { defineConfig } from "tsdown"

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    dts: true,
  },
  {
    entry: { cli: "src/cli.ts" },
    dts: false,
    banner: { js: "#!/usr/bin/env node" },
  },
])
