import { expect, test } from "vitest"
import { newTrie, trieCoversKey, mapGetOrInsert } from "../src/utils.ts"

test("trieCoversKey returns true for an exact key match", () => {
  const trie = newTrie(["foo.bar"])

  expect(trieCoversKey(trie, "foo.bar")).toStrictEqual(true)
})

test("trieCoversKey returns true for a key that is a prefix of a trie entry", () => {
  const trie = newTrie(["foo.bar"])

  expect(trieCoversKey(trie, "foo")).toStrictEqual(true)
})

test("trieCoversKey returns false when no prefix matches", () => {
  const trie = newTrie(["foo.bar"])

  expect(trieCoversKey(trie, "baz")).toStrictEqual(false)
})

test("trieCoversKey returns false for an empty trie", () => {
  const trie = newTrie()

  expect(trieCoversKey(trie, "foo")).toStrictEqual(false)
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
