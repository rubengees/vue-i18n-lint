import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { buildCommand, type ApplicationContext } from "@stricli/core"
import { formatFilePath, writeLine } from "../utils.ts"

// language=ts
const configTemplate = `import { defineConfig } from "vue-i18n-lint"

export default defineConfig({
  localePattern: "**/locales/*.json",
  srcPattern: "**/*.{ts,cts,mts,js,cjs,mjs,vue}",
})
`

export const initCommand = buildCommand({
  async func(this: ApplicationContext, _flags: {}, path?: string) {
    const targetPath = path || "."
    const configPath = join(targetPath, "vue-i18n-lint.config.ts")

    if (existsSync(configPath)) {
      writeLine(this.process.stderr, `vue-i18n-lint.config.ts already exists in ${formatFilePath(targetPath)}.`)
      this.process.exitCode = 1
      return
    }

    await mkdir(targetPath, { recursive: true })
    await writeFile(configPath, configTemplate, "utf-8")

    writeLine(this.process.stdout, `Created vue-i18n-lint.config.ts in ${formatFilePath(targetPath)}.`)
  },
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Target path for the config file",
          parse: String,
          placeholder: "path",
          optional: true,
        },
      ],
    },
  },
  docs: {
    brief: "Create a default vue-i18n-lint configuration file",
  },
})
