import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
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

test("creates a default .ts config when tsconfig.json exists", async () => {
  await writeFile(resolve(tempDir, "tsconfig.json"), "{}", "utf-8")

  const testProcess = await runTest(["init", tempDir])

  expect(testProcess.exitCode).toBeFalsy()
  expectStdoutContains(testProcess, `Created vue-i18n-lint.config.ts in file://${tempDir}.`)

  const content = await readFile(resolve(tempDir, "vue-i18n-lint.config.ts"), "utf-8")
  expect(content).toContain("defineConfig")
  expect(content).toContain("localePattern")
  expect(content).toContain("srcPattern")
})

test("creates a default .js config when no tsconfig.json exists", async () => {
  const testProcess = await runTest(["init", tempDir])

  expect(testProcess.exitCode).toBeFalsy()
  expectStdoutContains(testProcess, `Created vue-i18n-lint.config.js in file://${tempDir}.`)

  const content = await readFile(resolve(tempDir, "vue-i18n-lint.config.js"), "utf-8")
  expect(content).toContain("defineConfig")
  expect(content).toContain("localePattern")
  expect(content).toContain("srcPattern")
})

test("creates a .ts config with --format ts", async () => {
  const testProcess = await runTest(["init", "--format", "ts", tempDir])

  expect(testProcess.exitCode).toBeFalsy()
  expectStdoutContains(testProcess, `Created vue-i18n-lint.config.ts in file://${tempDir}.`)

  const content = await readFile(resolve(tempDir, "vue-i18n-lint.config.ts"), "utf-8")
  expect(content).toContain("defineConfig")
})

test("creates a .js config with --format js", async () => {
  const testProcess = await runTest(["init", "--format", "js", tempDir])

  expect(testProcess.exitCode).toBeFalsy()
  expectStdoutContains(testProcess, `Created vue-i18n-lint.config.js in file://${tempDir}.`)

  const content = await readFile(resolve(tempDir, "vue-i18n-lint.config.js"), "utf-8")
  expect(content).toContain("defineConfig")
})

test("creates a .json config with --format json", async () => {
  const testProcess = await runTest(["init", "--format", "json", tempDir])

  expect(testProcess.exitCode).toBeFalsy()
  expectStdoutContains(testProcess, `Created vue-i18n-lint.config.json in file://${tempDir}.`)

  const content = await readFile(resolve(tempDir, "vue-i18n-lint.config.json"), "utf-8")
  expect(content).toContain("localePattern")
  expect(content).toContain("srcPattern")
})

test("creates a .yaml config with --format yaml", async () => {
  const testProcess = await runTest(["init", "--format", "yaml", tempDir])

  expect(testProcess.exitCode).toBeFalsy()
  expectStdoutContains(testProcess, `Created vue-i18n-lint.config.yaml in file://${tempDir}.`)

  const content = await readFile(resolve(tempDir, "vue-i18n-lint.config.yaml"), "utf-8")
  expect(content).toContain("localePattern")
  expect(content).toContain("srcPattern")
})

test("errors when config already exists", async () => {
  await runTest(["init", tempDir])

  const testProcess = await runTest(["init", tempDir])

  expect(testProcess.exitCode).toStrictEqual(1)
  expectStderrContains(testProcess, `vue-i18n-lint.config.js already exists in file://${tempDir}.`)
})
