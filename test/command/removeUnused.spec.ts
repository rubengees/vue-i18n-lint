import { cp, mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { afterEach, beforeEach, expect, test } from "vitest"
import { expectStdoutContains, runTest } from "../helpers.ts"

const FIXTURES = resolve("test/fixtures/projects")
const DEFAULT_LOCALE_PATTERN = "**/locales/*.json"
const DEFAULT_SRC_PATTERN = "**/*.{ts,cts,mts,js,cjs,mjs,vue}"

let tempDir: string

beforeEach(async () => {
  tempDir = await mkdtemp(resolve(tmpdir(), "vue-i18n-lint-remove-unused-"))
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

test("dry-run prints count without modifying files", async () => {
  const projectDir = await copyFixture("unused-keys")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--dry-run",
  ])

  expectStdoutContains(testProcess, "Would remove 1 unused key.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ hello: "Hello", unused: "Unused" })
  expect(testProcess.exitCode).toBeFalsy()
})

test("removes unused key from locale file", async () => {
  const projectDir = await copyFixture("unused-keys")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Removed 1 unused key.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ hello: "Hello" })
  expect(testProcess.exitCode).toBeFalsy()
})

test("removes nested unused key and cleans up empty parents", async () => {
  const projectDir = await copyFixture("remove-unused-nested")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Removed 1 unused key.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ hello: "Hello", nested: { world: "World" } })
  expect(testProcess.exitCode).toBeFalsy()
})

test("does not remove parent when sibling keys remain", async () => {
  const projectDir = await copyFixture("remove-unused-sibling")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Removed 1 unused key.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ hello: "Hello", nested: { used: "Used" } })
  expect(testProcess.exitCode).toBeFalsy()
})

test("reports no unused keys when all keys are used", async () => {
  const projectDir = await copyFixture("all-keys-present")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "No unused keys found.")
  expect(testProcess.exitCode).toBeFalsy()
})

test("supports --ignore-keys to skip specific keys", async () => {
  const projectDir = await copyFixture("remove-unused-ignore")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--ignore-keys",
    "unused",
  ])

  expectStdoutContains(testProcess, "Removed 1 unused key.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ hello: "Hello", unused: "Unused" })
  expect(testProcess.exitCode).toBeFalsy()
})

test("supports --ignore-unused-keys to skip specific keys", async () => {
  const projectDir = await copyFixture("unused-keys")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
    "--ignore-unused-keys",
    "unused",
  ])

  expectStdoutContains(testProcess, "No unused keys found.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ hello: "Hello", unused: "Unused" })
  expect(testProcess.exitCode).toBeFalsy()
})

test("removes unused keys from multiple locale files", async () => {
  const projectDir = await copyFixture("remove-unused-multi-locale")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Removed 2 unused keys.")

  const enContent = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(enContent)).toStrictEqual({ hello: "Hello" })

  const frContent = await readFixture(projectDir, "locales/fr.json")
  expect(JSON.parse(frContent)).toStrictEqual({ hello: "Bonjour" })
  expect(testProcess.exitCode).toBeFalsy()
})

test("removes unused array element key", async () => {
  const projectDir = await copyFixture("remove-unused-array-element")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Removed 1 unused key.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ messages: ["Hello", "Hey"] })
  expect(testProcess.exitCode).toBeFalsy()
})

test("removes entire array when all elements are unused", async () => {
  const projectDir = await copyFixture("remove-unused-array-all")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Removed 2 unused keys.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ greeting: "Hi" })
  expect(testProcess.exitCode).toBeFalsy()
})

test("removes unused nested key from array element object", async () => {
  const projectDir = await copyFixture("remove-unused-array-nested")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    DEFAULT_LOCALE_PATTERN,
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Removed 1 unused key.")

  const content = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(content)).toStrictEqual({ items: [{ name: "A" }, { name: "B" }] })
  expect(testProcess.exitCode).toBeFalsy()
})

test("skips .ts locale files and local <i18n> blocks", async () => {
  const projectDir = await copyFixture("remove-unused-unsupported")

  const testProcess = await runTest([
    "remove-unused",
    projectDir,
    "--locale-pattern",
    "**/locales/*.{json,ts}",
    "--src-pattern",
    DEFAULT_SRC_PATTERN,
  ])

  expectStdoutContains(testProcess, "Removed 1 unused key.")

  const enContent = await readFixture(projectDir, "locales/en.json")
  expect(JSON.parse(enContent)).toStrictEqual({ hello: "Hello" })

  const frContent = await readFixture(projectDir, "locales/fr.ts")
  expect(frContent).toContain("hello")
  expect(frContent).toContain("unused")

  const vueContent = await readFixture(projectDir, "src/app.vue")
  expect(vueContent).toContain("unused-block")

  expect(testProcess.exitCode).toBeFalsy()
})

async function copyFixture(name: string): Promise<string> {
  const projectDir = resolve(tempDir, name)

  await cp(resolve(FIXTURES, name), projectDir, { recursive: true })

  return projectDir
}

async function readFixture(projectDir: string, filePath: string): Promise<string> {
  return await readFile(resolve(projectDir, filePath), "utf-8")
}
