import { resolve } from "node:path"
import { describe, expect, test } from "vitest"
import { loadVueI18nLintConfig } from "../../src/config/load.ts"
import type { CliArgs } from "../../src/config/schema.ts"

const FIXTURES = resolve("test/fixtures/config")

describe("loadVueI18nLintConfig", () => {
  describe("defaults", () => {
    test("applies default localePattern, srcPattern, and ignorePatterns when no config file exists", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "no-config"))

      expect(config.localePattern).toStrictEqual("**/locales/*.json")
      expect(config.srcPattern).toStrictEqual("**/*.{ts,cts,mts,js,cjs,mjs,vue}")
      expect(config.ignorePatterns).toStrictEqual([])
    })
  })

  describe("file formats", () => {
    test.each(["js", "ts", "yaml", "json"])("reads vue-i18n-lint.config.%s", async (ext) => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, ext))

      expect(config.localePattern).toStrictEqual("custom/locales/**/*.json")
      expect(config.srcPattern).toStrictEqual("custom/src/**/*.ts")
      expect(config.ignorePatterns).toStrictEqual(["custom/node_modules/**"])
    })
  })

  describe("transform", () => {
    test("allows false for checks and transforms config", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "checks-false"))

      expect(config.checks.missingKeys.severity).toStrictEqual("off")
      expect(config.checks.unusedKeys.severity).toStrictEqual("off")
    })
  })

  describe("cli overrides", () => {
    test("cli params override config file values", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "js"), {
        localePattern: "cli/**/*.json",
        srcPattern: "src/**/*.ts",
        ignorePatterns: ["cli/**"],
      })

      expect(config.localePattern).toStrictEqual("cli/**/*.json")
      expect(config.srcPattern).toStrictEqual("src/**/*.ts")
      expect(config.ignorePatterns).toStrictEqual(["cli/**"])
    })

    test("file config values are preserved when cli does not override them", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "js"))
      expect(config.localePattern).toStrictEqual("custom/locales/**/*.json")
      expect(config.srcPattern).toStrictEqual("custom/src/**/*.ts")
      expect(config.ignorePatterns).toStrictEqual(["custom/node_modules/**"])
    })

    test("accepts ignorePatterns", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "no-config"), {
        ignorePatterns: ["a/**", "b/**"],
      })

      expect(config.ignorePatterns).toStrictEqual(["a/**", "b/**"])
    })

    test("accepts ignoreKeys", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "no-config"), {
        ignoreKeys: ["foo", "bar"],
      })

      expect(config.ignoreKeys).toStrictEqual(["foo", "bar"])
    })

    test("accepts ignoreMissingKeys into checks.missingKeys.ignore", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "no-config"), {
        ignoreMissingKeys: ["foo", "bar"],
      })

      expect(config.checks.missingKeys.ignore).toStrictEqual(["foo", "bar"])
      expect(config.checks.unusedKeys.ignore).toStrictEqual([])
    })

    test("accepts ignoreUnusedKeys into checks.unusedKeys.ignore", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "no-config"), {
        ignoreUnusedKeys: ["foo", "bar"],
      })

      expect(config.checks.missingKeys.ignore).toStrictEqual([])
      expect(config.checks.unusedKeys.ignore).toStrictEqual(["foo", "bar"])
    })

    test("cli ignoreMissingKeys and ignoreUnusedKeys can be set independently", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "no-config"), {
        ignoreMissingKeys: ["missing.key"],
        ignoreUnusedKeys: ["unused.key"],
      })

      expect(config.checks.missingKeys.ignore).toStrictEqual(["missing.key"])
      expect(config.checks.unusedKeys.ignore).toStrictEqual(["unused.key"])
    })

    test("cli checks override file config checks, non-overridden checks are preserved", async () => {
      const config = await loadVueI18nLintConfig(resolve(FIXTURES, "js"), {
        ignoreMissingKeys: ["cli.key"],
      })

      expect(config.checks.missingKeys.ignore).toStrictEqual(["cli.key"])
      expect(config.checks.unusedKeys.ignore).toStrictEqual([])
    })
  })

  describe("validation", () => {
    test("throws when cli localePattern is empty", async () => {
      await expect(loadVueI18nLintConfig(process.cwd(), { localePattern: "" })).rejects.toThrow(
        /Failed to load config[\s\S]*localePattern/,
      )
    })

    test("throws when cli srcPattern is empty", async () => {
      await expect(loadVueI18nLintConfig(process.cwd(), { srcPattern: "" })).rejects.toThrow(
        /Failed to load config[\s\S]*srcPattern/,
      )
    })

    test("throws when cli ignoreKeys contains an empty string", async () => {
      await expect(loadVueI18nLintConfig(process.cwd(), { ignoreKeys: [""] })).rejects.toThrow(
        /Failed to load config[\s\S]*ignoreKeys/,
      )
    })

    test("throws when cli ignoreMissingKeys contains an empty string", async () => {
      await expect(loadVueI18nLintConfig(process.cwd(), { ignoreMissingKeys: [""] })).rejects.toThrow(
        /Failed to load config[\s\S]*missingKeys.*ignore/,
      )
    })

    test("throws when cli ignoreUnusedKeys contains an empty string", async () => {
      await expect(loadVueI18nLintConfig(process.cwd(), { ignoreUnusedKeys: [""] })).rejects.toThrow(
        /Failed to load config[\s\S]*unusedKeys.*ignore/,
      )
    })

    test("throws when cli missingKeysSeverity is invalid", async () => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const invalidArgs = { missingKeysSeverity: "invalid" } as unknown as CliArgs

      await expect(loadVueI18nLintConfig(process.cwd(), invalidArgs)).rejects.toThrow(
        /Failed to load config[\s\S]*missingKeys/,
      )
    })

    test("throws when cli unusedKeysSeverity is invalid", async () => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const invalidArgs = { unusedKeysSeverity: "invalid" } as unknown as CliArgs

      await expect(loadVueI18nLintConfig(process.cwd(), invalidArgs)).rejects.toThrow(
        /Failed to load config[\s\S]*unusedKeys/,
      )
    })

    test("throws when cli format is invalid", async () => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const invalidArgs = { format: "xml" } as unknown as CliArgs

      await expect(loadVueI18nLintConfig(process.cwd(), invalidArgs)).rejects.toThrow(
        /Failed to load config[\s\S]*format/,
      )
    })

    test("throws when config file has an empty string in ignorePatterns", async () => {
      await expect(loadVueI18nLintConfig(resolve(FIXTURES, "invalid"))).rejects.toThrow(
        /Failed to load config[\s\S]*ignorePatterns/,
      )
    })
  })

  describe("error handling", () => {
    test("throws when config file fails to load", async () => {
      await expect(loadVueI18nLintConfig(resolve(FIXTURES, "error"))).rejects.toThrow("Failed to load config file")
    })
  })
})
