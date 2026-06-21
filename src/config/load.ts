import { loadConfig } from "c12"
import { z } from "zod"
import { merge } from "../utils.ts"
import { configSchema, type CliArgs, type ConfigInput, type ConfigOutput } from "./schema.ts"

export async function loadVueI18nLintConfig(cliArgs?: CliArgs): Promise<ConfigOutput> {
  const path = cliArgs?.path || process.cwd()

  const cliConfig = buildCliConfig(path, cliArgs)

  const rawFileConfig = (await loadFileConfig(path)) ?? {}
  const parsedFileConfig = configSchema.safeParse({ path, ...rawFileConfig })
  if (!parsedFileConfig.success) {
    throw new Error(`Failed to load config:\n${z.prettifyError(parsedFileConfig.error)}`)
  }

  const mergedConfig = merge(cliConfig, parsedFileConfig.data)
  const parsedMergedConfig = configSchema.safeParse(mergedConfig)
  if (!parsedMergedConfig.success) {
    throw new Error(`Failed to load config:\n${z.prettifyError(parsedMergedConfig.error)}`)
  }

  return parsedMergedConfig.data
}

function buildCliConfig(path: string, cliArgs?: CliArgs): ConfigInput {
  return {
    path,
    format: cliArgs?.format,
    localePattern: cliArgs?.localePattern,
    srcPattern: cliArgs?.srcPattern,
    ignorePatterns: cliArgs?.ignorePatterns,
    ignoreKeys: cliArgs?.ignoreKeys,
    checks: {
      missingKeys: {
        ignore: cliArgs?.ignoreMissingKeys,
        severity: cliArgs?.missingKeysSeverity,
      },
      unusedKeys: {
        ignore: cliArgs?.ignoreUnusedKeys,
        severity: cliArgs?.unusedKeysSeverity,
      },
    },
  }
}

async function loadFileConfig(path: string) {
  try {
    const result = await loadConfig({ name: "vue-i18n-lint", cwd: path })

    return result.config
  } catch (e) {
    throw new Error(`Failed to load config file`, { cause: e })
  }
}
