import { expect, test } from "vitest"
import { mapGetOrInsert, newPrefixSet } from "../src/utils.ts"

test("PrefixSet contains the key itself", () => {
  const set = newPrefixSet(["foo.bar"])

  expect(set.has("foo.bar")).toStrictEqual(true)
})

test("PrefixSet contains every dot-segment prefix of a key", () => {
  const set = newPrefixSet(["foo.bar.baz"])

  expect(set.has("foo")).toStrictEqual(true)
  expect(set.has("foo.bar")).toStrictEqual(true)
  expect(set.has("foo.bar.baz")).toStrictEqual(true)
})

test("PrefixSet does not match partial keys", () => {
  const set = newPrefixSet(["foo.bar"])

  expect(set.has("foo.ba")).toStrictEqual(false)
  expect(set.has("fo.bar")).toStrictEqual(false)
})

test("PrefixSet does not match unrelated keys", () => {
  const set = newPrefixSet(["foo.bar"])

  expect(set.has("baz")).toStrictEqual(false)
})

test("PrefixSet is empty when no keys are given", () => {
  const set = newPrefixSet()

  expect(set.has("")).toStrictEqual(false)
})

test("mapGetOrInsert inserts and returns the default value for a missing key", () => {
  const map = new Map<string, number[]>()
  const result = mapGetOrInsert(map, "x", [])

  expect(result).toStrictEqual([])
  expect(map.has("x")).toStrictEqual(true)
})

test("mapGetOrInsert returns the existing value without overwriting it", () => {
  const map = new Map<string, number>([["x", 42]])
  const result = mapGetOrInsert(map, "x", 0)

  expect(result).toStrictEqual(42)
})

test("mapGetOrInsert does not clobber an existing falsy value", () => {
  const map = new Map<string, number>([["x", 0]])
  const result = mapGetOrInsert(map, "x", 99)

  expect(result).toStrictEqual(0)
})
