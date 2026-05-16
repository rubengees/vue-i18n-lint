import { resolve } from "node:path"
import { runMain } from "citty"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { mainCommand } from "../../src/command/main.ts"
import { expectLogged } from "../helpers.ts"

const FIXTURES = "test/fixtures/projects"
const DEFAULT_LOCALE_PATTERN = "**/locales/*.json"
const DEFAULT_SRC_PATTERN = "**/*.{ts,cts,mts,js,cjs,mjs,vue}"

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(process, "exit").mockImplementation(vi.fn<(code?: number | string | null) => never>())
})

afterEach(() => {
  vi.restoreAllMocks()
})

function run(path: string, extra: string[] = []) {
  return runMain(mainCommand, { rawArgs: [path, ...extra] })
}

test("reports no issues when all keys are present", async () => {
  await run(resolve(FIXTURES, "all-keys-present"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Found 0 missing and 0 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(0)
})

test("exits 1 and reports missing key count when keys are missing", async () => {
  await run(resolve(FIXTURES, "missing-keys"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Missing keys (1):")
  expectLogged("missing.key")
  expectLogged("Found 1 missing and 0 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(1)
})

test("reports unused key count when keys are unused", async () => {
  await run(resolve(FIXTURES, "unused-keys"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Unused keys (1):")
  expectLogged("Found 0 missing and 1 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(0)
})

test("exits 1 and reports both counts when keys are missing and unused", async () => {
  await run(resolve(FIXTURES, "mixed"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Missing keys (1):")
  expectLogged("Unused keys (1):")
  expectLogged("Found 1 missing and 1 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(1)
})

test("respects ignorePatterns and skips excluded source files", async () => {
  await run(resolve(FIXTURES, "missing-keys"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
    "--ignorePatterns",
    "src/**",
  ])

  expectLogged("Found 0 missing")
  expect(process.exit).toHaveBeenCalledWith(0)
})

test("respects srcPattern and only scans matching source files", async () => {
  await run(resolve(FIXTURES, "multi-src"), ["--localePattern", DEFAULT_LOCALE_PATTERN, "--srcPattern", "src/app.ts"])

  expectLogged("Found 0 missing and 1 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(0)
})

test("respects localePattern and reads only matching locale files", async () => {
  await run(resolve(FIXTURES, "all-keys-present"), [
    "--localePattern",
    "**/translations/*.json",
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Found 0 missing and 0 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(0)
})

test("reports type warnings and exits 0 when locale file contains non-string values", async () => {
  await run(resolve(FIXTURES, "type-warnings"), [
    "--localePattern",
    "**/locales/*.{json,ts}",
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Warnings (5):")
  expectLogged("Unexpected type number for key count")
  expectLogged("Unexpected type boolean for key bool")
  expectLogged("Unexpected type null for key null")
  expectLogged("Unexpected type number for key arr.1")
  expectLogged("Unexpected type boolean for key arr.2")
  expectLogged("Found 0 missing and 6 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(0)
})

test("treats a locale leaf key as used when source uses a prefix of it", async () => {
  await run(resolve(FIXTURES, "partial-key-used"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Found 0 missing and 0 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(0)
})

test("reports a locale leaf key as missing when source uses a sibling key, not a prefix", async () => {
  await run(resolve(FIXTURES, "partial-key-missing"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Missing keys (1):")
  expectLogged("aa.bb.1")
  expectLogged("Unused keys (1):")
  expectLogged("aa.bb.0")
  expectLogged("Found 1 missing and 1 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(1)
})

test("handles <i18n> blocks", async () => {
  await run(resolve(FIXTURES, "i18n-block"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectLogged("Missing keys (1):")
  expectLogged("block-missing")
  expectLogged("Found 1 missing and 0 unused keys.")
  expect(process.exit).toHaveBeenCalledWith(1)
})
