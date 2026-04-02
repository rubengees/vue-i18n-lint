import { resolve } from "node:path"
import { test, expect } from "vitest"
import { collectFileKeys } from "../../src/collector/fileCollector.ts"

test("finds keys in a js file", () => {
  const filePath = resolve("test/fixtures/js/script.js")
  const result = collectFileKeys(filePath)

  expect(result).toEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
  ])
})

test("finds keys in a cjs file", () => {
  const filePath = resolve("test/fixtures/js/script.cjs")
  const result = collectFileKeys(filePath)

  expect(result).toEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
  ])
})

test("finds keys in a ts file", () => {
  const filePath = resolve("test/fixtures/ts/script.ts")
  const result = collectFileKeys(filePath)

  expect(result).toEqual([
    { key: "a", file: filePath, location: { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } } },
    { key: "b", file: filePath, location: { start: { line: 6, column: 20 }, end: { line: 6, column: 21 } } },
    { key: "c", file: filePath, location: { start: { line: 7, column: 20 }, end: { line: 7, column: 21 } } },
    { key: "d", file: filePath, location: { start: { line: 8, column: 20 }, end: { line: 8, column: 21 } } },
  ])
})

test("finds keys in a vue file (template and script)", () => {
  const filePath = resolve("test/fixtures/vue/component.vue")
  const result = collectFileKeys(filePath)

  expect(result).toEqual([
    { key: "b", file: filePath, location: { start: { line: 9, column: 14 }, end: { line: 9, column: 15 } } },
    { key: "a", file: filePath, location: { start: { line: 5, column: 18 }, end: { line: 5, column: 19 } } },
  ])
})

test("can handle invalid file", () => {
  const filePath = resolve("test/fixtures/ts/invalid.ts.txt")
  const result = collectFileKeys(filePath)

  expect(result).toEqual([])
})
