import { test, expect } from "vitest"
import { collectLocaleFile } from "../../src/collector/localeCollector.ts"

test("collects keys from .json", async () => {
  const result = await collectLocaleFile("test/fixtures/i18n/en.json")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.json",
    keys: ["hello", "nested.world", "nested.deep.key"],
  })
})

test("collects keys from .jsonc", async () => {
  const result = await collectLocaleFile("test/fixtures/i18n/en.jsonc")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.jsonc",
    keys: ["hello", "nested.world"],
  })
})

test("collects keys from .json5", async () => {
  const result = await collectLocaleFile("test/fixtures/i18n/en.json5")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.json5",
    keys: ["hello", "nested.world"],
  })
})

test("collects keys from .yaml", async () => {
  const result = await collectLocaleFile("test/fixtures/i18n/en.yaml")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.yaml",
    keys: ["hello", "nested.world"],
  })
})

test("collects keys from .yml", async () => {
  const result = await collectLocaleFile("test/fixtures/i18n/en.yml")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.yml",
    keys: ["hello", "nested.world"],
  })
})

test.each([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"])("collects keys from %s", async (ext) => {
  const result = await collectLocaleFile(`test/fixtures/i18n/en${ext}`)

  expect(result).toEqual({
    locale: "en",
    file: `test/fixtures/i18n/en${ext}`,
    keys: ["hello", "nested.world"],
  })
})

test("throws when .js file default export is not an object", async () => {
  await expect(collectLocaleFile("test/fixtures/i18n/invalid.js")).rejects.toThrow(
    "Language file test/fixtures/i18n/invalid.js is not an object",
  )
})

test("throws on unsupported file type", async () => {
  await expect(collectLocaleFile("test/fixtures/i18n/en.toml")).rejects.toThrow("Unsupported file type: .toml")
})

test("throws when file is not an object", async () => {
  await expect(collectLocaleFile("test/fixtures/i18n/invalid.json")).rejects.toThrow("is not an object")
})

test("throws on unsupported value type", async () => {
  await expect(collectLocaleFile("test/fixtures/i18n/badtype.json")).rejects.toThrow(
    'Invalid locale file test/fixtures/i18n/badtype.json: Unsupported value type "number" at key "count"',
  )
})
