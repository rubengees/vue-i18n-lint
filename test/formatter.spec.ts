import { resolve } from "node:path"
import { decode } from "@toon-format/toon"
import { expect, test } from "vitest"
import { outputJson, outputMissingKeys, outputToon, outputTypeWarnings, outputUnusedKeys } from "../src/formatter.ts"
import type { LocaleTypeWarning, MissingKey, UnusedKey } from "../src/types.ts"
import { buildTestProcess, expectStdoutContains } from "./helpers.ts"

const location = { start: { line: 1, column: 1 }, end: { line: 1, column: 4 } }

test("outputMissingKeys prints key location and code frame", () => {
  const file = resolve("test/fixtures/ts/script.ts")
  const key: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location }] }
  const testProcess = buildTestProcess()

  outputMissingKeys(testProcess, [key])

  expectStdoutContains(testProcess, "Missing keys (1)")
  expectStdoutContains(testProcess, "script.ts")
})

test("outputMissingKeys still prints location when source file cannot be read", () => {
  const file = resolve("test/fixtures/does-not-exist.ts")
  const key: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location }] }
  const testProcess = buildTestProcess()

  expect(() => outputMissingKeys(testProcess, [key])).not.toThrow()
  expectStdoutContains(testProcess, "Missing keys (1)")
  expectStdoutContains(testProcess, "does-not-exist.ts")
})

test("outputUnusedKeys prints a table of unused keys", () => {
  const key: UnusedKey = { key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }
  const testProcess = buildTestProcess()

  outputUnusedKeys(testProcess, [key])

  expectStdoutContains(testProcess, "Unused keys (1)")
  expectStdoutContains(testProcess, "old.key")
})

test("outputTypeWarnings prints warnings grouped by file", () => {
  const warning: LocaleTypeWarning = { key: "count", locale: "en", file: "en.json", type: "number" }
  const testProcess = buildTestProcess()

  outputTypeWarnings(testProcess, [warning])

  expectStdoutContains(testProcess, "Warnings (1)")
  expectStdoutContains(testProcess, "count")
})

test("outputJson prints machine-readable JSON", () => {
  const testProcess = buildTestProcess()
  const file = resolve("test/fixtures/ts/script.ts")
  const loc = { start: { line: 1, column: 1 }, end: { line: 1, column: 4 } }
  const missingKeys: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location: loc }] }
  const unused: UnusedKey = { key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }

  outputJson(testProcess, { missingKeys: [missingKeys], unusedKeys: [unused] })

  const output = JSON.parse(testProcess.getStdout())

  expect(output).toStrictEqual({
    missingKeys: [{ key: "a", locales: ["de"], sources: [{ file, location: loc }] }],
    unusedKeys: [{ key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }],
  })
})

test("outputJson handles empty results", () => {
  const testProcess = buildTestProcess()

  outputJson(testProcess, { missingKeys: [], unusedKeys: [] })

  const output = JSON.parse(testProcess.getStdout())

  expect(output).toStrictEqual({ missingKeys: [], unusedKeys: [] })
})

test("outputToon prints machine-readable Toon format", () => {
  const testProcess = buildTestProcess()
  const file = resolve("test/fixtures/ts/script.ts")
  const loc = { start: { line: 1, column: 1 }, end: { line: 1, column: 4 } }
  const missingKeys: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location: loc }] }
  const unused: UnusedKey = { key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }

  outputToon(testProcess, { missingKeys: [missingKeys], unusedKeys: [unused] })

  const output = decode(testProcess.getStdout())

  expect(output).toStrictEqual({
    missingKeys: [{ key: "a", locales: ["de"], sources: [{ file, location: loc }] }],
    unusedKeys: [{ key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }],
  })
})

test("outputToon handles empty results", () => {
  const testProcess = buildTestProcess()

  outputToon(testProcess, { missingKeys: [], unusedKeys: [] })

  const output = decode(testProcess.getStdout())

  expect(output).toStrictEqual({ missingKeys: [], unusedKeys: [] })
})
