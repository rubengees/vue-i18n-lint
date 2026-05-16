import { test, expect } from "vitest"
import { collectLocaleFile } from "../../src/collector/localeCollector.ts"

test("collects keys from .json", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.json")

  expect(result).toStrictEqual({
    locale: "en",
    file: "test/fixtures/locales/en.json",
    keys: [
      { key: "hello", type: "string" },
      { key: "nested.world", type: "string" },
      { key: "nested.deep.key", type: "string" },
    ],
    scope: "global",
  })
})

test("collects keys from .jsonc", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.jsonc")

  expect(result).toStrictEqual({
    locale: "en",
    file: "test/fixtures/locales/en.jsonc",
    keys: [
      { key: "hello", type: "string" },
      { key: "nested.world", type: "string" },
    ],
    scope: "global",
  })
})

test("collects keys from .json5", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.json5")

  expect(result).toStrictEqual({
    locale: "en",
    file: "test/fixtures/locales/en.json5",
    keys: [
      { key: "hello", type: "string" },
      { key: "nested.world", type: "string" },
    ],
    scope: "global",
  })
})

test("collects keys from .yaml", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.yaml")

  expect(result).toStrictEqual({
    locale: "en",
    file: "test/fixtures/locales/en.yaml",
    keys: [
      { key: "hello", type: "string" },
      { key: "nested.world", type: "string" },
    ],
    scope: "global",
  })
})

test("collects keys from .yml", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.yml")

  expect(result).toStrictEqual({
    locale: "en",
    file: "test/fixtures/locales/en.yml",
    keys: [
      { key: "hello", type: "string" },
      { key: "nested.world", type: "string" },
    ],
    scope: "global",
  })
})

test.each([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"])("collects keys from %s", async (ext) => {
  const result = await collectLocaleFile(`test/fixtures/locales/en${ext}`)

  expect(result).toStrictEqual({
    locale: "en",
    file: `test/fixtures/locales/en${ext}`,
    keys: [
      { key: "hello", type: "string" },
      { key: "nested.world", type: "string" },
    ],
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

test("collects keys with non-string value types", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/badtype.json")

  expect(result).toStrictEqual({
    locale: "badtype",
    file: "test/fixtures/locales/badtype.json",
    keys: [{ key: "count", type: "number" }],
    scope: "global",
  })
})
