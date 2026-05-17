import { resolve } from "node:path"
import { expect, test } from "vitest"
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

test("collects keys with non-string value types", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/badtype.json")

  expect(result).toStrictEqual({
    locale: "badtype",
    file: "test/fixtures/locales/badtype.json",
    keys: [{ key: "count", type: "number" }],
    scope: "global",
  })
})

test("throws when .js file default export is not an object", async () => {
  const filePath = resolve("test/fixtures/locales/invalid.js")
  await expect(collectLocaleFile(filePath)).rejects.toThrow("Locale module default export is not an object")
})

test("throws when JSON file contains null", async () => {
  const filePath = resolve("test/fixtures/locales/null.json")
  await expect(collectLocaleFile(filePath)).rejects.toThrow("Locale content is not an object")
})

test("throws when .js file throws on import", async () => {
  const filePath = resolve("test/fixtures/locales/throws.js")
  await expect(collectLocaleFile(filePath)).rejects.toThrow("Failed to import locale module")
})

test("throws when locale file does not exist", async () => {
  const filePath = resolve("test/fixtures/locales/does-not-exist.json")
  await expect(collectLocaleFile(filePath)).rejects.toThrow(/ENOENT.*does-not-exist\.json/)
})

test("throws on unsupported file type", async () => {
  const filePath = resolve("test/fixtures/locales/en.toml")
  await expect(collectLocaleFile(filePath)).rejects.toThrow("Unsupported locale type: .toml")
})

test("throws when JSON file is not an object (string)", async () => {
  const filePath = resolve("test/fixtures/locales/invalid.json")
  await expect(collectLocaleFile(filePath)).rejects.toThrow("Locale content is not an object")
})

test("throws when JSON file is an array", async () => {
  const filePath = resolve("test/fixtures/locales/array.json")
  await expect(collectLocaleFile(filePath)).rejects.toThrow("Locale content is not an object")
})

test("throws when JSON file is malformed", async () => {
  const filePath = resolve("test/fixtures/locales/malformed.json")
  await expect(collectLocaleFile(filePath)).rejects.toThrow("Failed to parse locale content")
})
