import { resolve } from "node:path"
import { styleText } from "node:util"
import { defineCommand } from "citty"
import { globby } from "globby"
import { collectLocaleFile } from "../collector/localeCollector.ts"
import { collectSourceFile } from "../collector/sourceCollector.ts"
import { loadVueI18nLintConfig } from "../config/load.ts"
import { Severity } from "../config/schema.ts"
import { formatErrorMessage, ParseError } from "../error.ts"
import { filterResults } from "../filter.ts"
import { outputMissingKeys, outputTypeWarnings, outputUnusedKeys } from "../formatter.ts"
import { processFiles } from "../processor.ts"
import type { LocaleFile, SourceFile } from "../types.ts"
import { formatFilePath } from "../utils.ts"

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
    ignoreKeys: {
      type: "string",
      description: "Comma-separated keys to ignore in both missing and unused checks",
    },
    ignoreMissingKeys: {
      type: "string",
      description: "Comma-separated keys to ignore in the missing keys check",
    },
    ignoreUnusedKeys: {
      type: "string",
      description: "Comma-separated keys to ignore in the unused keys check",
    },
    missingKeysSeverity: {
      type: "string",
      description: "Severity for missing keys: error, warning, or off",
    },
    unusedKeysSeverity: {
      type: "string",
      description: "Severity for unused keys: error, warning, or off",
    },
  },
  async run({ args }): Promise<number> {
    const startTime = performance.now()

    const config = await loadVueI18nLintConfig(args)

    const globOptions = {
      cwd: config.path,
      ignore: config.ignorePatterns,
      gitignore: true,
    }

    const [rawLocalePaths, rawSrcPaths] = await Promise.all([
      globby(config.localePattern, globOptions),
      globby(config.srcPattern, globOptions),
    ])

    const [localeFiles, sourceFiles] = await Promise.all([
      Promise.all(rawLocalePaths.map((p) => collectFile(resolve(config.path, p), collectLocaleFile))),
      Promise.all(rawSrcPaths.map((p) => collectFile(resolve(config.path, p), collectSourceFile))),
    ])

    const validLocaleFiles = localeFiles.filter((f): f is LocaleFile => f != null)
    const validSourceFiles = sourceFiles.filter((f): f is SourceFile => f != null)
    const parseErrors = localeFiles.filter((f) => f == null).length + sourceFiles.filter((f) => f == null).length

    const { typeWarnings, missing, unused } = filterResults(processFiles(validLocaleFiles, validSourceFiles), {
      ignoreKeys: config.ignoreKeys,
      missingKeys: { ignore: config.checks.missingKeys.ignore },
      unusedKeys: { ignore: config.checks.unusedKeys.ignore },
    })

    const elapsed = Math.round(performance.now() - startTime)

    const missingSeverity = config.checks.missingKeys.severity
    const unusedSeverity = config.checks.unusedKeys.severity

    if (parseErrors > 0) console.log()
    if (typeWarnings.length > 0) outputTypeWarnings(typeWarnings)
    if (missing.length > 0 && missingSeverity !== Severity.Off) outputMissingKeys(missing)
    if (unused.length > 0 && unusedSeverity !== Severity.Off) outputUnusedKeys(unused)

    console.log(
      `Found ${styleText("red", `${missing.length} missing`)} and ${styleText("yellow", `${unused.length} unused`)} keys.`,
    )

    const errorSummary =
      parseErrors > 0 ? ` (${parseErrors} file${parseErrors === 1 ? "" : "s"} skipped due to errors)` : ""

    console.log(
      `Processed ${localeFiles.length} locale files and ${sourceFiles.length} source files in ${elapsed}ms${errorSummary}.`,
    )

    const missingIsError = missingSeverity === Severity.Error && missing.length > 0
    const unusedIsError = unusedSeverity === Severity.Error && unused.length > 0

    return missingIsError || unusedIsError || parseErrors > 0 ? 1 : 0
  },
})

async function collectFile<T>(file: string, collect: (file: string) => Promise<T>): Promise<T | null> {
  try {
    return await collect(file)
  } catch (e) {
    if (e instanceof ParseError) {
      console.error(`Failed to process: ${formatErrorMessage(e)}`)
    } else {
      console.error(`Failed to process ${formatFilePath(file)}: ${formatErrorMessage(e)}`)
    }

    return null
  }
}
