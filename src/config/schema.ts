import { z } from "zod"

export const severityEnum = z.enum(["error", "warning", "off"])
export const formatEnum = z.enum(["text", "json", "toon"])
export const dynamicKeysModeEnum = z.enum(["full", "partial"])

const checkSchema = (defaultSeverity: z.infer<typeof severityEnum>) =>
  z
    .union([
      z.object({
        severity: severityEnum.default(defaultSeverity).describe("Severity level for this check"),
        ignore: z.array(z.string().nonempty()).default([]).describe("Keys to ignore in this check"),
      }),
      z.literal(true).transform(() => ({ severity: "error" as const, ignore: [] as string[] })),
      z.literal(false).transform(() => ({ severity: "off" as const, ignore: [] as string[] })),
    ])
    .default({ severity: defaultSeverity, ignore: [] })

const dynamicKeysCheckSchema = z
  .union([
    z.object({
      severity: severityEnum.default("off").describe("Severity level for this check"),
      ignore: z.array(z.string().nonempty()).default([]).describe("Keys to ignore in this check"),
      mode: dynamicKeysModeEnum
        .default("full")
        .describe("Which dynamic keys to report: Fully dynamic, or any with dynamic parts"),
    }),
    z.literal(true).transform(() => ({
      severity: "error" as const,
      ignore: [] as string[],
      mode: "full" as const,
    })),
    z.literal(false).transform(() => ({
      severity: "off" as const,
      ignore: [] as string[],
      mode: "full" as const,
    })),
  ])
  .default({ severity: "off", ignore: [], mode: "full" })

/**
 * Runtime schema used to validate vue-i18n-lint configuration.
 */
export const configSchema = z.object({
  format: formatEnum.default("text").describe("Output format for lint results"),
  localePattern: z.string().nonempty().default("**/locales/*.json").describe("Glob pattern for i18n locale files"),
  srcPattern: z
    .string()
    .nonempty()
    .default("**/*.{ts,cts,mts,js,cjs,mjs,vue}")
    .describe("Glob pattern for source files"),
  ignorePatterns: z.array(z.string().nonempty()).default([]).describe("Glob patterns to ignore"),
  ignoreKeys: z.array(z.string().nonempty()).default([]).describe("Keys to ignore in all checks"),
  gitignore: z.boolean().default(true).describe("Respect .gitignore when scanning files"),
  checks: z
    .object({
      missingKeys: checkSchema("error").describe("Severity and ignore list for missing keys"),
      unusedKeys: checkSchema("warning").describe("Severity and ignore list for unused keys"),
      dynamicKeys: dynamicKeysCheckSchema.describe("Severity, ignore list and reporting mode for dynamic keys"),
    })
    .default({
      missingKeys: { severity: "error", ignore: [] },
      unusedKeys: { severity: "warning", ignore: [] },
      dynamicKeys: { severity: "off", ignore: [], mode: "full" },
    })
    .describe("Severity and per-check ignore configuration"),
}) satisfies z.ZodType<ConfigInput>

export type CliArgs = {
  config?: string | undefined
  format?: z.infer<typeof formatEnum> | undefined
  output?: string | undefined
  localePattern?: string | undefined
  srcPattern?: string | undefined
  ignorePatterns?: string[] | undefined
  ignoreKeys?: string[] | undefined
  gitignore?: boolean | undefined
  ignoreMissingKeys?: string[] | undefined
  ignoreUnusedKeys?: string[] | undefined
  ignoreDynamicKeys?: string[] | undefined
  missingKeysSeverity?: z.infer<typeof severityEnum> | undefined
  unusedKeysSeverity?: z.infer<typeof severityEnum> | undefined
  dynamicKeysSeverity?: z.infer<typeof severityEnum> | undefined
  dynamicKeysMode?: z.infer<typeof dynamicKeysModeEnum> | undefined
}

type CheckInput =
  | boolean
  | {
      /** Severity level for this check */
      severity?: "error" | "warning" | "off" | undefined
      /** Keys to ignore in this check */
      ignore?: string[] | undefined
    }

type DynamicKeysCheckInput =
  | boolean
  | {
      /** Severity level for this check */
      severity?: "error" | "warning" | "off" | undefined
      /** Keys to ignore in this check */
      ignore?: string[] | undefined
      /** Which dynamic keys to report: Fully dynamic, or any with dynamic parts */
      mode?: "full" | "partial" | undefined
    }

/**
 * Configuration accepted by `defineConfig`.
 */
export type ConfigInput = {
  /** Output format for lint results */
  format?: "text" | "json" | "toon" | undefined
  /** Glob pattern for i18n locale files */
  localePattern?: string | undefined
  /** Glob pattern for source files */
  srcPattern?: string | undefined
  /** Glob patterns to ignore */
  ignorePatterns?: string[] | undefined
  /** Keys to ignore in all checks */
  ignoreKeys?: string[] | undefined
  /** Respect .gitignore when scanning files */
  gitignore?: boolean | undefined
  /** Severity and per-check ignore configuration */
  checks?:
    | {
        /** Severity and ignore list for missing keys */
        missingKeys?: CheckInput
        /** Severity and ignore list for unused keys */
        unusedKeys?: CheckInput
        /** Severity, ignore list and reporting mode for dynamic keys */
        dynamicKeys?: DynamicKeysCheckInput
      }
    | undefined
}

export type ConfigOutput = z.output<typeof configSchema>
