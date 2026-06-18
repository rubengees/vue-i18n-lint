import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { afterEach, beforeEach, expect, test } from "vitest"
import { expectStderrContains, expectStdoutContains, runTest } from "../helpers.ts"

let tempDir: string

beforeEach(async () => {
  tempDir = await mkdtemp(resolve(tmpdir(), "vue-i18n-lint-init-"))
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

test("creates a default vue-i18n-lint.config.ts in the specified directory", async () => {
  const testProcess = await runTest(["init", tempDir])

  expect(testProcess.exitCode).toBeFalsy()
  expectStdoutContains(testProcess, `Created vue-i18n-lint.config.ts in file://${tempDir}.`)

  const content = await readFile(resolve(tempDir, "vue-i18n-lint.config.ts"), "utf-8")
  expect(content).toContain("defineConfig")
  expect(content).toContain("localePattern")
  expect(content).toContain("srcPattern")
})

test("errors when vue-i18n-lint.config.ts already exists", async () => {
  await runTest(["init", tempDir])

  const testProcess = await runTest(["init", tempDir])

  expect(testProcess.exitCode).toStrictEqual(1)
  expectStderrContains(testProcess, `vue-i18n-lint.config.ts already exists in file://${tempDir}.`)
})
