import { test, expect } from "vitest"
import { collectLocaleFile } from "../../src/collector/localeCollector.ts"

test("collects keys from .json", () => {
  const result = collectLocaleFile("test/fixtures/i18n/en.json")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.json",
    keys: ["hello", "nested.world", "nested.deep.key"],
  })
})

test("collects keys from .jsonc", () => {
  const result = collectLocaleFile("test/fixtures/i18n/en.jsonc")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.jsonc",
    keys: ["hello", "nested.world"],
  })
})

test("collects keys from .json5", () => {
  const result = collectLocaleFile("test/fixtures/i18n/en.json5")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.json5",
    keys: ["hello", "nested.world"],
  })
})

test("collects keys from .yaml", () => {
  const result = collectLocaleFile("test/fixtures/i18n/en.yaml")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.yaml",
    keys: ["hello", "nested.world"],
  })
})

test("collects keys from .yml", () => {
  const result = collectLocaleFile("test/fixtures/i18n/en.yml")

  expect(result).toEqual({
    locale: "en",
    file: "test/fixtures/i18n/en.yml",
    keys: ["hello", "nested.world"],
  })
})

test("throws on unsupported file type", () => {
  expect(() => collectLocaleFile("test/fixtures/i18n/en.toml")).toThrow("Unsupported file type: .toml")
})

test("throws when file is not an object", () => {
  expect(() => collectLocaleFile("test/fixtures/i18n/invalid.json")).toThrow("is not an object")
})

test("throws on unsupported value type", () => {
  expect(() => collectLocaleFile("test/fixtures/i18n/badtype.json")).toThrow(
    'Unsupported value type "number" at key "count"',
  )
})
