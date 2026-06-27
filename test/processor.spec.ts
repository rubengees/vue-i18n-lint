import { basename } from "node:path"
import { expect, test } from "vitest"
import type { ConfigOutput } from "../src/config/schema.ts"
import { processFiles } from "../src/processor.ts"
import type { DynamicKey, FileKey, LocaleFile, SourceFile } from "../src/types.ts"
import { DYNAMIC_PART } from "../src/types.ts"

test("returns empty results when given no files and no keys", () => {
  expect(processFiles([], [], config())).toStrictEqual({ typeWarnings: [], missing: [], unused: [] })
})

test("returns empty results when all keys match", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "world"])]
  const srcFile = sourceFile([fileKey("hello"), fileKey("world")])

  expect(processFiles(localeFiles, [srcFile], config())).toStrictEqual({
    typeWarnings: [],
    missing: [],
    unused: [],
  })
})

test("finds missing keys used in source but not in any locale file", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello"])]
  const srcFile = sourceFile([fileKey("hello"), fileKey("missing.key", "src/page.ts", 10, 4)])

  const result = processFiles(localeFiles, [srcFile], config())

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

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([
    { key: "orphan.key", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
  ])
})

test("finds both missing and unused keys simultaneously", () => {
  const localeFiles = [localeFile("i18n/en.json", ["defined.key", "unused.key"])]
  const srcFile = sourceFile([fileKey("defined.key"), fileKey("missing.key", "src/comp.vue", 3, 2)])

  const result = processFiles(localeFiles, [srcFile], config())

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

  const result = processFiles(localeFiles, [srcFile], config())

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

  const result = processFiles(localeFiles, [srcFile], config())

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

  expect(processFiles([], [srcFile], config())).toStrictEqual({ typeWarnings: [], missing: [], unused: [] })
})

test("marks all i18n keys as unused if no src files given", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "world"])]

  const result = processFiles(localeFiles, [], config())

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([
    { key: "hello", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
    { key: "world", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
  ])
})

test("same key used multiple times in source is aggregated into one missing entry", () => {
  const localeFiles = [localeFile("i18n/en.json", [])]
  const srcFile = sourceFile([fileKey("shared.key", "src/a.ts", 1, 0), fileKey("shared.key", "src/b.ts", 2, 0)])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.missing).toHaveLength(1)
  expect(result.missing?.[0]?.key).toStrictEqual("shared.key")
  expect(result.missing?.[0]?.sources.map((s) => s.file)).toStrictEqual(["src/a.ts", "src/b.ts"])
})

test("a locale key is not unused when a shorter source key is a prefix of it", () => {
  const localeFiles = [localeFile("i18n/en.json", ["aa.bb.0", "u.v.w.x.y.z"])]
  const srcFile = sourceFile([fileKey("aa.bb"), fileKey("u")])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.unused).toStrictEqual([])
})

test("a locale key is unused when source uses a sibling key, not a prefix", () => {
  const localeFiles = [localeFile("i18n/en.json", ["aa.bb.0", "aa.bb.1"])]
  const srcFile = sourceFile([fileKey("aa.bb.1")])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.unused).toStrictEqual([
    { key: "aa.bb.0", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
  ])
})

test("a source key is not missing when locale it is a prefix of a locale key", () => {
  const localeFiles = [localeFile("i18n/en.json", ["aa.bb.0"])]
  const srcFile = sourceFile([fileKey("aa.bb")])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.missing).toStrictEqual([])
})

test("a source key is missing when locale only has a sibling key", () => {
  const localeFiles = [localeFile("i18n/en.json", ["aa.bb.0"])]
  const srcFile = sourceFile([fileKey("aa.bb.1")])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.missing).toStrictEqual([expect.objectContaining({ key: "aa.bb.1" })])
})

