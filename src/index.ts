import { createDefineConfig } from "c12"
import type { ConfigInput } from "./config/schema.ts"

export const defineConfig = createDefineConfig<ConfigInput>()
