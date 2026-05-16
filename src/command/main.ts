import { resolve } from "node:path"
import { styleText } from "node:util"
import { defineCommand } from "citty"
import { globby } from "globby"
import { collectLocaleFile } from "../collector/localeCollector.ts"
import { collectSourceFile } from "../collector/sourceCollector.ts"
import { loadVueI18nLintConfig } from "../config/load.ts"
import { outputMissingKeys, outputTypeWarnings, outputUnusedKeys } from "../formatter.ts"
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

    const globOptions = {
      cwd: config.path,
      ignore: config.ignorePatterns,
      gitignore: true,
    }

    const [localeFiles, sourceFiles] = await Promise.all([
      globby(config.localePattern, globOptions).then((rawLocaleFiles) =>
        Promise.all(rawLocaleFiles.map((path) => collectLocaleFile(resolve(config.path, path)))),
      ),
      globby(config.srcPattern, globOptions).then((rawSrcFiles) =>
        Promise.all(rawSrcFiles.map((path) => collectSourceFile(resolve(config.path, path)))),
      ),
    ])

    const { typeWarnings, missing, unused } = processFiles(localeFiles, sourceFiles)
    const elapsed = Math.round(performance.now() - startTime)

    if (typeWarnings.length > 0) {
      outputTypeWarnings(typeWarnings)
    }

    if (missing.length > 0) {
      outputMissingKeys(missing)
    }

    if (unused.length > 0) {
      outputUnusedKeys(unused)
    }

    console.log(
      `Found ${styleText("red", `${missing.length} missing`)} and ${styleText("yellow", `${unused.length} unused`)} keys.`,
    )

    console.log(`Processed ${localeFiles.length} locale files and ${sourceFiles.length} source files in ${elapsed}ms.`)

    process.exit(missing.length > 0 ? 1 : 0)
  },
})
