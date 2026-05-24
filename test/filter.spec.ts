import { expect, test } from "vitest"
import { filterResults } from "../src/filter.ts"
import type { MissingKey, ProcessResult, UnusedKey } from "../src/types.ts"

test("returns results unchanged when no ignore options are given", () => {
  const result = makeResult(["missing.key"], ["unused.key"])

  expect(filterResults(result)).toStrictEqual(result)
})

test("ignoreKeys suppresses the key from both missing and unused", () => {
  const result = makeResult(["shared.key", "other.key"], ["shared.key", "other.unused"])

  const filtered = filterResults(result, { ignoreKeys: ["shared.key"] })

  expect(filtered.missing.map((k) => k.key)).toStrictEqual(["other.key"])
  expect(filtered.unused.map((k) => k.key)).toStrictEqual(["other.unused"])
})

test("missingKeys.ignore suppresses only from missing, not unused", () => {
  const result = makeResult(["missing.key", "another.key"], ["missing.key"])

  const filtered = filterResults(result, { missingKeys: { ignore: ["missing.key"] } })

  expect(filtered.missing.map((k) => k.key)).toStrictEqual(["another.key"])
  expect(filtered.unused.map((k) => k.key)).toStrictEqual(["missing.key"])
})

test("unusedKeys.ignore suppresses only from unused, not missing", () => {
  const result = makeResult(["unused.key"], ["unused.key", "other.unused"])

  const filtered = filterResults(result, { unusedKeys: { ignore: ["unused.key"] } })

  expect(filtered.missing.map((k) => k.key)).toStrictEqual(["unused.key"])
  expect(filtered.unused.map((k) => k.key)).toStrictEqual(["other.unused"])
})

test("ignoreKeys and missingKeys.ignore together cover different keys", () => {
  const result = makeResult(["orphan", "also.missing"], ["orphan"])

  const filtered = filterResults(result, {
    ignoreKeys: ["orphan"],
    missingKeys: { ignore: ["also.missing"] },
  })

  expect(filtered.missing).toStrictEqual([])
  expect(filtered.unused).toStrictEqual([])
})

test("typeWarnings are always passed through unchanged", () => {
  const result: ProcessResult = {
    typeWarnings: [{ key: "count", locale: "en", file: "i18n/en.json", type: "number" }],
    missing: [],
    unused: [],
  }

  expect(filterResults(result, { ignoreKeys: ["count"] }).typeWarnings).toStrictEqual(result.typeWarnings)
})

test("filtering multiple keys at once works", () => {
  const result = makeResult(["a", "b", "c"], ["x", "y", "z"])

  const filtered = filterResults(result, {
    missingKeys: { ignore: ["a", "c"] },
    unusedKeys: { ignore: ["x", "z"] },
  })

  expect(filtered.missing.map((k) => k.key)).toStrictEqual(["b"])
  expect(filtered.unused.map((k) => k.key)).toStrictEqual(["y"])
})

function makeResult(missing: string[], unused: string[]): ProcessResult {
  return {
    typeWarnings: [],
    missing: missing.map(missingKey),
    unused: unused.map(unusedKey),
  }
}

function missingKey(key: string): MissingKey {
  return { key, locales: ["en"], sources: [] }
}

function unusedKey(key: string): UnusedKey {
  return { key, files: [{ locale: "en", file: "i18n/en.json", scope: "global" }] }
}
