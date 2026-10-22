import { run, type StricliProcess } from "@stricli/core"
import { app } from "./app.ts"

const stricliProcess: StricliProcess = {
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env,
}

await run(app, process.argv.slice(2), { process: stricliProcess })

if (stricliProcess.exitCode != null) {
  process.exitCode = stricliProcess.exitCode
}
