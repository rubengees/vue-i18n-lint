import type { LocaleFile, LocaleTypeWarning, MissingKey, ProcessResult, SourceFile, UnusedKey } from "./types.ts"
import { mapGetOrInsert, newTrie, trieCoversKey } from "./utils.ts"

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
  const emptyTrie = newTrie([])

  const globalLocaleTries = new Map(localeFiles.map((it) => [it.locale, newTrie(it.keys.map((k) => k.key))]))
  const locales = new Set([
    ...globalLocaleTries.keys(),
    ...sourceFiles.flatMap((sf) => sf.localeFiles.map((lf) => lf.locale)),
  ])

  const missingKeys = new Map<string, MissingKey>()

  for (const sourceFile of sourceFiles) {
    const localLocaleTries = new Map(
      sourceFile.localeFiles.map((it) => [it.locale, newTrie(it.keys.map((k) => k.key))]),
    )

    for (const { key, file, location } of sourceFile.keys) {
      const missingLocales = Array.from(locales).filter(
        (locale) =>
          !trieCoversKey(localLocaleTries.get(locale) ?? emptyTrie, key) &&
          !trieCoversKey(globalLocaleTries.get(locale) ?? emptyTrie, key),
      )

      if (missingLocales.length > 0) {
        const missingKey = mapGetOrInsert(missingKeys, key, { key, locales: missingLocales, sources: [] })

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

    calcUnusedKeysInLocaleFiles(unusedKeys, sourceFile.localeFiles, sourceFileKeys)

    for (const { key } of sourceFile.keys) {
      sourceKeys.add(key)
    }
  }

  calcUnusedKeysInLocaleFiles(unusedKeys, localeFiles, sourceKeys)

  return Array.from(unusedKeys.values())
}

function calcUnusedKeysInLocaleFiles(
  unusedKeys: Map<string, UnusedKey>,
  localeFiles: LocaleFile[],
  sourceKeys: Set<string>,
) {
  for (const localeFile of localeFiles) {
    for (const { key } of localeFile.keys) {
      // A locale key is considered used if the source uses the key itself or any of its ancestors
      // (e.g. source uses "aa.bb", locale has "aa.bb.cc" -> covered because "aa.bb" is a prefix of "aa.bb.cc").
      const parts = key.split(".")
      const covered = parts.some((_, i) => sourceKeys.has(parts.slice(0, i + 1).join(".")))

      if (!covered) {
        const unusedKey = mapGetOrInsert(unusedKeys, key, { key, files: [] })

        unusedKey.files.push({ locale: localeFile.locale, file: localeFile.file, scope: localeFile.scope })
      }
    }
  }
}
