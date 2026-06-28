import { expect, test } from "vitest"
import { parseScript } from "../../src/parser/scriptParser.ts"

test("parses JS successfully", () => {
  const result = parseScript("test.js", "const x = 1", { lang: "js" })

  expect(result.type).toStrictEqual("Program")
})

test("parses TS successfully", () => {
  const result = parseScript("test.ts", "const x: number = 1", { lang: "ts" })

  expect(result.type).toStrictEqual("Program")
})

test("defaults to JS when no lang is given", () => {
  const result = parseScript("test.vue", "const x = 1")

  expect(result.type).toStrictEqual("Program")
})

test("throws ParseError for unsupported script lang", () => {
  expect(() => parseScript("test.vue", "const x = 1", { lang: "coffee" })).toThrow('Unsupported script lang: "coffee"')
})
