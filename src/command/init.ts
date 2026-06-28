import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { buildCommand, type ApplicationContext } from "@stricli/core"
import { formatFilePath, writeLine } from "../utils.ts"

type Format = "ts" | "js" | "json" | "yaml"

type Flags = {
  format?: Format
}

const configTemplates: Record<Format, string> = {
  // language=typescript
  ts: `import { defineConfig } from "vue-i18n-lint"

export default defineConfig({
  localePattern: "**/locales/*.json",
  srcPattern: "**/*.{ts,cts,mts,js,cjs,mjs,vue}",
})
`,
  // language=javascript
  js: `import { defineConfig } from "vue-i18n-lint"

export default defineConfig({
  localePattern: "**/locales/*.json",
  srcPattern: "**/*.{ts,cts,mts,js,cjs,mjs,vue}",
})
`,
  // language=json
  json: `{
  "$schema": "https://raw.githubusercontent.com/rubengees/vue-i18n-lint/main/config.schema.json",
  "localePattern": "**/locales/*.json",
  "srcPattern": "**/*.{ts,cts,mts,js,cjs,mjs,vue}"
}
`,
  // language=yaml
  yaml: `# yaml-language-server: $schema=https://raw.githubusercontent.com/rubengees/vue-i18n-lint/main/config.schema.json
localePattern: "**/locales/*.json"
srcPattern: "**/*.{ts,cts,mts,js,cjs,mjs,vue}"
`,
}

export const initCommand = buildCommand({
  async func(this: ApplicationContext, flags: Flags, path?: string) {
    const targetPath = path || "."
    const format = flags.format ?? detectFormat(targetPath)
    const configName = `vue-i18n-lint.config.${format}`
    const configPath = join(targetPath, configName)

    if (existsSync(configPath)) {
      writeLine(this.process.stderr, `${configName} already exists in ${formatFilePath(targetPath)}.`)
      this.process.exitCode = 1
      return
    }

    await mkdir(targetPath, { recursive: true })
    await writeFile(configPath, configTemplates[format], "utf-8")

    writeLine(this.process.stdout, `Created ${configName} in ${formatFilePath(targetPath)}.`)
  },
  parameters: {
    flags: {
      format: {
        kind: "enum",
        values: ["ts", "js", "json", "yaml"],
        optional: true,
        brief: "Config file format",
      },
    },
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

function detectFormat(targetPath: string): Format {
  return existsSync(join(targetPath, "tsconfig.json")) ? "ts" : "js"
}
