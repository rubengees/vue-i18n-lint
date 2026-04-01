import { createDefineConfig } from "c12"
import type { Config } from "./config/schema.ts"

export type VueI18nLintConfig = Partial<Omit<Config, "path">>

export const defineConfig = createDefineConfig<VueI18nLintConfig>()
