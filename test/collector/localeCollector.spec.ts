import { test, expect } from "vitest"
import { collectLocaleFile } from "../../src/collector/localeCollector.ts"

test("collects keys from .json", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.json")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/locales/en.json",
    keys: ["hello", "nested.world", "nested.deep.key"],
    scope: "global",
  })
})

test("collects keys from .jsonc", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.jsonc")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/locales/en.jsonc",
    keys: ["hello", "nested.world"],
    scope: "global",
  })
})

test("collects keys from .json5", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.json5")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/locales/en.json5",
    keys: ["hello", "nested.world"],
    scope: "global",
  })
})

test("collects keys from .yaml", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.yaml")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/locales/en.yaml",
    keys: ["hello", "nested.world"],
    scope: "global",
  })
})

test("collects keys from .yml", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.yml")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/locales/en.yml",
    keys: ["hello", "nested.world"],
    scope: "global",
  })
})

test.each([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"])("collects keys from %s", async (ext) => {
  const result = await collectLocaleFile(`test/fixtures/locales/en${ext}`)

  expect(result).toEqual({
    locale: "en",
    file: `test/fixtures/locales/en${ext}`,
    keys: ["hello", "nested.world"],
    scope: "global",
  })
})

test("throws when .js file default export is not an object", async () => {
  await expect(collectLocaleFile("test/fixtures/locales/invalid.js")).rejects.toThrow(
    "Language file test/fixtures/locales/invalid.js is not an object",
  )
})

test("throws on unsupported file type", async () => {
  await expect(collectLocaleFile("test/fixtures/locales/en.toml")).rejects.toThrow("Unsupported file type: .toml")
})

test("throws when file is not an object", async () => {
  await expect(collectLocaleFile("test/fixtures/locales/invalid.json")).rejects.toThrow("is not an object")
})

test("throws on unsupported value type", async () => {
  await expect(collectLocaleFile("test/fixtures/locales/badtype.json")).rejects.toThrow(
    'Invalid locale file test/fixtures/locales/badtype.json: Unsupported value type "number" at key "count"',
  )
})