test("a key defined in a local <i18n> block is not reported missing from global locales", () => {
  const globalLocaleFiles = [localeFile("i18n/en.json", ["global.key"])]
  const srcFile = sourceFile(
    [fileKey("global.key"), fileKey("local.key", "src/comp.vue")],
    [
      {
        locale: "en",
        file: "src/comp.vue",
        rawData: { local: { key: "test" } },
        keys: [{ key: "local.key", type: "string" }],
        scope: "local",
      },
    ],
  )

  const result = processFiles(globalLocaleFiles, [srcFile], config())

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([])
})

test("a key used in a file with an <i18n> block but absent from both local and global is reported missing", () => {
  const globalLocaleFiles = [localeFile("i18n/en.json", ["global.key"])]
  const srcFile = sourceFile(
    [fileKey("missing.key", "src/comp.vue")],
    [
      {
        locale: "en",
        file: "src/comp.vue",
        rawData: { local: { key: "test" } },
        keys: [{ key: "local.key", type: "string" }],
        scope: "local",
      },
    ],
  )

  const result = processFiles(globalLocaleFiles, [srcFile], config())

  expect(result.missing).toStrictEqual([expect.objectContaining({ key: "missing.key", locales: ["en"] })])
})

test("a local <i18n> key that is not used in its component is reported as unused", () => {
  const srcFile = sourceFile(
    [fileKey("other.key", "src/comp.vue")],
    [
      {
        locale: "en",
        file: "src/comp.vue",
        rawData: { unused: { local: "test" } },
        keys: [{ key: "unused.local", type: "string" }],
        scope: "local",
      },
    ],
  )

  const result = processFiles([], [srcFile], config())

  expect(result.unused).toStrictEqual([
    { key: "unused.local", files: [{ locale: "en", file: "src/comp.vue", scope: "local" }] },
  ])
})

test("a local <i18n> key used in its component is not reported as unused", () => {
  const srcFile = sourceFile(
    [fileKey("local.key", "src/comp.vue")],
    [
      {
        locale: "en",
        file: "src/comp.vue",
        rawData: { local: { key: "test" } },
        keys: [{ key: "local.key", type: "string" }],
        scope: "local",
      },
    ],
  )

  expect(processFiles([], [srcFile], config())).toStrictEqual({ typeWarnings: [], missing: [], unused: [] })
})

test("a local <i18n> key is not counted towards another component", () => {
  const srcFile = sourceFile(
    [fileKey("local.key", "src/comp.vue")],
    [
      {
        locale: "en",
        file: "src/comp.vue",
        rawData: { local: { key: "test" } },
        keys: [{ key: "local.key", type: "string" }],
        scope: "local",
      },
    ],
  )

  const srcFile2 = sourceFile([fileKey("local.key", "src/missing.vue")])

  const result = processFiles([], [srcFile, srcFile2], config())

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
    [
      {
        locale: "en",
        file: "src/unused.vue",
        rawData: { unused: { key: "test" } },
        keys: [{ key: "unused.key", type: "string" }],
        scope: "local",
      },
    ],
  )

  const result = processFiles([], [srcFile, srcFile2], config())

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
    [
      {
        locale: "en",
        file: "src/comp.vue",
        rawData: { local: { key: { "0": "test" } } },
        keys: [{ key: "local.key.0", type: "string" }],
        scope: "local",
      },
    ],
  )

  const result = processFiles([], [srcFile], config())

  expect(result.missing).toStrictEqual([])
})

test("a local <i18n> leaf key is not reported as unused when source uses a prefix of it", () => {
  const srcFile = sourceFile(
    [fileKey("local.key", "src/comp.vue")],
    [
      {
        locale: "en",
        file: "src/comp.vue",
        rawData: { local: { key: { "0": "test" } } },
        keys: [{ key: "local.key.0", type: "string" }],
        scope: "local",
      },
    ],
  )

  const result = processFiles([], [srcFile], config())

  expect(result.unused).toStrictEqual([])
})

test("returns no typeWarnings when all keys have string type", () => {
  const localeFiles = [localeFile("i18n/en.json", ["hello", "world"])]
  const srcFile = sourceFile([fileKey("hello"), fileKey("world")])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.typeWarnings).toStrictEqual([])
})

