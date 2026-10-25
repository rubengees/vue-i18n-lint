import { createDefineConfig } from "c12"
import type { ConfigInput } from "./config/schema.ts"

/**
 * Defines a type-safe vue-i18n-lint configuration.
 *
 * @example
 * ```ts
 * import { defineConfig } from "vue-i18n-lint"
 *
 * export default defineConfig({
 *   ignoreKeys: ["status.<dynamic>"],
 * })
 * ```
 */
export const defineConfig = createDefineConfig<ConfigInput>()
