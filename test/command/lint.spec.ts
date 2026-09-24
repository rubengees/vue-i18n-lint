import { resolve } from "node:path"
import { expect, test } from "vitest"
import {
  decodeToonObject,
  expectStderrContains,
  expectStdoutContains,
  expectStdoutNotContains,
  runTest,
} from "../helpers.ts"

const FIXTURES = "test/fixtures/projects"
const DEFAULT_LOCALE_PATTERN = "**/locales/*.json"
const DEFAULT_SRC_PATTERN = "**/*.{ts,cts,mts,js,cjs,mjs,vue}"
const CUSTOM_CONFIG_PATH = resolve(FIXTURES, "config-flag/custom.config.js")

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

test("--format json outputs machine-readable JSON for missing keys", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "missing-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--format",
    "json",
  ])

  const output = JSON.parse(testProcess.getStdout())

  expect(output.missingKeys).toHaveLength(1)
  expect(output.missingKeys[0]?.key).toStrictEqual("missing.key")
  expect(output.missingKeys[0]?.locales).toContain("en")
  expect(output.unusedKeys).toHaveLength(0)
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--format json outputs machine-readable JSON for unused keys", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "unused-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--format",
    "json",
  ])

  const output = JSON.parse(testProcess.getStdout())

  expect(output.missingKeys).toHaveLength(0)
  expect(output.unusedKeys).toHaveLength(1)
  expect(output.unusedKeys[0]?.key).toStrictEqual("unused")
  expect(testProcess.exitCode).toBeFalsy()
})

test("--format json with no issues", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "all-keys-present"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--format",
    "json",
  ])

  const output = JSON.parse(testProcess.getStdout())

  expect(output.missingKeys).toHaveLength(0)
  expect(output.unusedKeys).toHaveLength(0)
  expect(testProcess.exitCode).toBeFalsy()
})

test("--format toon outputs machine-readable Toon format for missing keys", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "missing-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--format",
    "toon",
  ])

  const output = decodeToonObject(testProcess.getStdout())

  expect(output.missingKeys).toMatchObject([{ key: "missing.key", locales: ["en"] }])
  expect(output.unusedKeys).toMatchObject([])
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--format toon outputs machine-readable Toon format for unused keys", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "unused-keys"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--format",
    "toon",
  ])

  const output = decodeToonObject(testProcess.getStdout())

  expect(output.missingKeys).toMatchObject([])
  expect(output.unusedKeys).toMatchObject([{ key: "unused" }])
  expect(testProcess.exitCode).toBeFalsy()
})

test("--format toon with no issues", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "all-keys-present"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--format",
    "toon",
  ])

  const output = decodeToonObject(testProcess.getStdout())

  expect(output.missingKeys).toMatchObject([])
  expect(output.unusedKeys).toMatchObject([])
  expect(testProcess.exitCode).toBeFalsy()
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

