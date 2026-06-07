import { createDefineConfig } from "c12"
import type { z } from "zod"
import type { configSchema } from "./config/schema.ts"

export type VueI18nLintConfig = Omit<z.input<typeof configSchema>, "path">

export const defineConfig = createDefineConfig<VueI18nLintConfig>()
