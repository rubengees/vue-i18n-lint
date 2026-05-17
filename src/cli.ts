import { runCommand } from "citty"
import { mainCommand } from "./command/main.ts"
import { formatErrorMessage } from "./error.ts"

try {
  const { result } = await runCommand(mainCommand, { rawArgs: process.argv.slice(2) })
  process.exit(typeof result === "number" ? result : 0)
} catch (e) {
  console.error(formatErrorMessage(e))
  process.exit(1)
}
