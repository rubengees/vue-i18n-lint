import { basename } from "node:path"
import { test, expect } from "vitest"
import { processFiles } from "../src/processor.ts"
import type { FileKey, LocaleFile } from "../src/types.ts"

test("returns empty results when given no files and no keys", () => {
  expect(processFiles([], [])).toEqual({ missing: [], unused: [] })
})

test("returns empty results when all keys match", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "world"])]
  const srcKeys = [fileKey("hello"), fileKey("world")]

  expect(processFiles(localeFiles, srcKeys)).toEqual({ missing: [], unused: [] })
})

test("finds missing keys used in source but not in any i18n file", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello"])]
  const srcKeys = [fileKey("hello"), fileKey("missing.key", "src/page.ts", 10, 4)]

  const result = processFiles(localeFiles, srcKeys)

  expect(result.missing).toEqual([
    {
      key: "missing.key",
      locales: ["en"],
      sources: [
        expect.objectContaining({
          file: "src/page.ts",
          location: { start: { line: 10, column: 4 }, end: { line: 10, column: 5 } },
        }),
      ],
    },
  ])
  expect(result.unused).toEqual([])
})

test("finds unused keys defined in i18n files but not used in source", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "orphan.key"])]
  const srcKeys = [fileKey("hello")]

  const result = processFiles(localeFiles, srcKeys)

  expect(result.missing).toEqual([])
  expect(result.unused).toEqual([{ key: "orphan.key", files: [{ locale: "en", file: "i18n/en.json" }] }])
})

test("finds both missing and unused keys simultaneously", () => {
  const localeFiles = [localeFile("i18n/en.json", ["defined.key", "unused.key"])]
  const srcKeys = [fileKey("defined.key"), fileKey("missing.key", "src/comp.vue", 3, 2)]

  const result = processFiles(localeFiles, srcKeys)

  expect(result.missing).toEqual([
    {
      key: "missing.key",
      locales: ["en"],
      sources: [
        expect.objectContaining({
          file: "src/comp.vue",
          location: { start: { line: 3, column: 2 }, end: { line: 3, column: 3 } },
        }),
      ],
    },
  ])
  expect(result.unused).toEqual([{ key: "unused.key", files: [{ locale: "en", file: "i18n/en.json" }] }])
})

test("a key missing from some locales reports only the locales that lack it", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "only.in.en"]), localeFile("i18n/de.json", ["hello"])]
  const srcKeys = [fileKey("hello"), fileKey("only.in.en")]

  const result = processFiles(localeFiles, srcKeys)

  expect(result.missing).toEqual([
    {
      key: "only.in.en",
      locales: ["de"],
      sources: [
        expect.objectContaining({
          file: "src/app.ts",
          location: { start: { line: 1, column: 1 }, end: { line: 1, column: 2 } },
        }),
      ],
    },
  ])
})

test("aggregates unused keys across all i18n files into a single entry", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "stale"]), localeFile("i18n/de.json", ["hello", "stale"])]
  const srcKeys = [fileKey("hello")]

  const result = processFiles(localeFiles, srcKeys)

  expect(result.unused).toEqual([
    {
      key: "stale",
      files: [
        { locale: "en", file: "i18n/en.json" },
        { locale: "de", file: "i18n/de.json" },
      ],
    },
  ])
})

test("returns empty results when no i18n files are given", () => {
  const srcKeys = [fileKey("hello"), fileKey("world")]

  expect(processFiles([], srcKeys)).toEqual({ missing: [], unused: [] })
})

test("marks all i18n keys as unused if no src files given", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "world"])]

  const result = processFiles(localeFiles, [])

  expect(result.missing).toEqual([])
  expect(result.unused).toEqual([
    { key: "hello", files: [{ locale: "en", file: "i18n/en.json" }] },
    { key: "world", files: [{ locale: "en", file: "i18n/en.json" }] },
  ])
})

test("same key used multiple times in source is aggregated into one missing entry", () => {
  const localeFiles = [localeFile("i18n/en.json", [])]
  const srcKeys = [fileKey("shared.key", "src/a.ts", 1, 0), fileKey("shared.key", "src/b.ts", 2, 0)]

  const result = processFiles(localeFiles, srcKeys)

  expect(result.missing).toHaveLength(1)
  expect(result.missing[0]?.key).toBe("shared.key")
  expect(result.missing[0]?.sources.map((s) => s.file)).toEqual(["src/a.ts", "src/b.ts"])
})

function localeFile(file: string, keys: string[]): LocaleFile {
  return { locale: basename(file, ".json"), file, keys }
}

function fileKey(
  key: string,
  file = "src/app.ts",
  line = 1,
  column = 1,
  endLine = line,
  endColumn = column + 1,
): FileKey {
  return { key, file, location: { start: { line, column }, end: { line: endLine, column: endColumn } } }
}
