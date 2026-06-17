import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { runCommand } from "citty"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { mainCommand } from "../../src/command/main.ts"
import { expectErrorLogged, expectLogged } from "../helpers.ts"

let tempDir: string

beforeEach(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})

  tempDir = await mkdtemp(resolve(tmpdir(), "vue-i18n-lint-init-"))
})

afterEach(async () => {
  vi.restoreAllMocks()

  await rm(tempDir, { recursive: true, force: true })
})

test("creates a default vue-i18n-lint.config.ts in the specified directory", async () => {
  const { result } = await runCommand(mainCommand, { rawArgs: ["init", tempDir] })

  expect(result).toStrictEqual(0)
  expectLogged(`Created vue-i18n-lint.config.ts in file://${tempDir}.`)

  const content = await readFile(resolve(tempDir, "vue-i18n-lint.config.ts"), "utf-8")
  expect(content).toContain("defineConfig")
  expect(content).toContain("localePattern")
  expect(content).toContain("srcPattern")
})

test("errors when vue-i18n-lint.config.ts already exists", async () => {
  await runCommand(mainCommand, { rawArgs: ["init", tempDir] })

  const { result } = await runCommand(mainCommand, { rawArgs: ["init", tempDir] })

  expect(result).toStrictEqual(1)
  expectErrorLogged(`vue-i18n-lint.config.ts already exists in file://${tempDir}.`)
})
