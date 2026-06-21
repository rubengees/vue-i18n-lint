import { resolve } from "node:path"
import { styleText } from "node:util"
import { type ApplicationContext, buildCommand, type StricliProcess } from "@stricli/core"
import { globby } from "globby"
import { collectLocaleFile } from "../collector/localeCollector.ts"
import { collectSourceFile } from "../collector/sourceCollector.ts"
import { loadVueI18nLintConfig } from "../config/load.ts"
import { formatEnum, severityEnum, type CliArgs } from "../config/schema.ts"
import { formatErrorMessage } from "../error.ts"
import { filterResults } from "../filter.ts"
import { outputJson, outputMissingKeys, outputToon, outputTypeWarnings, outputUnusedKeys } from "../formatter.ts"
import { processFiles } from "../processor.ts"
import type { LocaleFile, SourceFile } from "../types.ts"
import { writeLine } from "../utils.ts"

type Flags = Omit<CliArgs, "path">

export const lintCommand = buildCommand({
  async func(this: ApplicationContext, flags: Flags, path?: string) {
    const startTime = performance.now()

    const config = await loadVueI18nLintConfig({ path, ...flags })

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
      Promise.all(rawLocalePaths.map((p) => collectFile(this.process, resolve(config.path, p), collectLocaleFile))),
      Promise.all(rawSrcPaths.map((p) => collectFile(this.process, resolve(config.path, p), collectSourceFile))),
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

    if (config.format === "json") {
      outputJson(this.process, { missing, unused })
    } else if (config.format === "toon") {
      outputToon(this.process, { missing, unused })
    } else {
      if (parseErrors > 0) writeLine(this.process.stdout)
      if (typeWarnings.length > 0) outputTypeWarnings(this.process, typeWarnings)
      if (missing.length > 0 && missingSeverity !== "off") outputMissingKeys(this.process, missing)
      if (unused.length > 0 && unusedSeverity !== "off") outputUnusedKeys(this.process, unused)

      writeLine(
        this.process.stdout,
        `Found ${styleText("red", `${missing.length} missing`)} and ${styleText("yellow", `${unused.length} unused`)} keys.`,
      )

      const errorSummary =
        parseErrors > 0 ? ` (${parseErrors} file${parseErrors === 1 ? "" : "s"} skipped due to errors)` : ""

      writeLine(
        this.process.stdout,
        `Processed ${localeFiles.length} locale files and ${sourceFiles.length} source files in ${elapsed}ms${errorSummary}.`,
      )
    }

    const missingIsError = missingSeverity === "error" && missing.length > 0
    const unusedIsError = unusedSeverity === "error" && unused.length > 0

    if (missingIsError || unusedIsError || parseErrors > 0) {
      this.process.exitCode = 1
    }
  },
  parameters: {
    flags: {
      format: { kind: "enum", values: formatEnum.options, optional: true, brief: "Output format" },
      localePattern: { kind: "parsed", parse: String, optional: true, brief: "Glob pattern for i18n locale files" },
      srcPattern: { kind: "parsed", parse: String, optional: true, brief: "Glob pattern for source files" },
      ignorePatterns: {
        kind: "parsed",
        parse: String,
        optional: true,
        variadic: ",",
        brief: "Comma-separated glob patterns to ignore",
      },
      ignoreKeys: {
        kind: "parsed",
        parse: String,
        optional: true,
        variadic: ",",
        brief: "Comma-separated keys to ignore in both missing and unused checks",
      },
      ignoreMissingKeys: {
        kind: "parsed",
        parse: String,
        optional: true,
        variadic: ",",
        brief: "Comma-separated keys to ignore in the missing keys check",
      },
      ignoreUnusedKeys: {
        kind: "parsed",
        parse: String,
        optional: true,
        variadic: ",",
        brief: "Comma-separated keys to ignore in the unused keys check",
      },
      missingKeysSeverity: {
        kind: "enum",
        values: severityEnum.options,
        optional: true,
        brief: "Severity for missing keys",
      },
      unusedKeysSeverity: {
        kind: "enum",
        values: severityEnum.options,
        optional: true,
        brief: "Severity for unused keys",
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Working directory",
          parse: String,
          placeholder: "path",
          optional: true,
        },
      ],
    },
  },
  docs: {
    brief: "Lint i18n keys in your project",
  },
})

async function collectFile<T>(
  process: StricliProcess,
  file: string,
  collect: (file: string) => Promise<T>,
): Promise<T | null> {
  try {
    return await collect(file)
  } catch (e) {
    writeLine(process.stderr, `Failed to process: ${formatErrorMessage(e)}`)
    return null
  }
}