test("returns typeWarnings for keys with non-string types", () => {
  const enFile: LocaleFile = {
    locale: "en",
    file: "i18n/en.json",
    scope: "global",
    rawData: {
      count: 1,
      active: true,
      label: "test",
    },
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
    rawData: { count: 1 },
    keys: [{ key: "count", type: "number" }],
  }

  const srcFile = sourceFile([fileKey("label"), fileKey("missing")])

  const result = processFiles([enFile, deFile], [srcFile], config())

  expect(result.typeWarnings).toStrictEqual([
    { key: "count", locale: "en", file: "i18n/en.json", type: "number" },
    { key: "active", locale: "en", file: "i18n/en.json", type: "boolean" },
    { key: "count", locale: "de", file: "i18n/de.json", type: "number" },
  ])

  expect(result.missing).toHaveLength(2)
  expect(result.unused).toHaveLength(2)
})

test("a dynamic key is reported missing when no locale key matches the pattern", () => {
  const localeFiles = [localeFile("i18n/en.json", ["other.key"])]
  const srcFile = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART])])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.missing).toStrictEqual([
    {
      key: "status.<dynamic>",
      locales: ["en"],
      sources: [expect.objectContaining({ file: "src/app.ts" })],
    },
  ])
})

test("a dynamic key is not reported missing when a locale key matches the pattern", () => {
  const localeFiles = [localeFile("i18n/en.json", ["status.active.label"])]
  const srcFile = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART])])

  expect(processFiles(localeFiles, [srcFile], config()).missing).toStrictEqual([])
})

test("a locale key that only contains the dynamic pattern as a substring is not counted as coverage", () => {
  const localeFiles = [localeFile("i18n/en.json", ["prefix.a.x.d"])]
  const srcFile = sourceFile([dynamicFileKey(["a.", DYNAMIC_PART, ".d"])])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.missing).toStrictEqual([expect.objectContaining({ key: "a.<dynamic>.d", locales: ["en"] })])
})

test("a dynamic key missing from some locales reports only those locales", () => {
  const localeFiles = [localeFile("i18n/en.json", ["status.active"]), localeFile("i18n/de.json", ["other.key"])]
  const srcFile = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART])])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.missing).toStrictEqual([
    {
      key: "status.<dynamic>",
      locales: ["de"],
      sources: [expect.objectContaining({ file: "src/app.ts" })],
    },
  ])
})

test("the same dynamic key used in multiple locations is aggregated into a single missing entry", () => {
  const localeFiles = [localeFile("i18n/en.json", [])]
  const srcFile = sourceFile([
    dynamicFileKey(["status.", DYNAMIC_PART], "src/a.ts"),
    dynamicFileKey(["status.", DYNAMIC_PART], "src/b.ts"),
  ])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.missing).toHaveLength(1)
  expect(result.missing?.[0]?.key).toBe("status.<dynamic>")
  expect(result.missing?.[0]?.sources.map((s) => s.file)).toStrictEqual(["src/a.ts", "src/b.ts"])
})

test("dynamic source key covers matched locale keys (including deep ones via prefix) but not unmatched ones", () => {
  const localeFiles = [localeFile("i18n/en.json", ["status.active", "status.active.label", "role.admin"])]
  const srcFile = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART])])

  const result = processFiles(localeFiles, [srcFile], config())

  expect(result.unused).toStrictEqual([
    { key: "role.admin", files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] },
  ])
})

test("a dynamic key covers local <i18n> keys (neither missing nor unused)", () => {
  const srcFile = sourceFile(
    [dynamicFileKey(["local.", DYNAMIC_PART], "src/comp.vue")],
    [
      {
        locale: "en",
        file: "src/comp.vue",
        rawData: { local: { title: "test" } },
        keys: [{ key: "local.title", type: "string" }],
        scope: "local",
      },
    ],
  )

  expect(processFiles([], [srcFile], config())).toStrictEqual({ typeWarnings: [], missing: [], unused: [] })
})

