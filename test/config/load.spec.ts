import { resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { loadVueI18nLintConfig } from "../../src/config/load.ts"

const FIXTURES = resolve("test/fixtures/config")

describe("loadVueI18nLintConfig", () => {
  describe("defaults", () => {
    test("uses cwd as path when none provided", async () => {
      const config = await loadVueI18nLintConfig()

      expect(config.path).toStrictEqual(process.cwd())
    })

    test("applies default localePattern, srcPattern, and ignorePatterns when no config file exists", async () => {
      const config = await loadVueI18nLintConfig({ path: resolve(FIXTURES, "no-config") })

      expect(config.localePattern).toStrictEqual("**/locales/*.json")
      expect(config.srcPattern).toStrictEqual("**/*.{ts,cts,mts,js,cjs,mjs,vue}")
      expect(config.ignorePatterns).toStrictEqual([])
    })
  })

  describe("file formats", () => {
    test.each(["js", "ts", "yaml", "json"])("reads vue-i18n-lint.config.%s", async (ext) => {
      const config = await loadVueI18nLintConfig({ path: resolve(FIXTURES, ext) })

      expect(config.localePattern).toStrictEqual("custom/locales/**/*.json")
      expect(config.srcPattern).toStrictEqual("custom/src/**/*.ts")
      expect(config.ignorePatterns).toStrictEqual(["custom/node_modules/**"])
    })
  })

  describe("cli overrides", () => {
    test("cli params override config file values", async () => {
      const config = await loadVueI18nLintConfig({
        path: resolve(FIXTURES, "js"),
        localePattern: "cli/**/*.json",
        srcPattern: "src/**/*.ts",
        ignorePatterns: "cli/**",
      })

      expect(config.localePattern).toStrictEqual("cli/**/*.json")
      expect(config.srcPattern).toStrictEqual("src/**/*.ts")
      expect(config.ignorePatterns).toStrictEqual(["cli/**"])
    })

    test("file config values are preserved when cli does not override them", async () => {
      const config = await loadVueI18nLintConfig({ path: resolve(FIXTURES, "js") })
      expect(config.localePattern).toStrictEqual("custom/locales/**/*.json")
      expect(config.srcPattern).toStrictEqual("custom/src/**/*.ts")
      expect(config.ignorePatterns).toStrictEqual(["custom/node_modules/**"])
    })

    test("parses comma-separated cli ignorePatterns, trims whitespace and drops empty entries", async () => {
      const config = await loadVueI18nLintConfig({
        path: resolve(FIXTURES, "no-config"),
        ignorePatterns: " a/** ,, b/** ",
      })

      expect(config.ignorePatterns).toStrictEqual(["a/**", "b/**"])
    })
  })

  describe("validation", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {})
      vi.spyOn(process, "exit").mockImplementation(vi.fn<(code?: number | string | null) => never>())
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    test("throws when cli localePattern is empty", async () => {
      expect(await loadVueI18nLintConfig({ localePattern: "" })).toBeUndefined()
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    test("throws when cli srcPattern is empty", async () => {
      expect(await loadVueI18nLintConfig({ srcPattern: "" })).toBeUndefined()
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    test("throws when config file has an empty string in ignorePatterns", async () => {
      expect(await loadVueI18nLintConfig({ path: resolve(FIXTURES, "invalid") })).toBeUndefined()
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })
})
