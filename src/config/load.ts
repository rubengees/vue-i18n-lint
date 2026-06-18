import { loadConfig } from "c12"
import { z } from "zod"
import { merge } from "../utils.ts"
import { configSchema } from "./schema.ts"

type CliArgs = {
  path?: string | undefined
  format?: string | undefined
  localePattern?: string | undefined
  srcPattern?: string | undefined
  ignorePatterns?: readonly string[] | undefined
  ignoreKeys?: readonly string[] | undefined
  ignoreMissingKeys?: readonly string[] | undefined
  ignoreUnusedKeys?: readonly string[] | undefined
  missingKeysSeverity?: string | undefined
  unusedKeysSeverity?: string | undefined
}

export async function loadVueI18nLintConfig(cliArgs?: CliArgs) {
  const path = cliArgs?.path || process.cwd()

  const cliConfig = buildCliConfig(path, cliArgs)
  const fileConfig = (await loadFileConfig(path)) ?? {}

  const result = configSchema.safeParse(merge(cliConfig, fileConfig))

  if (!result.success) {
    throw new Error(`Failed to load config:\n${z.prettifyError(result.error)}`)
  }

  return result.data
}

function buildCliConfig(path: string, cliArgs?: CliArgs) {
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
