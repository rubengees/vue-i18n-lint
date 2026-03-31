import { resolve } from "node:path"
import { stripVTControlCharacters } from "node:util"
import { runMain } from "citty"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { mainCommand } from "../../src/command/main.ts"

const FIXTURES = "test/fixtures/projects"
const DEFAULT_LOCALE_PATTERN = "**/locales/*.json"
const DEFAULT_SRC_PATTERN = "**/*.{ts,cts,mts,js,cjs,mjs,vue}"

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function run(path: string, extra: string[] = []) {
  return runMain(mainCommand, { rawArgs: [path, ...extra] })
}

function expectLogged(text: string) {
  const lines = vi.mocked(console.log).mock.calls.map((args) => stripVTControlCharacters(args[0]?.toString() ?? ""))

  expect(lines).toEqual(expect.arrayContaining([expect.stringContaining(text)]))
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
