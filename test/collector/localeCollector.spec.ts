import { resolve } from "node:path"
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

test("collects keys with non-string value types", async () => {
  const result = await collectLocaleFile("test/fixtures/locales/badtype.json")

  expect(result).toStrictEqual({
    locale: "badtype",
    file: "test/fixtures/locales/badtype.json",
    keys: [{ key: "count", type: "number" }],
    scope: "global",
  })
})

test("logs error and returns empty keys when .js file default export is not an object", async () => {
  const filePath = resolve("test/fixtures/locales/invalid.js")
  const result = await collectLocaleFile(filePath)

  expect(result).toStrictEqual({ locale: "invalid", file: filePath, keys: [], scope: "global" })
  expectErrorLogged("Failed to read locale file")
  expectErrorLogged("invalid.js")
  expectErrorLogged("Not an object")
})

test("logs error and returns empty keys when JSON file contains null", async () => {
  const filePath = resolve("test/fixtures/locales/null.json")
  const result = await collectLocaleFile(filePath)

  expect(result).toStrictEqual({ locale: "null", file: filePath, keys: [], scope: "global" })
  expectErrorLogged("Not an object")
})

test("logs error and returns empty keys when .js file throws on import", async () => {
  const filePath = resolve("test/fixtures/locales/throws.js")
  const result = await collectLocaleFile(filePath)

  expect(result).toStrictEqual({ locale: "throws", file: filePath, keys: [], scope: "global" })
  expectErrorLogged("Failed to read locale file")
  expectErrorLogged("throws.js")
})

test("logs error and returns empty keys when locale file does not exist", async () => {
  const filePath = resolve("test/fixtures/locales/does-not-exist.json")
  const result = await collectLocaleFile(filePath)

  expect(result).toStrictEqual({ locale: "does-not-exist", file: filePath, keys: [], scope: "global" })
  expectErrorLogged("Failed to read locale file")
  expectErrorLogged("does-not-exist.json")
})

test("logs error and returns empty keys on unsupported file type", async () => {
  const filePath = resolve("test/fixtures/locales/en.toml")
  const result = await collectLocaleFile(filePath)

  expect(result).toStrictEqual({ locale: "en", file: filePath, keys: [], scope: "global" })
  expectErrorLogged("Failed to parse locale")
  expectErrorLogged("Unsupported type: .toml")
})

test("logs error and returns empty keys when JSON file is not an object (string)", async () => {
  const filePath = resolve("test/fixtures/locales/invalid.json")
  const result = await collectLocaleFile(filePath)

  expect(result).toStrictEqual({ locale: "invalid", file: filePath, keys: [], scope: "global" })
  expectErrorLogged("Failed to parse locale")
  expectErrorLogged("Not an object")
})

test("logs error and returns empty keys when JSON file is an array", async () => {
  const filePath = resolve("test/fixtures/locales/array.json")
  const result = await collectLocaleFile(filePath)

  expect(result).toStrictEqual({ locale: "array", file: filePath, keys: [], scope: "global" })
  expectErrorLogged("Failed to parse locale")
  expectErrorLogged("Not an object")
})

test("logs error and returns empty keys when JSON file is malformed", async () => {
  const filePath = resolve("test/fixtures/locales/malformed.json")
  const result = await collectLocaleFile(filePath)

  expect(result).toStrictEqual({ locale: "malformed", file: filePath, keys: [], scope: "global" })
  expectErrorLogged("Failed to parse locale")
})