test("dynamic keys check is off by default", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutNotContains(testProcess, "Dynamic keys")
  expectStdoutContains(testProcess, "Found 0 missing and 0 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("--dynamic-keys-severity alone enables the check in default full mode", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--dynamic-keys-severity",
    "error",
  ])

  expectStdoutContains(testProcess, "Dynamic keys (2):")
  expectStdoutContains(testProcess, "app.ts:11:3")
  expectStdoutContains(testProcess, "app.ts:12:3")
  expectStdoutNotContains(testProcess, "app.ts:9:3")
  expectStdoutNotContains(testProcess, "app.ts:10:3")
  expectStdoutNotContains(testProcess, "app.vue")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--dynamic-keys-mode=partial reports all dynamic keys with source locations and exits 1 on error", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--dynamic-keys-mode",
    "partial",
    "--dynamic-keys-severity",
    "error",
  ])

  expectStdoutContains(testProcess, "Dynamic keys (5):")
  expectStdoutContains(testProcess, "app.ts:9:3")
  expectStdoutContains(testProcess, "app.ts:10:3")
  expectStdoutContains(testProcess, "app.ts:11:3")
  expectStdoutContains(testProcess, "app.ts:12:3")
  expectStdoutContains(testProcess, "app.vue:3:15")
  expectStdoutContains(testProcess, "Found 0 missing, 0 unused, and 5 dynamic keys.")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--dynamic-keys-mode=full reports only fully dynamic keys", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--dynamic-keys-mode",
    "full",
    "--dynamic-keys-severity",
    "error",
  ])

  expectStdoutContains(testProcess, "Dynamic keys (2):")
  expectStdoutContains(testProcess, "app.ts:11:3")
  expectStdoutContains(testProcess, "app.ts:12:3")
  expectStdoutNotContains(testProcess, "app.ts:9:3")
  expectStdoutNotContains(testProcess, "app.ts:10:3")
  expectStdoutNotContains(testProcess, "app.vue")
  expectStdoutContains(testProcess, "Found 0 missing, 0 unused, and 2 dynamic keys.")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--dynamic-keys-severity=warning does not set exit code to 1", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--dynamic-keys-mode",
    "partial",
    "--dynamic-keys-severity",
    "warning",
  ])

  expectStdoutContains(testProcess, "Dynamic keys (5):")
  expect(testProcess.exitCode).toBeFalsy()
})

test("--dynamic-keys-severity=off suppresses dynamic keys output", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--dynamic-keys-mode",
    "partial",
    "--dynamic-keys-severity",
    "off",
  ])

  expectStdoutNotContains(testProcess, "Dynamic keys")
  expect(testProcess.exitCode).toBeFalsy()
})

test("--ignore-dynamic-keys and --ignore-keys suppress dynamic key reports", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--dynamic-keys-mode",
    "partial",
    "--dynamic-keys-severity",
    "error",
    "--ignore-dynamic-keys",
    "<dynamic>",
    "--ignore-keys",
    "status.<dynamic>",
  ])

  expectStdoutContains(testProcess, "Dynamic keys (2):")
  expectStdoutContains(testProcess, "app.ts:10:3")
  expectStdoutContains(testProcess, "app.vue:3:15")
  expectStdoutNotContains(testProcess, "app.ts:9:3")
  expectStdoutNotContains(testProcess, "app.ts:11:3")
  expectStdoutNotContains(testProcess, "app.ts:12:3")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--format json includes dynamic keys", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--dynamic-keys-mode",
    "full",
    "--dynamic-keys-severity",
    "error",
    "--format",
    "json",
  ])

  const output = JSON.parse(testProcess.getStdout())

  expect(output.missingKeys).toHaveLength(0)
  expect(output.unusedKeys).toHaveLength(0)
  expect(output.dynamicKeys).toHaveLength(2)
  expect(output.dynamicKeys[0]?.key).toStrictEqual("<dynamic>")
  expect(output.dynamicKeys[0]?.partial).toStrictEqual(false)
  expect(output.dynamicKeys[0]?.source.file).toContain("app.ts")
  expect(output.dynamicKeys[1]?.key).toStrictEqual("<dynamic>")
  expect(testProcess.exitCode).toStrictEqual(1)
})

test("--format json omits dynamic keys when the check is disabled", async () => {
  const testProcess = await runTest([
    resolve(FIXTURES, "dynamic-keys-check"),
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--format",
    "json",
  ])

  const output = JSON.parse(testProcess.getStdout())

  expect(output.missingKeys).toHaveLength(0)
  expect(output.unusedKeys).toHaveLength(0)
  expect(output.dynamicKeys).toBeUndefined()
  expect(testProcess.exitCode).toBeFalsy()
})

test("--config loads a custom config file instead of the project's config", async () => {
  const testProcess = await runTest([resolve(FIXTURES, "config-flag"), "--config", CUSTOM_CONFIG_PATH])

  expectStdoutNotContains(testProcess, "Found 1 missing")
  expectStdoutContains(testProcess, "Found 0 missing and 0 unused keys.")
  expect(testProcess.exitCode).toBeFalsy()
})
