import { Writable } from "node:stream"
import { run, type StricliProcess } from "@stricli/core"
import { decode } from "@toon-format/toon"
import { expect } from "vitest"
import { app } from "../src/app.ts"
import { isPlainObject } from "../src/utils.ts"

type TestProcessStreams = {
  readonly stdout: RecordingWritable
  readonly stderr: RecordingWritable
}

export type TestProcess = StricliProcess & TestProcessStreams

export async function runTest(args: string[]): Promise<TestProcess> {
  const testProcess = buildTestProcess()

  await run(app, args, { process: testProcess })

  return testProcess
}

export function buildTestProcess(): TestProcess {
  const stdout = new RecordingWritable()
  const stderr = new RecordingWritable()

  return {
    stdout,
    stderr,
  }
}

class RecordingWritable extends Writable {
  chunks: Buffer[] = []

  _write(chunk: Buffer, _enc: BufferEncoding, cb: () => void) {
    this.chunks.push(chunk)
    cb()
  }

  get text() {
    return Buffer.concat(this.chunks).toString("utf8")
  }
}

export function expectStdoutContains(testProcess: TestProcess, text: string): void {
  expect(testProcess.stdout.text).toContain(text)
}

export function expectStdoutNotContains(testProcess: TestProcess, text: string): void {
  expect(testProcess.stdout.text).not.toContain(text)
}

export function expectStderrContains(testProcess: TestProcess, text: string): void {
  expect(testProcess.stderr.text).toContain(text)
}

export function decodeToonObject(input: string): Record<string, unknown> {
  const raw: unknown = decode(input)

  if (!isPlainObject(raw)) {
    throw new Error("Expected an object")
  }

  return raw
}
