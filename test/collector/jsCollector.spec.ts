import { readFileSync } from "node:fs"
import { parseSync } from "oxc-parser"
import { test, expect } from "vitest"
import { collectJsKeys } from "../../src/collector/jsCollector.ts"

test("finds keys in script", () => {
  const file = readFileSync("test/fixtures/ts/script.ts", { encoding: "utf-8" })
  const program = parseSync("script.ts", file).program

  const result = collectJsKeys(program)

  expect(result).toStrictEqual([
    { key: "a", start: 78, end: 79 },
    { key: "b", start: 101, end: 102 },
    { key: "c", start: 124, end: 125 },
    { key: "d", start: 147, end: 148 },
  ])
})

test("does not crash when translation function is called with no arguments", () => {
  const program = parseSync("script.ts", "t()").program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("collects dynamic key from template literal with one interpolation", () => {
  const program = parseSync("script.ts", "t(`a.b.${x}.c`)").program

  expect(collectJsKeys(program)).toStrictEqual([{ key: "a.b.*.c", start: 2, end: 14, isDynamic: true }])
})

test("collects dynamic key from template literal with interpolation at start", () => {
  const program = parseSync("script.ts", "t(`${x}.end`)").program

  expect(collectJsKeys(program)).toStrictEqual([{ key: "*.end", start: 2, end: 12, isDynamic: true }])
})

test("collects dynamic key from template literal with interpolation at end", () => {
  const program = parseSync("script.ts", "t(`start.${x}`)").program

  expect(collectJsKeys(program)).toStrictEqual([{ key: "start.*", start: 2, end: 14, isDynamic: true }])
})

test("collects dynamic key from template literal with multiple interpolations", () => {
  const program = parseSync("script.ts", "t(`${x}.mid.${y}`)").program

  expect(collectJsKeys(program)).toStrictEqual([{ key: "*.mid.*", start: 2, end: 17, isDynamic: true }])
})

test("collects dynamic key from binary + expression", () => {
  const program = parseSync("script.ts", 't("a.b." + key + ".c")').program

  expect(collectJsKeys(program)).toStrictEqual([{ key: "a.b.*.c", start: 2, end: 21, isDynamic: true }])
})

test("collects dynamic key from binary + expression with variable at start", () => {
  const program = parseSync("script.ts", 't(key + ".end")').program

  expect(collectJsKeys(program)).toStrictEqual([{ key: "*.end", start: 2, end: 14, isDynamic: true }])
})

test("collects dynamic key from binary + expression with variable at end", () => {
  const program = parseSync("script.ts", 't("start." + key)').program

  expect(collectJsKeys(program)).toStrictEqual([{ key: "start.*", start: 2, end: 16, isDynamic: true }])
})

test("ignores a fully non-literal argument (not a useful pattern)", () => {
  const program = parseSync("script.ts", "t(someVar)").program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("does not produce a key for a fully static binary + expression (no variables)", () => {
  // "a." + "b" has no variables so there is no "*" in the pattern – it is skipped entirely.
  // Users should write the literal string directly; static binary-concat is not supported.
  const program = parseSync("script.ts", 't("a." + "b")').program

  expect(collectJsKeys(program)).toStrictEqual([])
})
