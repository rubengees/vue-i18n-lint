import { createDefineConfig } from "c12"
import type { ConfigInput } from "./config/schema.ts"

export type VueI18nLintConfig = Omit<ConfigInput, "path">

export const defineConfig = createDefineConfig<VueI18nLintConfig>()
