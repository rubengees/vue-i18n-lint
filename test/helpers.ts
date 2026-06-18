import { stripVTControlCharacters } from "node:util"
import { run, type StricliProcess } from "@stricli/core"
import { expect } from "vitest"
import { app } from "../src/app.ts"

export type TestProcess = StricliProcess & {
  readonly getStdout: () => string
  readonly getStderr: () => string
}

export async function runTest(args: string[]) {
  const testProcess = buildTestProcess()

  await run(app, args, { process: testProcess })

  return testProcess
}

export function buildTestProcess(): TestProcess {
  const stdoutChunks: string[] = []
  const stderrChunks: string[] = []

  return {
    stdout: {
      write(s: string) {
        stdoutChunks.push(s)
      },
    },
    stderr: {
      write(s: string) {
        stderrChunks.push(s)
      },
    },
    getStdout() {
      return stripVTControlCharacters(stdoutChunks.join(""))
    },
    getStderr() {
      return stripVTControlCharacters(stderrChunks.join(""))
    },
  }
}

export function expectStdoutContains(testProcess: TestProcess, text: string): void {
  expect(testProcess.getStdout()).toContain(text)
}

export function expectStdoutNotContains(testProcess: TestProcess, text: string): void {
  expect(testProcess.getStdout()).not.toContain(text)
}

export function expectStderrContains(testProcess: TestProcess, text: string): void {
  expect(testProcess.getStderr()).toContain(text)
}
