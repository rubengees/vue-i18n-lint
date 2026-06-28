import { z } from "zod"

export const severityEnum = z.enum(["error", "warning", "off"])
export const formatEnum = z.enum(["text", "json", "toon"])

const checkSchema = (defaultSeverity: z.infer<typeof severityEnum>) =>
  z
    .union([
      z.object({
        severity: severityEnum.default(defaultSeverity),
        ignore: z.array(z.string().nonempty()).default([]),
      }),
      z.literal(false).transform(() => ({ severity: "off" as const, ignore: [] as string[] })),
    ])
    .default({ severity: defaultSeverity, ignore: [] })

export const configSchema = z.object({
  format: formatEnum.default("text"),
  localePattern: z.string().nonempty().default("**/locales/*.json"),
  srcPattern: z.string().nonempty().default("**/*.{ts,cts,mts,js,cjs,mjs,vue}"),
  ignorePatterns: z.array(z.string().nonempty()).default([]),
  ignoreKeys: z.array(z.string().nonempty()).default([]),
  checks: z
    .object({
      missingKeys: checkSchema("error"),
      unusedKeys: checkSchema("warning"),
    })
    .default({
      missingKeys: { severity: "error", ignore: [] },
      unusedKeys: { severity: "warning", ignore: [] },
    }),
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
