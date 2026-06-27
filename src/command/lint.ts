import { type ApplicationContext, buildCommand } from "@stricli/core"
import { loadVueI18nLintConfig } from "../config/load.ts"
import { type CliArgs, formatEnum, severityEnum } from "../config/schema.ts"
import {
  formatSummaryPart,
  outputJson,
  outputMissingKeys,
  outputToon,
  outputTypeWarnings,
  outputUnusedKeys,
} from "../formatter.ts"
import { processFiles } from "../processor.ts"
import { writeLine } from "../utils.ts"
import { collectFiles } from "./shared.ts"

type Flags = Omit<CliArgs, "path">

export const lintCommand = buildCommand({
  async func(this: ApplicationContext, flags: Flags, path?: string) {
    const startTime = performance.now()

    const config = await loadVueI18nLintConfig({ path, ...flags })

    const { localeFiles, sourceFiles, parseErrors } = await collectFiles(config, this.process)

    const result = processFiles(localeFiles, sourceFiles, config)

    const elapsed = Math.round(performance.now() - startTime)

    const missingSeverity = config.checks.missingKeys.severity
    const unusedSeverity = config.checks.unusedKeys.severity

    if (config.format === "text") {
      if (parseErrors > 0) writeLine(this.process.stdout)
      if (result.typeWarnings.length > 0) outputTypeWarnings(this.process, result.typeWarnings)
      if (result.missing && result.missing.length > 0) outputMissingKeys(this.process, result.missing)
      if (result.unused && result.unused.length > 0) outputUnusedKeys(this.process, result.unused)

      const summaryParts: string[] = []

      if (result.missing != null)
        summaryParts.push(`${formatSummaryPart(result.missing.length, config.checks.missingKeys.severity)} missing`)

      if (result.unused != null)
        summaryParts.push(`${formatSummaryPart(result.unused.length, config.checks.unusedKeys.severity)} unused`)

      if (summaryParts.length > 0) {
        writeLine(this.process.stdout, `Found ${summaryParts.join(" and ")} keys.`)
      }

      const errorSummary =
        parseErrors > 0 ? ` (${parseErrors} file${parseErrors === 1 ? "" : "s"} skipped due to errors)` : ""

      writeLine(
        this.process.stdout,
        `Processed ${localeFiles.length} locale files and ${sourceFiles.length} source files in ${elapsed}ms${errorSummary}.`,
      )
    } else {
      const outputData = { missingKeys: result.missing, unusedKeys: result.unused }

      if (config.format === "json") {
        outputJson(this.process, outputData)
      } else if (config.format === "toon") {
        outputToon(this.process, outputData)
      }
    }

    const missingIsError = missingSeverity === "error" && result.missing && result.missing.length > 0
    const unusedIsError = unusedSeverity === "error" && result.unused && result.unused.length > 0

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
