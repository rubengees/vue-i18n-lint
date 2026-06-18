import { resolve } from "node:path"
import { expect, test } from "vitest"
import { expectStderrContains, expectStdoutContains, expectStdoutNotContains, runTest } from "../helpers.ts"

const FIXTURES = "test/fixtures/projects"
const DEFAULT_LOCALE_PATTERN = "**/locales/*.json"
const DEFAULT_SRC_PATTERN = "**/*.{ts,cts,mts,js,cjs,mjs,vue}"

test("reports no issues when all keys are present", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "all-keys-present"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Found 0 missing and 0 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("exits 1 and reports missing key count when keys are missing", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "missing-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Missing keys (1):")
  expectStdoutContains(testProcess, "missing.key")
  expectStdoutContains(testProcess, "Found 1 missing and 0 unused keys.")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("reports unused key count when keys are unused", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "unused-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Unused keys (1):")
  expectStdoutContains(testProcess, "Found 0 missing and 1 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("exits 1 and reports both counts when keys are missing and unused", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "mixed"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Missing keys (1):")
  expectStdoutContains(testProcess, "Unused keys (1):")
  expectStdoutContains(testProcess, "Found 1 missing and 1 unused keys.")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("respects ignorePatterns and skips excluded source files", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "missing-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--ignore-patterns",
    "src/**",
  ])

  expectStdoutContains(testProcess, "Found 0 missing")
  expect(testProcess.exitCode).toBeFalsy()
})

test("respects srcPattern and only scans matching source files", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "multi-src"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    "src/app.ts",
  ])

  expectStdoutContains(testProcess, "Found 0 missing and 1 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("respects localePattern and reads only matching locale files", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "all-keys-present"),
    "--locale-pattern",
    "**/translations/*.json",
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Found 0 missing and 0 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("reports type warnings and exits 0 when locale file contains non-string values", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "type-warnings"),
    "--locale-pattern",
    "**/locales/*.{json,ts}",
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Warnings (5):")
  expectStdoutContains(testProcess, "Unexpected type number for key count")
  expectStdoutContains(testProcess, "Unexpected type boolean for key bool")
  expectStdoutContains(testProcess, "Unexpected type null for key null")
  expectStdoutContains(testProcess, "Unexpected type number for key arr.1")
  expectStdoutContains(testProcess, "Unexpected type boolean for key arr.2")
  expectStdoutContains(testProcess, "Found 0 missing and 6 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("treats a locale leaf key as used when source uses a prefix of it", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "partial-key-used"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Found 0 missing and 0 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("reports a locale leaf key as missing when source uses a sibling key, not a prefix", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "partial-key-missing"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Missing keys (1):")
  expectStdoutContains(testProcess, "aa.bb.1")
  expectStdoutContains(testProcess, "Unused keys (1):")
  expectStdoutContains(testProcess, "aa.bb.0")
  expectStdoutContains(testProcess, "Found 1 missing and 1 unused keys.")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("handles <i18n> blocks", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "i18n-block"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Missing keys (1):")
  expectStdoutContains(testProcess, "block-missing")
  expectStdoutContains(testProcess, "Found 1 missing and 0 unused keys.")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("skips unparseable files, logs an error, and exits 1", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "parse-error"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStderrContains(testProcess, "Failed to process:")
  expectStdoutContains(testProcess, "1 file skipped due to errors")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--ignore-keys suppresses keys from both missing and unused checks", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "mixed"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--ignore-keys",
    "missing.key,unused",
  ])

  expectStdoutContains(testProcess, "Found 0 missing and 0 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("config file checks.missingKeys.ignore and checks.unusedKeys.ignore suppress keys", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "ignore-keys-config"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Found 0 missing and 0 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("--missing-keys-severity=warning does not set exit code to 1 when keys are missing", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "missing-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--missing-keys-severity",
    "warning",
  ])

  expectStdoutContains(testProcess, "Missing keys (1):")
  expectStdoutContains(testProcess, "missing.key")
  expect(testProcess.exitCode).toBeFalsy()
})

test("--missing-keys-severity=off suppresses output and does not set exit code to 1", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "missing-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--missing-keys-severity",
    "off",
  ])

  expectStdoutNotContains(testProcess, "Missing keys")
  expect(testProcess.exitCode).toBeFalsy()
})

test("--unused-keys-severity=error sets exit code to 1 when keys are unused", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "unused-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--unused-keys-severity",
    "error",
  ])

  expectStdoutContains(testProcess, "Unused keys (1):")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--unused-keys-severity=off suppresses unused keys output", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "unused-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--unused-keys-severity",
    "off",
  ])

  expectStdoutNotContains(testProcess, "Unused keys")
  expect(testProcess.exitCode).toBeFalsy()
})

test("reports a dynamic key as missing and does not report dynamically-covered locale keys as unused", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Missing keys (1):")
  expectStdoutNotContains(testProcess, "Unused keys")
  expectStdoutContains(testProcess, "Found 1 missing and 0 unused keys.")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--ignore-keys suppresses a dynamic missing key by its placeholder string", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--ignore-keys",
    "color.<dynamic>",
  ])

  expectStdoutContains(testProcess, "Found 0 missing and 0 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})
