import { readFileSync } from "node:fs"
import { parseSync } from "oxc-parser"
import { expect, test } from "vitest"
import { collectJsKeys } from "../../src/collector/jsCollector.ts"
import { DYNAMIC_PART } from "../../src/types.ts"

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

test("member expression call is detected", () => {
  const program = parseSync("script.ts", 'this.$t("key")').program

  expect(collectJsKeys(program)).toMatchObject([{ key: "key" }])
})

test("non-translation function is not collected", () => {
  const program = parseSync("script.ts", 'foo("key")').program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("computed method call is not collected", () => {
  const program = parseSync("script.ts", 'obj["t"]("key")').program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("does not crash when translation function is called with no arguments", () => {
  const program = parseSync("script.ts", "t()").program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("string concatenation of literals returns a static key", () => {
  const program = parseSync("script.ts", 't("a." + "b")').program

  expect(collectJsKeys(program)).toMatchObject([{ key: "a.b" }])
})

test("template literal without expressions returns a static key", () => {
  const program = parseSync("script.ts", "t(`a.b`)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: "a.b" }])
})

test("template literal with expression returns a dynamic key", () => {
  const program = parseSync("script.ts", "t(`a.${x}.b`)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: ["a.", DYNAMIC_PART, ".b"] }])
})

test("string concatenated with a variable returns a dynamic key", () => {
  const program = parseSync("script.ts", 't("a." + x)').program

  expect(collectJsKeys(program)).toMatchObject([{ key: ["a.", DYNAMIC_PART] }])
})

test("template literal with expression at the start returns a dynamic key", () => {
  const program = parseSync("script.ts", "t(`${x}.b`)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: [DYNAMIC_PART, ".b"] }])
})

test("template literal with expression at the end returns a dynamic key", () => {
  const program = parseSync("script.ts", "t(`a.${x}`)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: ["a.", DYNAMIC_PART] }])
})

test("template literal with only an expression is ignored", () => {
  const program = parseSync("script.ts", "t(`${x}`)").program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("empty template literal is ignored", () => {
  const program = parseSync("script.ts", "t(``)").program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("template literal with multiple expressions returns a dynamic key", () => {
  const program = parseSync("script.ts", "t(`a.${x}.${y}.c`)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: ["a.", DYNAMIC_PART, ".", DYNAMIC_PART, ".c"] }])
})

test("template literal with consecutive expressions deduplicates dynamic parts", () => {
  const program = parseSync("script.ts", "t(`${x}${y}.c`)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: [DYNAMIC_PART, ".c"] }])
})

test("nested template literal resolving to a static string returns a static key", () => {
  const program = parseSync("script.ts", "t(`prefix.${`nested`}`)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: "prefix.nested" }])
})

test("string + variable + string returns a dynamic key", () => {
  const program = parseSync("script.ts", 't("a." + x + ".b")').program

  expect(collectJsKeys(program)).toMatchObject([{ key: ["a.", DYNAMIC_PART, ".b"] }])
})

test("variable + string returns a dynamic key", () => {
  const program = parseSync("script.ts", 't(x + ".b")').program

  expect(collectJsKeys(program)).toMatchObject([{ key: [DYNAMIC_PART, ".b"] }])
})

test("concatenation of two variables is ignored", () => {
  const program = parseSync("script.ts", "t(x + y)").program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("non-+ binary expression is ignored", () => {
  const program = parseSync("script.ts", "t(a - b)").program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("number literal argument returns a static key", () => {
  const program = parseSync("script.ts", "t(42)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: "42" }])
})

test("boolean literal argument returns a static key", () => {
  const program = parseSync("script.ts", "t(true)").program

  expect(collectJsKeys(program)).toMatchObject([{ key: "true" }])
})

test("identifier argument is ignored", () => {
  const program = parseSync("script.ts", "t(x)").program

  expect(collectJsKeys(program)).toStrictEqual([])
})

test("conditional expression with string branches returns both keys", () => {
  const program = parseSync("script.ts", 't(condition ? "a" : "b")').program

  expect(collectJsKeys(program)).toMatchObject([{ key: "a" }, { key: "b" }])
})

test("conditional expression with one dynamic branch returns only the string key", () => {
  const program = parseSync("script.ts", 't(condition ? "a" : x)').program

  expect(collectJsKeys(program)).toMatchObject([{ key: "a" }])
})

test("nested conditional expression returns all string keys", () => {
  const program = parseSync("script.ts", 't(c1 ? "a" : c2 ? "b" : "c")').program

  expect(collectJsKeys(program)).toMatchObject([{ key: "a" }, { key: "b" }, { key: "c" }])
})

test("conditional expression with template literal branch returns dynamic key", () => {
  const program = parseSync("script.ts", 't(c ? `a.${x}` : "b")').program

  expect(collectJsKeys(program)).toMatchObject([{ key: ["a.", DYNAMIC_PART] }, { key: "b" }])
})
