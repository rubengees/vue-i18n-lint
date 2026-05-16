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
