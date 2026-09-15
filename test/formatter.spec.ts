import { resolve } from "node:path"
import { decode } from "@toon-format/toon"
import { expect, test } from "vitest"
import {
  outputDynamicKeys,
  outputJson,
  outputMissingKeys,
  outputToon,
  outputTypeWarnings,
  outputUnusedKeys,
} from "../src/formatter.ts"
import type { DynamicKeyOccurrence, LocaleTypeWarning, MissingKey, UnusedKey } from "../src/types.ts"
import { buildTestProcess, expectStdoutContains, expectStdoutNotContains } from "./helpers.ts"

const location = { start: { line: 5, column: 19 }, end: { line: 5, column: 20 } }

test("outputMissingKeys prints key location and code frame", () => {
  const file = resolve("test/fixtures/ts/script.ts")
  const key: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location }] }
  const testProcess = buildTestProcess()

  outputMissingKeys(testProcess, [key])

  const output = testProcess.getStdout()
  expectStdoutContains(testProcess, "Missing keys (1)")
  expect(output).toContain("script.ts:5:19")
  expect(output).toContain('> 5 | const a = i18n.t("a")')
  expect(output).toContain("    |                   ^ Missing in de")
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

test("outputDynamicKeys prints each occurrence with a code frame marked as a dynamic key", () => {
  const file = resolve("test/fixtures/ts/script.ts")
  const key: DynamicKeyOccurrence = { key: "<dynamic>", partial: false, source: { file, location } }
  const testProcess = buildTestProcess()

  outputDynamicKeys(testProcess, [key])

  expectStdoutContains(testProcess, "Dynamic keys (1)")
  expectStdoutContains(testProcess, "script.ts:5:19")
  expectStdoutContains(testProcess, '> 5 | const a = i18n.t("a")')
  expectStdoutContains(testProcess, "Dynamic key")
  expectStdoutNotContains(testProcess, "Partial")
  expectStdoutNotContains(testProcess, "<dynamic>")
})

test("outputDynamicKeys marks partial dynamic keys as partial", () => {
  const file = resolve("test/fixtures/ts/script.ts")
  const key: DynamicKeyOccurrence = { key: "status.<dynamic>", partial: true, source: { file, location } }
  const testProcess = buildTestProcess()

  outputDynamicKeys(testProcess, [key])

  expectStdoutContains(testProcess, "Dynamic keys (1)")
  expectStdoutContains(testProcess, "Partial dynamic key")
})

test("outputDynamicKeys counts all occurrences, not unique key patterns", () => {
  const file = resolve("test/fixtures/ts/script.ts")
  const keys: DynamicKeyOccurrence[] = [file, file].map((f) => ({
    key: "<dynamic>",
    partial: false,
    source: { file: f, location },
  }))
  const testProcess = buildTestProcess()

  outputDynamicKeys(testProcess, keys)

  expectStdoutContains(testProcess, "Dynamic keys (2)")
})

test("outputDynamicKeys still prints location when source file cannot be read", () => {
  const file = resolve("test/fixtures/does-not-exist.ts")
  const key: DynamicKeyOccurrence = { key: "status.<dynamic>", partial: true, source: { file, location } }
  const testProcess = buildTestProcess()

  expect(() => outputDynamicKeys(testProcess, [key])).not.toThrow()
  expectStdoutContains(testProcess, "Dynamic keys (1)")
  expectStdoutContains(testProcess, "does-not-exist.ts")
})

test("outputJson prints machine-readable JSON", () => {
  const testProcess = buildTestProcess()
  const file = resolve("test/fixtures/ts/script.ts")
  const loc = { start: { line: 1, column: 1 }, end: { line: 1, column: 4 } }
  const missingKeys: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location: loc }] }
  const unusedKey: UnusedKey = { key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }
  const dynamicKey: DynamicKeyOccurrence = { key: "status.<dynamic>", partial: true, source: { file, location: loc } }

  outputJson(testProcess, { missingKeys: [missingKeys], unusedKeys: [unusedKey], dynamicKeys: [dynamicKey] })

  const output = JSON.parse(testProcess.getStdout())

  expect(output).toStrictEqual({
    missingKeys: [{ key: "a", locales: ["de"], sources: [{ file, location: loc }] }],
    unusedKeys: [{ key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }],
    dynamicKeys: [{ key: "status.<dynamic>", partial: true, source: { file, location: loc } }],
  })
})

test("outputJson handles empty results", () => {
  const testProcess = buildTestProcess()

  outputJson(testProcess, { missingKeys: [], unusedKeys: [], dynamicKeys: [] })

  const output = JSON.parse(testProcess.getStdout())

  expect(output).toStrictEqual({ missingKeys: [], unusedKeys: [], dynamicKeys: [] })
})

test("outputToon prints machine-readable Toon format", () => {
  const testProcess = buildTestProcess()
  const file = resolve("test/fixtures/ts/script.ts")
  const loc = { start: { line: 1, column: 1 }, end: { line: 1, column: 4 } }
  const missingKeys: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location: loc }] }
  const unusedKey: UnusedKey = { key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }
  const dynamicKey: DynamicKeyOccurrence = { key: "status.<dynamic>", partial: true, source: { file, location: loc } }

  outputToon(testProcess, { missingKeys: [missingKeys], unusedKeys: [unusedKey], dynamicKeys: [dynamicKey] })

  const output = decode(testProcess.getStdout())

  expect(output).toStrictEqual({
    missingKeys: [{ key: "a", locales: ["de"], sources: [{ file, location: loc }] }],
    unusedKeys: [{ key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }],
    dynamicKeys: [{ key: "status.<dynamic>", partial: true, source: { file, location: loc } }],
  })
})

test("outputToon handles empty results", () => {
  const testProcess = buildTestProcess()

  outputToon(testProcess, { missingKeys: [], unusedKeys: [], dynamicKeys: [] })

  const output = decode(testProcess.getStdout())

  expect(output).toStrictEqual({ missingKeys: [], unusedKeys: [], dynamicKeys: [] })
})