test("duplicate dynamic key patterns across source files are deduplicated", () => {
  const localeFiles = [localeFile("i18n/en.json", ["status.active", "status.inactive"])]
  const srcFile = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART], "src/a.ts")])
  const srcFile2 = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART], "src/b.ts")])

  const result = processFiles(localeFiles, [srcFile, srcFile2], config())

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([])
})

test("when missingKeys severity is off, missing is undefined", () => {
  const localeFiles = [localeFile("i18n/en.json", ["missing.key"])]
  const srcFile = sourceFile([fileKey("missing.key")])

  const result = processFiles(localeFiles, [srcFile], config({ checks: { missingKeys: { severity: "off" } } }))

  expect(result.missing).toBeUndefined()
  expect(result.unused).toStrictEqual([])
  expect(result.typeWarnings).toStrictEqual([])
})

test("when unusedKeys severity is off, unused is undefined", () => {
  const localeFiles = [localeFile("i18n/en.json", ["unused.key"])]
  const srcFile = sourceFile([fileKey("hello")])

  const result = processFiles(localeFiles, [srcFile], config({ checks: { unusedKeys: { severity: "off" } } }))

  expect(result.missing).toStrictEqual([expect.objectContaining({ key: "hello" })])
  expect(result.unused).toBeUndefined()
})

test("when both checks are off, only typeWarnings are computed", () => {
  const enFile: LocaleFile = {
    locale: "en",
    file: "i18n/en.json",
    scope: "global",
    rawData: {
      count: 1,
      label: "test",
    },
    keys: [
      { key: "count", type: "number" },
      { key: "label", type: "string" },
    ],
  }

  const srcFile = sourceFile([fileKey("missing.key"), fileKey("label")])

  const result = processFiles(
    [enFile],
    [srcFile],
    config({
      checks: {
        missingKeys: { severity: "off" },
        unusedKeys: { severity: "off" },
      },
    }),
  )

  expect(result.missing).toBeUndefined()
  expect(result.unused).toBeUndefined()
  expect(result.typeWarnings).toStrictEqual([{ key: "count", locale: "en", file: "i18n/en.json", type: "number" }])
})

test("ignoreKeys suppresses keys from both missing and unused checks", () => {
  const localeFiles = [localeFile("i18n/en.json", ["unused.key"])]
  const srcFile = sourceFile([fileKey("missing.key")])

  const result = processFiles(localeFiles, [srcFile], config({ ignoreKeys: ["missing.key", "unused.key"] }))

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([])
})

test("missingKeys.ignore suppresses keys only from missing", () => {
  const localeFiles = [localeFile("i18n/en.json", ["unused.key"])]
  const srcFile = sourceFile([fileKey("missing.key")])

  const result = processFiles(
    localeFiles,
    [srcFile],
    config({
      checks: { missingKeys: { ignore: ["missing.key"] } },
    }),
  )

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([expect.objectContaining({ key: "unused.key" })])
})

test("unusedKeys.ignore suppresses keys only from unused", () => {
  const localeFiles = [localeFile("i18n/en.json", ["unused.key"])]
  const srcFile = sourceFile([fileKey("missing.key")])

  const result = processFiles(
    localeFiles,
    [srcFile],
    config({
      checks: { unusedKeys: { ignore: ["unused.key"] } },
    }),
  )

  expect(result.missing).toStrictEqual([expect.objectContaining({ key: "missing.key" })])
  expect(result.unused).toStrictEqual([])
})

test("ignoreKeys and missingKeys.ignore together cover different keys", () => {
  const localeFiles = [localeFile("i18n/en.json", ["unused.key"])]
  const srcFile = sourceFile([fileKey("missing.key"), fileKey("also.missing")])

  const result = processFiles(
    localeFiles,
    [srcFile],
    config({
      ignoreKeys: ["missing.key"],
      checks: { missingKeys: { ignore: ["also.missing"] } },
    }),
  )

  expect(result.missing).toStrictEqual([])
  expect(result.unused).toStrictEqual([expect.objectContaining({ key: "unused.key" })])
})

