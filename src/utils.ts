import { Trie } from "mnemonist"

export function newTrie(keys: string[] = []): Trie<string[]> {
  const trie = new Trie<string[]>(Array)

  for (const key of keys) {
    trie.add(key.split("."))
  }

  return trie
}

export function trieCoversKey(trie: Trie<string[]>, key: string): boolean {
  const parts = key.split(".")

  return trie.find(parts).length > 0
}

export function mapGetOrInsert<T>(map: Map<string, T>, key: string, defaultValue: T) {
  if (!map.has(key)) {
    map.set(key, defaultValue)
  }

  return map.get(key)!
}
