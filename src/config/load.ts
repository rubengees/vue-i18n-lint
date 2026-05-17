import { loadConfig } from "c12"
import { z } from "zod"
import { configSchema } from "./schema.ts"

type CliArgs = {
  path?: string | undefined
  localePattern?: string | undefined
  srcPattern?: string | undefined
  ignorePatterns?: string | undefined
}

export async function loadVueI18nLintConfig(cliArgs?: CliArgs) {
  const normalizedCliArgs = {
    ...cliArgs,
    path: cliArgs?.path || process.cwd(),
    ignorePatterns: cliArgs?.ignorePatterns
      ?.split(",")
      ?.map((p) => p.trim())
      ?.filter((p) => p.length > 0),
  }

  const fileConfig = await loadFileConfig(normalizedCliArgs.path)

  const merged = {
    ...filterNullish(fileConfig),
    ...filterNullish(normalizedCliArgs),
  }

  const result = configSchema.safeParse(merged)

  if (!result.success) {
    throw new Error(`Failed to load config:\n${z.prettifyError(result.error)}`)
  }

  return result.data
}

async function loadFileConfig(path: string) {
  try {
    const result = await loadConfig({ name: "vue-i18n-lint", cwd: path })

    return result.config
  } catch (e) {
    throw new Error(`Failed to load config file`, { cause: e })
  }
}

function filterNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}

  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (obj[key] != null) {
      result[key] = obj[key]
    }
  }

  return result
}
