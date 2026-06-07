import { z } from "zod"

const severityEnum = z.enum(["error", "warning", "off"])

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
          severity: severityEnum.default("error"),
          ignore: z.array(z.string().nonempty()).default([]),
        })
        .default({ severity: "error", ignore: [] }),
      unusedKeys: z
        .object({
          severity: severityEnum.default("warning"),
          ignore: z.array(z.string().nonempty()).default([]),
        })
        .default({ severity: "warning", ignore: [] }),
    })
    .default({
      missingKeys: { severity: "error", ignore: [] },
      unusedKeys: { severity: "warning", ignore: [] },
    }),
})
