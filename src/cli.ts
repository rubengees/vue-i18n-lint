import { run } from "@stricli/core"
import { app } from "./app.ts"

await run(app, process.argv.slice(2), {
  process: {
    stdout: process.stdout,
    stderr: process.stderr,
    env: process.env,
  },
})