test("filtering multiple keys at once works", () => {
  const localeFiles = [localeFile("i18n/en.json", ["x", "y", "z"])]
  const srcFile = sourceFile([fileKey("a"), fileKey("b"), fileKey("c")])

  const result = processFiles(
    localeFiles,
    [srcFile],
    config({
      checks: {
        missingKeys: { ignore: ["a", "c"] },
        unusedKeys: { ignore: ["x", "z"] },
      },
    }),
  )

  expect(result.missing?.map((k) => k.key)).toStrictEqual(["b"])
  expect(result.unused?.map((k) => k.key)).toStrictEqual(["y"])
})

test("ignoreKeys suppresses a dynamic missing key by its placeholder string", () => {
  const localeFiles = [localeFile("i18n/en.json", ["other.unused"])]
  const srcFile = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART]), fileKey("other.key")])

  const result = processFiles(
    localeFiles,
    [srcFile],
    config({
      ignoreKeys: ["status.<dynamic>"],
    }),
  )

  expect(result.missing?.map((k) => k.key)).toStrictEqual(["other.key"])
  expect(result.unused?.map((k) => k.key)).toStrictEqual(["other.unused"])
})

test("missingKeys.ignore suppresses a dynamic missing key but does not affect unused", () => {
  const localeFiles = [localeFile("i18n/en.json", ["other.unused"])]
  const srcFile = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART]), fileKey("other.key")])

  const result = processFiles(
    localeFiles,
    [srcFile],
    config({
      checks: { missingKeys: { ignore: ["status.<dynamic>"] } },
    }),
  )

  expect(result.missing?.map((k) => k.key)).toStrictEqual(["other.key"])
  expect(result.unused?.map((k) => k.key)).toStrictEqual(["other.unused"])
})

test("unusedKeys.ignore does not suppress a dynamic missing key", () => {
  const localeFiles = [localeFile("i18n/en.json", [])]
  const srcFile = sourceFile([dynamicFileKey(["status.", DYNAMIC_PART])])

  const result = processFiles(
    localeFiles,
    [srcFile],
    config({
      checks: { unusedKeys: { ignore: ["status.<dynamic>"] } },
    }),
  )

  expect(result.missing?.map((k) => k.key)).toStrictEqual(["status.<dynamic>"])
})

function localeFile(file: string, keys: string[]): LocaleFile {
  return {
    locale: basename(file, ".json"),
    rawData: Object.fromEntries(keys.map((key) => [key, "test"])),
    file,
    keys: keys.map((key) => ({ key, type: "string" })),
    scope: "global",
  }
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

function dynamicFileKey(key: DynamicKey, file = "src/app.ts", line = 1, column = 1): FileKey {
  return { key, file, location: { start: { line, column }, end: { line, column: column + 1 } } }
}

function config(overrides?: {
  ignoreKeys?: ConfigOutput["ignoreKeys"]
  checks?: {
    missingKeys?: Partial<ConfigOutput["checks"]["missingKeys"]>
    unusedKeys?: Partial<ConfigOutput["checks"]["unusedKeys"]>
  }
}): ConfigOutput {
  return {
    path: "",
    format: "text",
    localePattern: "",
    srcPattern: "",
    ignorePatterns: [],
    ignoreKeys: overrides?.ignoreKeys ?? [],
    checks: {
      missingKeys: {
        severity: overrides?.checks?.missingKeys?.severity ?? "error",
        ignore: overrides?.checks?.missingKeys?.ignore ?? [],
      },
      unusedKeys: {
        severity: overrides?.checks?.unusedKeys?.severity ?? "warning",
        ignore: overrides?.checks?.unusedKeys?.ignore ?? [],
      },
    },
  }
}
