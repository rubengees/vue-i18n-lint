import { z } from "zod"

export const severityEnum = z.enum(["error", "warning", "off"])
export const formatEnum = z.enum(["text", "json", "toon"])

const checkSchema = (defaultSeverity: z.infer<typeof severityEnum>) =>
  z
    .union([
      z.object({
        severity: severityEnum.default(defaultSeverity).describe("Severity level for this check"),
        ignore: z.array(z.string().nonempty()).default([]).describe("Keys to ignore in this check"),
      }),
      z.literal(false).transform(() => ({ severity: "off" as const, ignore: [] as string[] })),
    ])
    .default({ severity: defaultSeverity, ignore: [] })

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
  checks: z
    .object({
      missingKeys: checkSchema("error").describe("Severity and ignore list for missing keys"),
      unusedKeys: checkSchema("warning").describe("Severity and ignore list for unused keys"),
    })
    .default({
      missingKeys: { severity: "error", ignore: [] },
      unusedKeys: { severity: "warning", ignore: [] },
    })
    .describe("Severity and per-check ignore configuration"),
})

export type CliArgs = {
  format?: z.infer<typeof formatEnum> | undefined
  localePattern?: string | undefined
  srcPattern?: string | undefined
  ignorePatterns?: string[] | undefined
  ignoreKeys?: string[] | undefined
  ignoreMissingKeys?: string[] | undefined
  ignoreUnusedKeys?: string[] | undefined
  missingKeysSeverity?: z.infer<typeof severityEnum> | undefined
  unusedKeysSeverity?: z.infer<typeof severityEnum> | undefined
}

export type ConfigInput = z.input<typeof configSchema>
export type ConfigOutput = z.output<typeof configSchema>
