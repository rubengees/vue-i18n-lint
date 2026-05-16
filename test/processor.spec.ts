import { basename } from "node:path"
import { expect, test } from "vitest"
import { processFiles } from "../src/processor.ts"
import type { FileKey, LocaleFile, SourceFile } from "../src/types.ts"

test("returns empty results when given no files and no keys", () => {
  expect(processFiles([], [])).toStrictEqual({ typeWarnings: [], missing: [], unused: [] })
})

test("returns empty results when all keys match", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "world"])]
  const srcFile = sourceFile([fileKey("hello"), fileKey("world")])

  expect(processFiles(localeFiles, [srcFile])).toStrictEqual({ typeWarnings: [], missing: [], unused: [] })
})

test("finds missing keys used in source but not in any locale file", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello"])]
  const srcFile = sourceFile([fileKey("hello"), fileKey("missing.key", "src/page.ts", 10, 4)])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.missing).toStrictEqual([
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
  expect(result.unused).toStrictEqual([])
})

test("finds unused keys defined in locale files but not used in source", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "orphan.key"])]
  const srcFile = sourceFile([fileKey("hello")])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([
    { key: "orphan.key", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
  ])
})

test("finds both missing and unused keys simultaneously", () => {
  const localeFiles = [localeFile("i18n/en.json", ["defined.key", "unused.key"])]
  const srcFile = sourceFile([fileKey("defined.key"), fileKey("missing.key", "src/comp.vue", 3, 2)])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.missing).toStrictEqual([
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

  expect(result.unused).toStrictEqual([
    { key: "unused.key", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
  ])
})

test("a key missing from some locales reports only the locales that lack it", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "only.in.en"]), localeFile("i18n/de.json", ["hello"])]
  const srcFile = sourceFile([fileKey("hello"), fileKey("only.in.en")])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.missing).toStrictEqual([
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

test("aggregates unused keys across all locale files into a single entry", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "stale"]), localeFile("i18n/de.json", ["hello", "stale"])]
  const srcFile = sourceFile([fileKey("hello")])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.unused).toStrictEqual([
    {
      key: "stale",
      files: [
        { locale: "en", file: "i18n/en.json", scope: "global" },
        { locale: "de", file: "i18n/de.json", scope: "global" },
      ],
    },
  ])
})

test("returns empty results when no locale files are given", () => {
  const srcFile = sourceFile([fileKey("hello"), fileKey("world")])

  expect(processFiles([], [srcFile])).toStrictEqual({ typeWarnings: [], missing: [], unused: [] })
})

test("marks all i18n keys as unused if no src files given", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "world"])]

  const result = processFiles(localeFiles, [])

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([
    { key: "hello", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
    { key: "world", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
  ])
})

test("same key used multiple times in source is aggregated into one missing entry", () => {
  const localeFiles = [localeFile("i18n/en.json", [])]
  const srcFile = sourceFile([fileKey("shared.key", "src/a.ts", 1, 0), fileKey("shared.key", "src/b.ts", 2, 0)])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.missing).toHaveLength(1)
  expect(result.missing[0]?.key).toBe("shared.key")
  expect(result.missing[0]?.sources.map((s) => s.file)).toStrictEqual(["src/a.ts", "src/b.ts"])
})

test("a locale key is not unused when a shorter source key is a prefix of it", () => {
  const localeFiles = [localeFile("i18n/en.json", ["aa.bb.0", "u.v.w.x.y.z"])]
  const srcFile = sourceFile([fileKey("aa.bb"), fileKey("u")])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.unused).toStrictEqual([])
})

test("a locale key is unused when source uses a sibling key, not a prefix", () => {
  const localeFiles = [localeFile("i18n/en.json", ["aa.bb.0", "aa.bb.1"])]
  const srcFile = sourceFile([fileKey("aa.bb.1")])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.unused).toStrictEqual([
    { key: "aa.bb.0", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
  ])
})

test("a source key is not missing when locale it is a prefix of a locale key", () => {
  const localeFiles = [localeFile("i18n/en.json", ["aa.bb.0"])]
  const srcFile = sourceFile([fileKey("aa.bb")])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.missing).toStrictEqual([])
})

test("a source key is missing when locale only has a sibling key", () => {
  const localeFiles = [localeFile("i18n/en.json", ["aa.bb.0"])]
  const srcFile = sourceFile([fileKey("aa.bb.1")])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.missing).toStrictEqual([expect.objectContaining({ key: "aa.bb.1" })])
})

test("a key defined in a local <i18n> block is not reported missing from global locales", () => {
  const globalLocaleFiles = [localeFile("i18n/en.json", ["global.key"])]
  const srcFile = sourceFile(
    [fileKey("global.key"), fileKey("local.key", "src/comp.vue")],
    [{ locale: "en", file: "src/comp.vue", keys: [{ key: "local.key", type: "string" }], scope: "local" }],
  )

  const result = processFiles(globalLocaleFiles, [srcFile])

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([])
})

test("a key used in a file with an <i18n> block but absent from both local and global is reported missing", () => {
  const globalLocaleFiles = [localeFile("i18n/en.json", ["global.key"])]
  const srcFile = sourceFile(
    [fileKey("missing.key", "src/comp.vue")],
    [{ locale: "en", file: "src/comp.vue", keys: [{ key: "local.key", type: "string" }], scope: "local" }],
  )

  const result = processFiles(globalLocaleFiles, [srcFile])

  expect(result.missing).toStrictEqual([expect.objectContaining({ key: "missing.key", locales: ["en"] })])
})

