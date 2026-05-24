import { resolve } from "node:path"
import { createDefu } from "defu"

export const merge = createDefu((obj, key, value) => {
  if (Array.isArray(value)) {
    obj[key] = value
    return true
  }

  return false
})

export function split(value: string): string[]
export function split(value: string | null | undefined): string[] | undefined
export function split(value: string | null | undefined): string[] | undefined {
  if (value == null) return undefined

  return value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

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

/**
 * Converts a dynamic key pattern (containing `*` wildcards) to a regular expression.
 * Each `*` matches one or more dot-separated key segments (at least one segment is required).
 * For example, the pattern `"a.b.*.c"` matches `"a.b.x.c"` and `"a.b.x.y.c"`,
 * but not `"a.b.c"` (no segment for the wildcard).
 */
export function dynamicKeyToRegex(pattern: string): RegExp {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.+^${}()|[\]\\]/g, "\\$&"))
    .join("[^.]+(?:\\.[^.]+)*")

  return new RegExp(`^${escaped}$`)
}

export function offsetToPosition(source: string, offset: number): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n")

  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  }
}

export function formatFilePath(filePath: string, line?: number, column?: number) {
  const base = `file://${resolve(filePath)}`

  if (line != null && column != null) return `${base}:${line}:${column}`
  if (line != null) return `${base}:${line}`

  return base
}
