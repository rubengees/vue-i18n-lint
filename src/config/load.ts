import { loadConfig } from "c12"
import { z } from "zod"
import { merge, split } from "../utils.ts"
import { configSchema } from "./schema.ts"

type CliArgs = {
  path?: string | undefined
  localePattern?: string | undefined
  srcPattern?: string | undefined
  ignorePatterns?: string | undefined
  ignoreKeys?: string | undefined
  ignoreMissingKeys?: string | undefined
  ignoreUnusedKeys?: string | undefined
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
    localePattern: cliArgs?.localePattern,
    srcPattern: cliArgs?.srcPattern,
    ignorePatterns: split(cliArgs?.ignorePatterns),
    ignoreKeys: split(cliArgs?.ignoreKeys),
    checks: {
      missingKeys: {
        ignore: split(cliArgs?.ignoreMissingKeys),
        severity: cliArgs?.missingKeysSeverity,
      },
      unusedKeys: {
        ignore: split(cliArgs?.ignoreUnusedKeys),
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
