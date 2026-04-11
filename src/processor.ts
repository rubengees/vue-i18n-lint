import type { LocaleFile, MissingKey, ProcessResult, SourceFile, UnusedKey } from "./types.ts"

export function processFiles(localeFiles: LocaleFile[], sourceFiles: SourceFile[]): ProcessResult {
  return {
    missing: calcMissingKeys(localeFiles, sourceFiles),
    unused: calcUnusedKeys(localeFiles, sourceFiles),
  }
}

function calcMissingKeys(localeFiles: LocaleFile[], sourceFiles: SourceFile[]) {
  const globalLocaleKeys = new Map(localeFiles.map((it) => [it.locale, new Set(it.keys)]))
  const locales = new Set([
    ...globalLocaleKeys.keys(),
    ...sourceFiles.flatMap((it) => it.localeFiles.map((it) => it.locale)),
  ])

  const missingKeys = new Map<string, MissingKey>()

  for (const sourceFile of sourceFiles) {
    const localLocaleKeys = new Map(sourceFile.localeFiles.map((it) => [it.locale, new Set(it.keys)]))

    for (const { key, file, location } of sourceFile.keys) {
      const missingLocales = locales
        .values()
        .filter((locale) => !localLocaleKeys.get(locale)?.has(key) && !globalLocaleKeys.get(locale)?.has(key))
        .map((locale) => locale)
        .toArray()

      if (missingLocales.length > 0) {
        const missingKey = getOrInsert(missingKeys, key, { key, locales: missingLocales, sources: [] })

        missingKey.sources.push({ file, location })
      }
    }
  }

  return missingKeys.values().toArray()
}

function calcUnusedKeys(localeFiles: LocaleFile[], sourceFiles: SourceFile[]): UnusedKey[] {
  const unusedKeys = new Map<string, UnusedKey>()
  let sourceKeys = new Set<string>()

  for (const sourceFile of sourceFiles) {
    const sourceFileKeys = new Set(sourceFile.keys.map((k) => k.key))

    for (const localeFile of sourceFile.localeFiles) {
      for (let key of localeFile.keys) {
        if (!sourceFileKeys.has(key)) {
          const unusedKey = getOrInsert(unusedKeys, key, { key, files: [] })

          unusedKey.files.push({ locale: localeFile.locale, file: localeFile.file, scope: "local" })
        }
      }
    }

    sourceKeys = sourceKeys.union(sourceFileKeys)
  }

  for (const localeFile of localeFiles) {
    for (let key of localeFile.keys) {
      if (!sourceKeys.has(key)) {
        const unusedKey = getOrInsert(unusedKeys, key, { key, files: [] })

        unusedKey.files.push({ locale: localeFile.locale, file: localeFile.file, scope: "global" })
      }
    }
  }

  return unusedKeys.values().toArray()
}

function getOrInsert<T>(map: Map<string, T>, key: string, defaultValue: T) {
  if (!map.has(key)) {
    map.set(key, defaultValue)
  }

  return map.get(key) as T
}
