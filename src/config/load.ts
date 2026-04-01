import { loadConfig } from "c12"
import { z } from "zod"
import { type Config, configSchema } from "./schema.ts"

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

  const { config: fileConfig } = await loadConfig({
    name: "vue-i18n-lint",
    cwd: normalizedCliArgs.path,
  })

  const merged: Partial<Config> = {
    ...filterNullish(fileConfig),
    ...filterNullish(normalizedCliArgs),
  }

  const result = configSchema.safeParse(merged)

  if (!result.success) {
    console.error(z.prettifyError(result.error))
    process.exit(1)
  }

  return result.data
}

function filterNullish<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T as NonNullable<T[K]> extends never ? never : K]: NonNullable<T[K]> } {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null)) as ReturnType<typeof filterNullish<T>>
}
