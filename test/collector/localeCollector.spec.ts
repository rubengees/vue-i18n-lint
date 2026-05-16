import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { collectLocaleFile } from "../../src/collector/localeCollector.ts"
import { expectErrorLogged } from "../helpers.ts"

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

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

test("logs error and returns empty keys when .js file default export is not an object", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/invalid.js")

  expect(result.keys).toStrictEqual([])
  expectErrorLogged("invalid.js")
})

test("logs error and returns empty keys on unsupported file type", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/en.toml")

  expect(result.keys).toStrictEqual([])
  expectErrorLogged("Unsupported file type: .toml")
})

test("logs error and returns empty keys when file is not an object", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/invalid.json")

  expect(result.keys).toStrictEqual([])
  expectErrorLogged("invalid.json")
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
