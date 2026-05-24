import { resolve } from "node:path"
import { runCommand } from "citty"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { mainCommand } from "../../src/command/main.ts"
import { expectErrorLogged, expectLogged } from "../helpers.ts"

const FIXTURES = "test/fixtures/projects"
const DEFAULT_LOCALE_PATTERN = "**/locales/*.json"
const DEFAULT_SRC_PATTERN = "**/*.{ts,cts,mts,js,cjs,mjs,vue}"

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function run(path: string, extra: string[] = []) {
  const { result } = await runCommand(mainCommand, { rawArgs: [path, ...extra] })

  return result
}

test("reports no issues when all keys are present", async () => {
  const result = await run(resolve(FIXTURES, "all-keys-present"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Found 0 missing and 0 unused keys.")
  expect(result).toStrictEqual(0)
})

test("exits 1 and reports missing key count when keys are missing", async () => {
  const result = await run(resolve(FIXTURES, "missing-keys"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Missing keys (1):")
  expectLogged("missing.key")
  expectLogged("Found 1 missing and 0 unused keys.")
  expect(result).toStrictEqual(1)
})

test("reports unused key count when keys are unused", async () => {
  const result = await run(resolve(FIXTURES, "unused-keys"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Unused keys (1):")
  expectLogged("Found 0 missing and 1 unused keys.")
  expect(result).toStrictEqual(0)
})

test("exits 1 and reports both counts when keys are missing and unused", async () => {
  const result = await run(resolve(FIXTURES, "mixed"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Missing keys (1):")
  expectLogged("Unused keys (1):")
  expectLogged("Found 1 missing and 1 unused keys.")
  expect(result).toStrictEqual(1)
})

test("respects ignorePatterns and skips excluded source files", async () => {
  const result = await run(resolve(FIXTURES, "missing-keys"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--ignore-patterns",
    "src/**",
  ])

  expectLogged("Found 0 missing")
  expect(result).toStrictEqual(0)
})

test("respects srcPattern and only scans matching source files", async () => {
  const result = await run(resolve(FIXTURES, "multi-src"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    "src/app.ts",
  ])

  expectLogged("Found 0 missing and 1 unused keys.")
  expect(result).toStrictEqual(0)
})

test("respects localePattern and reads only matching locale files", async () => {
  const result = await run(resolve(FIXTURES, "all-keys-present"), [
    "--locale-pattern",
    "**/translations/*.json",
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Found 0 missing and 0 unused keys.")
  expect(result).toStrictEqual(0)
})

test("reports type warnings and exits 0 when locale file contains non-string values", async () => {
  const result = await run(resolve(FIXTURES, "type-warnings"), [
    "--locale-pattern",
    "**/locales/*.{json,ts}",
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Warnings (5):")
  expectLogged("Unexpected type number for key count")
  expectLogged("Unexpected type boolean for key bool")
  expectLogged("Unexpected type null for key null")
  expectLogged("Unexpected type number for key arr.1")
  expectLogged("Unexpected type boolean for key arr.2")
  expectLogged("Found 0 missing and 6 unused keys.")
  expect(result).toStrictEqual(0)
})

test("treats a locale leaf key as used when source uses a prefix of it", async () => {
  const result = await run(resolve(FIXTURES, "partial-key-used"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Found 0 missing and 0 unused keys.")
  expect(result).toStrictEqual(0)
})

test("reports a locale leaf key as missing when source uses a sibling key, not a prefix", async () => {
  const result = await run(resolve(FIXTURES, "partial-key-missing"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Missing keys (1):")
  expectLogged("aa.bb.1")
  expectLogged("Unused keys (1):")
  expectLogged("aa.bb.0")
  expectLogged("Found 1 missing and 1 unused keys.")
  expect(result).toStrictEqual(1)
})

test("handles <i18n> blocks", async () => {
  const result = await run(resolve(FIXTURES, "i18n-block"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Missing keys (1):")
  expectLogged("block-missing")
  expectLogged("Found 1 missing and 0 unused keys.")
  expect(result).toStrictEqual(1)
})

test("skips unparseable files, logs an error, and exits 1", async () => {
  const result = await run(resolve(FIXTURES, "parse-error"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectErrorLogged("Failed to process:")
  expectLogged("1 file skipped due to errors")
  expect(result).toStrictEqual(1)
})

test("--ignore-keys suppresses keys from both missing and unused checks", async () => {
  const result = await run(resolve(FIXTURES, "mixed"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--ignore-keys",
    "missing.key,unused",
  ])

  expectLogged("Found 0 missing and 0 unused keys.")
  expect(result).toStrictEqual(0)
})

test("config file checks.missingKeys.ignore and checks.unusedKeys.ignore suppress keys", async () => {
  const result = await run(resolve(FIXTURES, "ignore-keys-config"), [
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Found 0 missing and 0 unused keys.")
  expect(result).toStrictEqual(0)
})
