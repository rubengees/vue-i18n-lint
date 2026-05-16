import { expect, test } from "vitest"
import { extractLocaleKeys } from "../../src/collector/localeExtractor.ts"

test("extracts string keys with type string", () => {
  expect(extractLocaleKeys({ hello: "Hello", world: "World" })).toStrictEqual([
    { key: "hello", type: "string" },
    { key: "world", type: "string" },
  ])
})

test("extracts nested object keys with dot-separated paths", () => {
  expect(extractLocaleKeys({ nav: { home: "Home", about: "About" } })).toStrictEqual([
    { key: "nav.home", type: "string" },
    { key: "nav.about", type: "string" },
  ])
})

test("extracts number value with type number", () => {
  expect(extractLocaleKeys({ count: 42 })).toStrictEqual([{ key: "count", type: "number" }])
})

test("extracts boolean value with type boolean", () => {
  expect(extractLocaleKeys({ boolean: true })).toStrictEqual([{ key: "boolean", type: "boolean" }])
})

test("extracts null value with type null", () => {
  expect(extractLocaleKeys({ null: null })).toStrictEqual([{ key: "null", type: "null" }])
})

test("extracts undefined value with type undefined", () => {
  expect(extractLocaleKeys({ undef: undefined })).toStrictEqual([{ key: "undef", type: "undefined" }])
})

test("extracts array of strings as indexed keys with type string", () => {
  expect(extractLocaleKeys({ a: ["b", "c"] })).toStrictEqual([
    { key: "a.0", type: "string" },
    { key: "a.1", type: "string" },
  ])
})

test("extracts array with non-string elements as indexed keys preserving each element type", () => {
  expect(extractLocaleKeys({ arr: ["a", 1, true] })).toStrictEqual([
    { key: "arr.0", type: "string" },
    { key: "arr.1", type: "number" },
    { key: "arr.2", type: "boolean" },
  ])
})

test("extracts function value with type function", () => {
  expect(extractLocaleKeys({ hello: () => "Bonjour" })).toStrictEqual([{ key: "hello", type: "function" }])
})

test("extracts multiple keys of mixed types", () => {
  expect(extractLocaleKeys({ label: "hello", count: 42, active: false, tags: ["a", "b"] })).toStrictEqual([
    { key: "label", type: "string" },
    { key: "count", type: "number" },
    { key: "active", type: "boolean" },
    { key: "tags.0", type: "string" },
    { key: "tags.1", type: "string" },
  ])
})
