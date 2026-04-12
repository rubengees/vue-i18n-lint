import { resolve } from "node:path"
import { expect, test } from "vitest"
import { collectSourceFile } from "../../src/collector/sourceCollector.ts"

test("finds keys in a js file", async () => {
  const filePath = resolve("test/fixtures/js/script.js")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
  ])

  expect(localeFiles).toEqual([])
})

test("finds keys in a cjs file", async () => {
  const filePath = resolve("test/fixtures/js/script.cjs")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
  ])

  expect(localeFiles).toEqual([])
})

test("finds keys in a ts file", async () => {
  const filePath = resolve("test/fixtures/ts/script.ts")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
    { key: "d", file: filePath, location: { start: { line: 8, column: 20 }, end: { line: 8, column: 21 } } },
  ])

  expect(localeFiles).toEqual([])
})

test("finds keys in a vue file (template and script)", async () => {
  const filePath = resolve("test/fixtures/vue/component.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toEqual([
    { key: "b", file: filePath, location: { start: { line: 9, column: 14 }, end: { line: 9, column: 15 } } },
    { key: "a", file: filePath, location: { start: { line: 5, column: 18 }, end: { line: 5, column: 19 } } },
  ])

  expect(localeFiles).toEqual([])
})

test("finds keys and collects <i18n> block locales from a vue file", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toEqual([
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

  expect(localeFiles).toEqual([
    { locale: "en", file: filePath, keys: ["block"], scope: "local", sourceFile: filePath },
    { locale: "ja", file: filePath, keys: ["block"], scope: "local", sourceFile: filePath },
  ])
})

test("collects <i18n lang='yaml'> block locales", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-yaml.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toEqual([
    { key: "greeting", file: filePath, location: { start: { line: 2, column: 16 }, end: { line: 2, column: 24 } } },
  ])

  expect(localeFiles).toEqual([
    { locale: "en", file: filePath, keys: ["greeting"], scope: "local", sourceFile: filePath },
    { locale: "de", file: filePath, keys: ["greeting"], scope: "local", sourceFile: filePath },
  ])
})

test("collects <i18n lang='json5'> block locales", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-json5.vue")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toEqual([
    { key: "title", file: filePath, location: { start: { line: 2, column: 16 }, end: { line: 2, column: 21 } } },
  ])

  expect(localeFiles).toEqual([{ locale: "en", file: filePath, keys: ["title"], scope: "local", sourceFile: filePath }])
})

test("throw on <i18n> block with unsupported lang", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-invalid-lang.vue")

  await expect(collectSourceFile(filePath)).rejects.toThrow(
    `Invalid <i18n> block in ${filePath}: Unsupported file type: .toml`,
  )
})

test("throw on <i18n> block with valid lang but invalid content", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-invalid-content.vue")

  await expect(collectSourceFile(filePath)).rejects.toThrow(
    `Invalid <i18n> block in ${filePath}: Expected property name or '}' in JSON at position 3 (line 2 column 3)`,
  )
})

test("throw on <i18n> block with valid lang but invalid structure (array)", async () => {
  const filePath = resolve("test/fixtures/vue/i18n-block-invalid-structure.vue")

  await expect(collectSourceFile(filePath)).rejects.toThrow(
    `Invalid <i18n> block in ${filePath}: Unsupported value type "number" at key "array.0"`,
  )
})

test("can handle invalid file", async () => {
  const filePath = resolve("test/fixtures/ts/invalid.ts.txt")
  const { keys, localeFiles } = await collectSourceFile(filePath)

  expect(keys).toEqual([])
  expect(localeFiles).toEqual([])
})
