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
    ...(cliArgs?.localePattern != null && { localePattern: cliArgs.localePattern }),
    ...(cliArgs?.srcPattern != null && { srcPattern: cliArgs.srcPattern }),
    ...(cliArgs?.ignorePatterns != null && { ignorePatterns: split(cliArgs.ignorePatterns) }),
    ...(cliArgs?.ignoreKeys != null && { ignoreKeys: split(cliArgs.ignoreKeys) }),
    ...((cliArgs?.ignoreMissingKeys != null || cliArgs?.ignoreUnusedKeys != null) && {
      checks: {
        ...(cliArgs.ignoreMissingKeys != null && { missingKeys: { ignore: split(cliArgs.ignoreMissingKeys) } }),
        ...(cliArgs.ignoreUnusedKeys != null && { unusedKeys: { ignore: split(cliArgs.ignoreUnusedKeys) } }),
      },
    }),
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
