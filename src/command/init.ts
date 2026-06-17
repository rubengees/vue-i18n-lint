import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { formatFilePath } from "../utils.ts"

// language=ts
const configTemplate = `import { defineConfig } from "vue-i18n-lint"

export default defineConfig({
  localePattern: "**/locales/*.json",
  srcPattern: "**/*.{ts,cts,mts,js,cjs,mjs,vue}",
})
`

export async function initCommand(dir?: string): Promise<number> {
  const targetDir = dir || "."
  const configPath = join(targetDir, "vue-i18n-lint.config.ts")

  if (existsSync(configPath)) {
    console.error(`vue-i18n-lint.config.ts already exists in ${formatFilePath(targetDir)}.`)
    return 1
  }

  await mkdir(targetDir, { recursive: true })
  await writeFile(configPath, configTemplate, "utf-8")

  console.log(`Created vue-i18n-lint.config.ts in ${formatFilePath(targetDir)}.`)
  return 0
}
