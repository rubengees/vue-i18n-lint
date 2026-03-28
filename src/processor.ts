import type { FileKey, LocaleFile, MissingKey, ProcessResult, UnusedKey } from "./types.ts"

export function processFiles(localeFiles: LocaleFile[], srcKeys: FileKey[]): ProcessResult {
  const srcKeyMap = Map.groupBy(srcKeys, (k) => k.key)

  return {
    missing: calcMissingKeys(localeFiles, srcKeyMap),
    unused: calcUnusedKeys(localeFiles, srcKeyMap),
  }
}

function calcMissingKeys(localeFiles: LocaleFile[], srcKeyMap: Map<string, FileKey[]>): MissingKey[] {
  const localeKeys = new Map(localeFiles.map((it) => [it.locale, new Set(it.keys)]))

  const missing: MissingKey[] = []
  for (const [key, fileKeys] of srcKeyMap) {
    const missingLocales = localeKeys
      .entries()
      .filter(([, keys]) => !keys.has(key))
      .map(([locale]) => locale)
      .toArray()

    if (missingLocales.length > 0) {
      missing.push({
        key,
        locales: missingLocales,
        sources: fileKeys.map(({ file, location }) => ({ file, location: location })),
      })
    }
  }

  return missing
}

function calcUnusedKeys(localeFiles: LocaleFile[], srcKeyMap: Map<string, FileKey[]>): UnusedKey[] {
  const localeKeyMap = new Map<string, { locale: string; file: string }[]>()
  for (const { locale, file, keys } of localeFiles) {
    for (const key of keys) {
      let files = localeKeyMap.get(key)
      if (!files) localeKeyMap.set(key, (files = []))
      files.push({ locale, file })
    }
  }

  return localeKeyMap
    .entries()
    .filter(([key]) => !srcKeyMap.has(key))
    .map(([key, files]) => ({ key, files }))
    .toArray()
}
