import { resolve } from "node:path"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { outputMissingKeys, outputTypeWarnings, outputUnusedKeys } from "../src/formatter.ts"
import type { LocaleTypeWarning, MissingKey, UnusedKey } from "../src/types.ts"
import { expectLogged } from "./helpers.ts"

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

const location = { start: { line: 1, column: 1 }, end: { line: 1, column: 4 } }

test("outputMissingKeys prints key location and code frame", () => {
  const file = resolve("test/fixtures/ts/script.ts")
  const key: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location }] }

  outputMissingKeys([key])

  expectLogged("Missing keys (1)")
  expectLogged("script.ts")
})

test("outputMissingKeys throws when source file cannot be read", () => {
  const file = resolve("test/fixtures/does-not-exist.ts")
  const key: MissingKey = { key: "a", locales: ["de"], sources: [{ file, location }] }

  expect(() => outputMissingKeys([key])).toThrow("Failed to read file for code frame")
})

test("outputUnusedKeys prints a table of unused keys", () => {
  const key: UnusedKey = { key: "old.key", files: [{ locale: "en", file: "en.json", scope: "global" }] }

  outputUnusedKeys([key])

  expectLogged("Unused keys (1)")
  expectLogged("old.key")
})

test("outputTypeWarnings prints warnings grouped by file", () => {
  const warning: LocaleTypeWarning = { key: "count", locale: "en", file: "en.json", type: "number" }

  outputTypeWarnings([warning])

  expectLogged("Warnings (1)")
  expectLogged("count")
})
