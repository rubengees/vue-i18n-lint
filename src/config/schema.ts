import { z } from "zod"

export enum Severity {
  Error = "error",
  Warning = "warning",
  Off = "off",
}

const severityEnum = z.enum(Severity)

export const configSchema = z.object({
  path: z.string().nonempty(),
  localePattern: z.string().nonempty().default("**/locales/*.json"),
  srcPattern: z.string().nonempty().default("**/*.{ts,cts,mts,js,cjs,mjs,vue}"),
  ignorePatterns: z.array(z.string().nonempty()).default([]),
  ignoreKeys: z.array(z.string().nonempty()).default([]),
  checks: z
    .object({
      missingKeys: z
        .object({
          severity: severityEnum.default(Severity.Error),
          ignore: z.array(z.string().nonempty()).default([]),
        })
        .default({ severity: Severity.Error, ignore: [] }),
      unusedKeys: z
        .object({
          severity: severityEnum.default(Severity.Warning),
          ignore: z.array(z.string().nonempty()).default([]),
        })
        .default({ severity: Severity.Warning, ignore: [] }),
    })
    .default({
      missingKeys: { severity: Severity.Error, ignore: [] },
      unusedKeys: { severity: Severity.Warning, ignore: [] },
    }),
})

export type Config = z.infer<typeof configSchema>
