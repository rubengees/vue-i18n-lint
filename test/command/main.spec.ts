import { resolve } from "node:path"
import { runMain } from "citty"
import { afterEach, expect, test, vi } from "vitest"
import { mainCommand } from "../../src/command/main.ts"

const FIXTURES = "test/fixtures/projects"
const DEFAULT_LOCALE_PATTERN = "**/locales/*.json"
const DEFAULT_SRC_PATTERN = "**/*.{ts,cts,mts,js,cjs,mjs,vue}"

afterEach(() => {
  vi.restoreAllMocks()
})

function mockSideEffects() {
  const log = vi.spyOn(console, "log").mockImplementation(() => {})
  const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
  return { log, exit }
}

function run(path: string, extra: string[] = []) {
  return runMain(mainCommand, { rawArgs: [path, ...extra] })
}

test("reports no issues when all keys are present", async () => {
  const { log, exit } = mockSideEffects()

  await run(resolve(FIXTURES, "all-keys-present"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expect(log).toHaveBeenCalledWith(expect.stringContaining("Found 0 missing and 0 unused keys."))
  expect(exit).toHaveBeenCalledWith(0)
})

test("exits 1 and reports missing key count when keys are missing", async () => {
  const { log, exit } = mockSideEffects()

  await run(resolve(FIXTURES, "missing-keys"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expect(log).toHaveBeenCalledWith(expect.stringContaining("Missing keys (1):"))
  expect(log).toHaveBeenCalledWith(expect.stringContaining("missing.key"))
  expect(log).toHaveBeenCalledWith(expect.stringContaining("Found 1 missing and 0 unused keys."))
  expect(exit).toHaveBeenCalledWith(1)
})

test("reports unused key count when keys are unused", async () => {
  const { log, exit } = mockSideEffects()

  await run(resolve(FIXTURES, "unused-keys"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expect(log).toHaveBeenCalledWith(expect.stringContaining("Unused keys (1):"))
  expect(log).toHaveBeenCalledWith(expect.stringContaining("Found 0 missing and 1 unused keys."))
  expect(exit).toHaveBeenCalledWith(0)
})

test("exits 1 and reports both counts when keys are missing and unused", async () => {
  const { log, exit } = mockSideEffects()

  await run(resolve(FIXTURES, "mixed"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  expect(log).toHaveBeenCalledWith(expect.stringContaining("Missing keys (1):"))
  expect(log).toHaveBeenCalledWith(expect.stringContaining("Unused keys (1):"))
  expect(log).toHaveBeenCalledWith(expect.stringContaining("Found 1 missing and 1 unused keys."))
  expect(exit).toHaveBeenCalledWith(1)
})

test("respects ignorePatterns and skips excluded source files", async () => {
  const { log, exit } = mockSideEffects()

  await run(resolve(FIXTURES, "missing-keys"), [
    "--localePattern",
    DEFAULT_LOCALE_PATTERN,
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
    "--ignorePatterns",
    "src/**",
  ])

  // No source files scanned → no missing keys
  expect(log).toHaveBeenCalledWith(expect.stringContaining("Found 0 missing"))
  expect(exit).toHaveBeenCalledWith(0)
})

test("respects srcPattern and only scans matching source files", async () => {
  // multi-src has hello + world in i18n; app.ts uses hello, other.ts uses world
  // restricting to only app.ts leaves world as unused
  const { log, exit } = mockSideEffects()

  await run(resolve(FIXTURES, "multi-src"), ["--localePattern", DEFAULT_LOCALE_PATTERN, "--srcPattern", "src/app.ts"])

  expect(log).toHaveBeenCalledWith(expect.stringContaining("Found 0 missing and 1 unused keys."))
  expect(exit).toHaveBeenCalledWith(0)
})

test("respects localePattern and reads only matching locale files", async () => {
  const { log, exit } = mockSideEffects()

  await run(resolve(FIXTURES, "all-keys-present"), [
    "--localePattern",
    "**/translations/*.json",
    "--srcPattern",
    DEFAULT_SRC_PATTERN,
  ])

  // No i18n files found → no missing, no unused
  expect(log).toHaveBeenCalledWith(expect.stringContaining("Found 0 missing and 0 unused keys."))
  expect(exit).toHaveBeenCalledWith(0)
})