test("a local <i18n> key that is not used in its component is reported as unused", () => {
  const srcFile = sourceFile(
    [fileKey("other.key", "src/comp.vue")],
    [{ locale: "en", file: "src/comp.vue", keys: [{ key: "unused.local", type: "string" }], scope: "local" }],
  )

  const result = processFiles([], [srcFile])

  expect(result.unused).toStrictEqual([
    { key: "unused.local", files: [{ locale: "en", file: "src/comp.vue", scope: "local" }] },
  ])
})

test("a local <i18n> key used in its component is not reported as unused", () => {
  const srcFile = sourceFile(
    [fileKey("local.key", "src/comp.vue")],
    [{ locale: "en", file: "src/comp.vue", keys: [{ key: "local.key", type: "string" }], scope: "local" }],
  )

  expect(processFiles([], [srcFile])).toStrictEqual({ typeWarnings: [], missing: [], unused: [] })
})

test("a local <i18n> key is not counted towards another component", () => {
  const srcFile = sourceFile(
    [fileKey("local.key", "src/comp.vue")],
    [{ locale: "en", file: "src/comp.vue", keys: [{ key: "local.key", type: "string" }], scope: "local" }],
  )

  const srcFile2 = sourceFile([fileKey("local.key", "src/missing.vue")])

  const result = processFiles([], [srcFile, srcFile2])

  expect(result.missing).toStrictEqual([
    {
      key: "local.key",
      locales: ["en"],
      sources: [
        {
          file: "src/missing.vue",
          location: {
            end: { column: 2, line: 1 },
            start: { column: 1, line: 1 },
          },
        },
      ],
    },
  ])

  expect(result.unused).toStrictEqual([])
})

test("an unused local <i18n> key is reported as unused even if used in another component", () => {
  const srcFile = sourceFile([fileKey("unused.key", "src/comp.vue")])
  const srcFile2 = sourceFile(
    [],
    [{ locale: "en", file: "src/unused.vue", keys: [{ key: "unused.key", type: "string" }], scope: "local" }],
  )

  const result = processFiles([], [srcFile, srcFile2])

  expect(result.missing).toStrictEqual([
    {
      key: "unused.key",
      locales: ["en"],
      sources: [
        {
          file: "src/comp.vue",
          location: {
            end: { column: 2, line: 1 },
            start: { column: 1, line: 1 },
          },
        },
      ],
    },
  ])

  expect(result.unused).toStrictEqual([
    {
      key: "unused.key",
      files: [
        {
          locale: "en",
          file: "src/unused.vue",
          scope: "local",
        },
      ],
    },
  ])
})

test("a prefix source key is not reported missing when the <i18n> block has a matching leaf key", () => {
  const srcFile = sourceFile(
    [fileKey("local.key", "src/comp.vue")],
    [{ locale: "en", file: "src/comp.vue", keys: [{ key: "local.key.0", type: "string" }], scope: "local" }],
  )

  const result = processFiles([], [srcFile])

  expect(result.missing).toStrictEqual([])
})

test("a local <i18n> leaf key is not reported as unused when source uses a prefix of it", () => {
  const srcFile = sourceFile(
    [fileKey("local.key", "src/comp.vue")],
    [{ locale: "en", file: "src/comp.vue", keys: [{ key: "local.key.0", type: "string" }], scope: "local" }],
  )

  const result = processFiles([], [srcFile])

  expect(result.unused).toStrictEqual([])
})

test("returns no typeWarnings when all keys have string type", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "world"])]
  const srcFile = sourceFile([fileKey("hello"), fileKey("world")])

  const result = processFiles(localeFiles, [srcFile])

  expect(result.typeWarnings).toStrictEqual([])
})

test("returns typeWarnings for keys with non-string types", () => {
  const enFile: LocaleFile = {
    locale: "en",
    file: "i18n/en.json",
    scope: "global",
    keys: [
      { key: "count", type: "number" },
      { key: "active", type: "boolean" },
      { key: "label", type: "string" },
    ],
  }

  const deFile: LocaleFile = {
    locale: "de",
    file: "i18n/de.json",
    scope: "global",
    keys: [{ key: "count", type: "number" }],
  }

  const srcFile = sourceFile([fileKey("label"), fileKey("missing")])

  const result = processFiles([enFile, deFile], [srcFile])

  expect(result.typeWarnings).toStrictEqual([
    { key: "count", locale: "en", file: "i18n/en.json", type: "number" },
    { key: "active", locale: "en", file: "i18n/en.json", type: "boolean" },
    { key: "count", locale: "de", file: "i18n/de.json", type: "number" },
  ])

  expect(result.missing).toHaveLength(2)
  expect(result.unused).toHaveLength(2)
})

function localeFile(file: string, keys: string[]): LocaleFile {
  return { locale: basename(file, ".json"), file, keys: keys.map((key) => ({ key, type: "string" })), scope: "global" }
}

function sourceFile(keys: FileKey[], localeFiles: LocaleFile[] = []): SourceFile {
  return { keys, localeFiles }
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
