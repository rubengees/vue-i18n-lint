import type { WriteStream as FSWriteStream } from "node:fs"
import { mkdirSync } from "node:fs"
import { open } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import type { Writable } from "node:stream"
import { finished } from "node:stream/promises"
import { pathToFileURL } from "node:url"
import { createDefu } from "defu"

export const merge = createDefu((obj, key, value) => {
  if (Array.isArray(value)) {
    obj[key] = value
    return true
  }

  return false
})

/**
 * A `PrefixSet` represents a set of dot-separated keys together with all of
 * their dot-segment prefixes. For the input `["a.b.c"]` it contains
 * `"a"`, `"a.b"` and `"a.b.c"`.
 */
export type PrefixSet = Set<string>

export function newPrefixSet(keys: Iterable<string> = []): PrefixSet {
  const set = new Set<string>()

  for (const key of keys) {
    const parts = key.split(".")

    for (let i = 1; i <= parts.length; i++) {
      set.add(parts.slice(0, i).join("."))
    }
  }

  return set
}

export function mapGetOrInsert<T>(map: Map<string, T>, key: string, defaultValue: T) {
  if (!map.has(key)) {
    map.set(key, defaultValue)
  }

  return map.get(key)!
}

export function getOrInsertComputed<T>(map: Map<string, T>, key: string, callback: (key: string) => T) {
  if (!map.has(key)) {
    map.set(key, callback(key))
  }

  return map.get(key)!
}

export function offsetToPosition(source: string, offset: number): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n")

  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  }
}

export function writeLine(stream: Writable, line: string = ""): void {
  stream.write(`${line}\n`)
}

export function formatFilePath(filePath: string, line?: number, column?: number) {
  const base = pathToFileURL(resolve(filePath)).href

  if (line != null && column != null) return `${base}:${line}:${column}`
  if (line != null) return `${base}:${line}`

  return base
}

type DisposableWriteStream = FSWriteStream & AsyncDisposable

export async function createDisposableWriteStream(path: string): Promise<DisposableWriteStream> {
  const dir = dirname(path)

  try {
    mkdirSync(dir, { recursive: true })
  } catch (e) {
    throw new Error(`Failed to create output directory ${formatFilePath(dir)}`, { cause: e })
  }

  try {
    const handle = await open(path, "w")
    const stream = handle.createWriteStream()

    stream.on("error", () => {})

    return Object.assign(stream, {
      async [Symbol.asyncDispose]() {
        const destroyAndThrow = (err: unknown) => {
          stream.destroy()
          throw new Error(`Failed to write to output file ${formatFilePath(path)}`, { cause: err })
        }

        if (stream.errored) {
          destroyAndThrow(stream.errored)
        }

        stream.end()

        try {
          await finished(stream)
        } catch (err) {
          destroyAndThrow(err)
        }
      },
    })
  } catch (e) {
    throw new Error(`Failed to open output file ${formatFilePath(path)}`, { cause: e })
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}
