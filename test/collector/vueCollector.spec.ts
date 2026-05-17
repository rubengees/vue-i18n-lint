import { readFileSync } from "node:fs"
import { parse } from "@vue/compiler-sfc"
import { expect, test } from "vitest"
import { collectVueKeys } from "../../src/collector/vueCollector.ts"

test("finds keys in template", () => {
  const content = readFileSync("test/fixtures/vue/template.vue", { encoding: "utf-8" })
  const parseResult = parse(content, { filename: "template.ts", templateParseOptions: { prefixIdentifiers: false } })
  const templateAst = parseResult.descriptor.template?.ast

  const result = collectVueKeys("template.vue", templateAst!, { fileSource: content })

  expect(result).toStrictEqual([
    { key: "a", start: 26, end: 27 },
    { key: "b", start: 56, end: 57 },
    { key: "c", start: 86, end: 87 },
    { key: "d", start: 121, end: 122 },
    { key: "e", start: 135, end: 136 },
    { key: "f", start: 167, end: 168 },
    { key: "g", start: 183, end: 184 },
    { key: "h", start: 217, end: 218 },
    { key: "i", start: 249, end: 250 },
    { key: "j", start: 286, end: 287 },
    { key: "l", start: 354, end: 355 },
    { key: "k", start: 323, end: 324 },
    { key: "m", start: 398, end: 399 },
    { key: "keypath", start: 430, end: 437 },
    { key: "path", start: 458, end: 462 },
  ])
})

test("handles special formatting", () => {
  const content = readFileSync("test/fixtures/vue/special.vue", { encoding: "utf-8" })
  const parseResult = parse(content, { filename: "special.vue", templateParseOptions: { prefixIdentifiers: false } })
  const templateAst = parseResult.descriptor.template?.ast

  const result = collectVueKeys("special.vue", templateAst!, { fileSource: content })

  expect(result).toStrictEqual([
    { key: "a", start: 297, end: 298 },
    { key: "b", start: 315, end: 316 },
  ])
})
