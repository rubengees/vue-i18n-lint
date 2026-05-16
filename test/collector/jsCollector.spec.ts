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
