import { z } from "zod"

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
          ignore: z.array(z.string().nonempty()).default([]),
        })
        .default({ ignore: [] }),
      unusedKeys: z
        .object({
          ignore: z.array(z.string().nonempty()).default([]),
        })
        .default({ ignore: [] }),
    })
    .default({ missingKeys: { ignore: [] }, unusedKeys: { ignore: [] } }),
})

export type Config = z.infer<typeof configSchema>
