import { resolve } from "node:path"
import { styleText } from "node:util"
import { defineCommand } from "citty"
import { globby } from "globby"
import { collectFileKeys } from "../collector/fileCollector.ts"
import { collectLocaleFile } from "../collector/localeCollector.ts"
import { loadVueI18nLintConfig } from "../config/load.ts"
import { outputMissingKeys, outputUnusedKeys } from "../formatter.ts"
import { processFiles } from "../processor.ts"

export const mainCommand = defineCommand({
  meta: {
    name: "vue-i18n-lint",
    description: "Fast and accurate linting for Vue i18n.",
  },
  args: {
    path: {
      type: "positional",
      description: "Working directory",
      required: false,
    },
    localePattern: {
      type: "string",
      description: "Glob pattern for i18n locale files",
    },
    srcPattern: {
      type: "string",
      description: "Glob pattern for source files",
    },
    ignorePatterns: {
      type: "string",
      description: "Comma-separated glob patterns to ignore",
    },
  },
  async run({ args }) {
    const startTime = performance.now()

    const config = await loadVueI18nLintConfig(args)

    const rawLocaleFiles = await globby(config.localePattern, {
      cwd: config.path,
      ignore: config.ignorePatterns,
      gitignore: true,
    })

    const localeFiles = await Promise.all(rawLocaleFiles.map((path) => collectLocaleFile(resolve(config.path, path))))

    const rawSrcFiles = await globby(config.srcPattern, {
      cwd: config.path,
      ignore: config.ignorePatterns,
      gitignore: true,
    })

    const srcKeys = await Promise.all(rawSrcFiles.flatMap((path) => collectFileKeys(resolve(config.path, path))))

    const { missing, unused } = processFiles(localeFiles, srcKeys)
    const elapsed = Math.round(performance.now() - startTime)

    if (missing.length > 0) {
      outputMissingKeys(missing)
    }

    if (unused.length > 0) {
      outputUnusedKeys(unused)
    }

    console.log(
      `Found ${styleText("red", `${missing.length} missing`)} and ${styleText("yellow", `${unused.length} unused`)} keys.`,
    )

    console.log(`Processed ${rawLocaleFiles.length} i18n files and ${rawSrcFiles.length} source files in ${elapsed}ms.`)

    process.exit(missing.length > 0 ? 1 : 0)
  },
})
