import { resolve } from "node:path"
import { expect, test } from "vitest"
import { collectSourceFile } from "../../src/collector/sourceCollector.ts"

test("finds keys in a js file", async () => {
  const filePath = resolve("test/fixtures/js/script.js")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
  ])

  expect(localeFiles).toStrictEqual([])
})

test("finds keys in a cjs file", async () => {
  const filePath = resolve("test/fixtures/js/script.cjs")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
  ])

  expect(localeFiles).toStrictEqual([])
})

test("finds keys in a ts file", async () => {
  const filePath = resolve("test/fixtures/ts/script.ts")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
    { key: "d", file: filePath, location: { start: { line: 8, column: 20 }, end: { line: 8, column: 21 } } },
  ])

  expect(localeFiles).toStrictEqual([])
})

test("finds keys in a vue file (template and script)", async () => {
  const filePath = resolve("test/fixtures/vue/component.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "b", file: filePath, location: { start: { line: 9, column: 14 }, end: { line: 9, column: 15 } } },
    { key: "a", file: filePath, location: { start: { line: 5, column: 18 }, end: { line: 5, column: 19 } } },
  ])

  expect(localeFiles).toStrictEqual([])
})

test("finds keys in a vue file with object literal directive", async () => {
  const filePath = resolve("test/fixtures/vue/object-literal-directive.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "label", file: filePath, location: { start: { line: 11, column: 13 }, end: { line: 11, column: 18 } } },
    { key: "active", file: filePath, location: { start: { line: 13, column: 39 }, end: { line: 13, column: 45 } } },
    { key: "inactive", file: filePath, location: { start: { line: 13, column: 54 }, end: { line: 13, column: 62 } } },
  ])

  expect(localeFiles).toStrictEqual([])
})

test("finds keys in a vue file with ts syntax", async () => {
  const filePath = resolve("test/fixtures/vue/ts-syntax.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    {
      key: "template-key",
      file: filePath,
      location: { start: { line: 14, column: 16 }, end: { line: 14, column: 28 } },
    },
    { key: "ts-key", file: filePath, location: { start: { line: 10, column: 18 }, end: { line: 10, column: 24 } } },
  ])

  expect(localeFiles).toStrictEqual([])
})

test("finds keys in a vue file with only <i18n-t>", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-t.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "a", file: filePath, location: { start: { line: 2, column: 20 }, end: { line: 2, column: 21 } } },
    { key: "b", file: filePath, location: { start: { line: 3, column: 17 }, end: { line: 3, column: 18 } } },
  ])

  expect(localeFiles).toStrictEqual([])
})

test("finds keys and collects <i18n> block locales from a vue file", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "a", file: filePath, location: { start: { line: 2, column: 16 }, end: { line: 2, column: 17 } } },
    { key: "b", file: filePath, location: { start: { line: 3, column: 16 }, end: { line: 3, column: 17 } } },
    { key: "c", file: filePath, location: { start: { line: 4, column: 16 }, end: { line: 4, column: 17 } } },
    { key: "block", file: filePath, location: { start: { line: 5, column: 16 }, end: { line: 5, column: 21 } } },
    {
      key: "block-missing",
      file: filePath,
      location: { start: { line: 6, column: 16 }, end: { line: 6, column: 29 } },
    },
  ])

  expect(localeFiles).toStrictEqual([
    { locale: "en", file: filePath, keys: [{ key: "block", type: "string" }], scope: "local", sourceFile: filePath },
    { locale: "ja", file: filePath, keys: [{ key: "block", type: "string" }], scope: "local", sourceFile: filePath },
  ])
})

test("collects <i18n lang='yaml'> block locales", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-yaml.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "greeting", file: filePath, location: { start: { line: 2, column: 16 }, end: { line: 2, column: 24 } } },
  ])

  expect(localeFiles).toStrictEqual([
    { locale: "en", file: filePath, keys: [{ key: "greeting", type: "string" }], scope: "local", sourceFile: filePath },
    { locale: "de", file: filePath, keys: [{ key: "greeting", type: "string" }], scope: "local", sourceFile: filePath },
  ])
})

test("collects <i18n lang='json5'> block locales", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-json5.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toStrictEqual([
    { key: "title", file: filePath, location: { start: { line: 2, column: 16 }, end: { line: 2, column: 21 } } },
  ])

  expect(localeFiles).toStrictEqual([
    { locale: "en", file: filePath, keys: [{ key: "title", type: "string" }], scope: "local", sourceFile: filePath },
  ])
})

test("throws on <i18n> block with unsupported lang", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-invalid-lang.vue")
  await expect(collectSourceFile(filePath)).rejects.toThrow("Unsupported locale type: .toml")
})

test("throws on <i18n> block with valid lang but invalid content", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-invalid-content.vue")
  await expect(collectSourceFile(filePath)).rejects.toThrow("Failed to parse locale content")
})

test("throws on <i18n> block with array instead of object", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-not-object.vue")
  await expect(collectSourceFile(filePath)).rejects.toThrow("Locale content is not an object")
})

test("collects <i18n> block with non-string value types", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-invalid-structure.vue")
  const { localeFiles } = await collectSourceFile(filePath)

  expect(localeFiles).toStrictEqual([
    {
      locale: "de",
      file: filePath,
      keys: [
        { key: "array.0", type: "number" },
        { key: "array.1", type: "number" },
        { key: "array.2", type: "number" },
      ],
      scope: "local",
      sourceFile: filePath,
    },
  ])
})

test("throws on invalid ts file", async () => {
  const filePath = resolve("test/fixtures/ts/invalid.ts.txt")
  await expect(collectSourceFile(filePath)).rejects.toThrow("Failed to parse script")
})

test("throws when source file does not exist", async () => {
  const filePath = resolve("test/fixtures/does-not-exist.vue")
  await expect(collectSourceFile(filePath)).rejects.toThrow(/ENOENT.*does-not-exist\.vue/)
})

test("can handle partially invalid vue file", async () => {
  const filePath = resolve("test/fixtures/vue/partially-invalid.vue")
  const result = await collectSourceFile(filePath)

  expect(result.keys).toStrictEqual([
    { key: "title", file: filePath, location: { start: { line: 2, column: 16 }, end: { line: 2, column: 21 } } },
  ])

  expect(result.localeFiles).toStrictEqual([
    { locale: "en", file: filePath, keys: [{ key: "title", type: "string" }], scope: "local", sourceFile: filePath },
  ])
})

test("throws on completely invalid vue file", async () => {
  const filePath = resolve("test/fixtures/vue/invalid.vue")
  await expect(collectSourceFile(filePath)).rejects.toThrow("Failed to parse Vue file")
})
