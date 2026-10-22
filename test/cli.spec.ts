import { spawnSync } from "node:child_process"
import { resolve } from "node:path"
import { expect, test } from "vitest"

const FIXTURES = "test/fixtures/projects"
const DEFAULT_ARGS = ["--locale-pattern", "**/locales/*.json", "--src-pattern", "**/*.{ts,cts,mts,js,cjs,mjs,vue}"]

type CliResult = {
  exitCode: number
  stdout: string
  stderr: string
}

function runCli(args: string[]): CliResult {
  const result = spawnSync(process.execPath, ["--import", "jiti/register", "src/cli.ts", ...args], {
    encoding: "utf8",
  })

  return {
    exitCode: result.status ?? -1,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

test("exits with code 0 when no issues are found", () => {
  const result = runCli([resolve(FIXTURES, "all-keys-present"), ...DEFAULT_ARGS])

  expect(result.exitCode).toStrictEqual(0)
  expect(result.stdout).toContain("Found 0 missing and 0 unused keys.")
})

test("exits with code 1 when missing keys are found", () => {
  const result = runCli([resolve(FIXTURES, "missing-keys"), ...DEFAULT_ARGS])

  expect(result.exitCode).toStrictEqual(1)
  expect(result.stdout).toContain("Missing keys (1):")
})

test("exits with code 1 when a file cannot be parsed", () => {
  const result = runCli([resolve(FIXTURES, "parse-error"), ...DEFAULT_ARGS])

  expect(result.exitCode).toStrictEqual(1)
  expect(result.stderr).toContain("Failed to process:")
})
