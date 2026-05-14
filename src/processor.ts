import type { LocaleFile, LocaleTypeWarning, MissingKey, ProcessResult, SourceFile, UnusedKey } from "./types.ts"

export function processFiles(localeFiles: LocaleFile[], sourceFiles: SourceFile[]): ProcessResult {
  return {
    typeWarnings: calcTypeWarnings(localeFiles),
    missing: calcMissingKeys(localeFiles, sourceFiles),
    unused: calcUnusedKeys(localeFiles, sourceFiles),
  }
}

function calcTypeWarnings(localeFiles: LocaleFile[]): LocaleTypeWarning[] {
  return localeFiles.flatMap((localeFile) =>
    localeFile.keys
      .filter((key) => key.type !== "string" && key.type !== "function")
      .map((key) => ({
        key: key.key,
        locale: localeFile.locale,
        file: localeFile.file,
        type: key.type,
      })),
  )
}

function calcMissingKeys(localeFiles: LocaleFile[], sourceFiles: SourceFile[]) {
  const globalLocaleKeys = new Map(localeFiles.map((it) => [it.locale, new Set(it.keys.map((k) => k.key))]))
  const locales = new Set([
    ...globalLocaleKeys.keys(),
    ...sourceFiles.flatMap((it) => it.localeFiles.map((it) => it.locale)),
  ])

  const missingKeys = new Map<string, MissingKey>()

  for (const sourceFile of sourceFiles) {
    const localLocaleKeys = new Map(sourceFile.localeFiles.map((it) => [it.locale, new Set(it.keys.map((k) => k.key))]))

    for (const { key, file, location } of sourceFile.keys) {
      const missingLocales = Array.from(locales).filter(
        (locale) => !localLocaleKeys.get(locale)?.has(key) && !globalLocaleKeys.get(locale)?.has(key),
      )

      if (missingLocales.length > 0) {
        const missingKey = getOrInsert(missingKeys, key, { key, locales: missingLocales, sources: [] })

        missingKey.sources.push({ file, location })
      }
    }
  }

  return Array.from(missingKeys.values())
}

function calcUnusedKeys(localeFiles: LocaleFile[], sourceFiles: SourceFile[]): UnusedKey[] {
  const unusedKeys = new Map<string, UnusedKey>()
  const sourceKeys = new Set<string>()

  for (const sourceFile of sourceFiles) {
    const sourceFileKeys = new Set(sourceFile.keys.map((k) => k.key))

    for (const localeFile of sourceFile.localeFiles) {
      for (const { key } of localeFile.keys) {
        if (!sourceFileKeys.has(key)) {
          const unusedKey = getOrInsert(unusedKeys, key, { key, files: [] })

          unusedKey.files.push({ locale: localeFile.locale, file: localeFile.file, scope: "local" })
        }
      }
    }

    for (const key of sourceFileKeys) {
      sourceKeys.add(key)
    }
  }

  for (const localeFile of localeFiles) {
    for (const { key } of localeFile.keys) {
      if (!sourceKeys.has(key)) {
        const unusedKey = getOrInsert(unusedKeys, key, { key, files: [] })

        unusedKey.files.push({ locale: localeFile.locale, file: localeFile.file, scope: "global" })
      }
    }
  }

  return Array.from(unusedKeys.values())
}

function getOrInsert<T>(map: Map<string, T>, key: string, defaultValue: T) {
  if (!map.has(key)) {
    map.set(key, defaultValue)
  }

  return map.get(key) as T
}
