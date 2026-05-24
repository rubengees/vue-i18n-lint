import type { ProcessResult } from "./types.ts"

export type FilterOptions = {
  ignoreKeys?: string[]
  missingKeys?: { ignore?: string[] }
  unusedKeys?: { ignore?: string[] }
}

export function filterResults(results: ProcessResult, options: FilterOptions = {}): ProcessResult {
  const { ignoreKeys = [], missingKeys = {}, unusedKeys = {} } = options
  const ignoreMissingSet = new Set([...ignoreKeys, ...(missingKeys.ignore ?? [])])
  const ignoreUnusedSet = new Set([...ignoreKeys, ...(unusedKeys.ignore ?? [])])

  return {
    typeWarnings: results.typeWarnings,
    missing: results.missing.filter((entry) => !ignoreMissingSet.has(entry.key)),
    unused: results.unused.filter((entry) => !ignoreUnusedSet.has(entry.key)),
  }
}
