import type { FileKey, I18nFile, MissingKey, ProcessResult, UnusedKey } from "./types.ts"

export function processFiles(i18nFiles: I18nFile[], srcKeys: FileKey[]): ProcessResult {
  const srcKeyMap = Map.groupBy(srcKeys, (k) => k.key)

  return {
    missing: calcMissingKeys(i18nFiles, srcKeyMap),
    unused: calcUnusedKeys(i18nFiles, srcKeyMap),
  }
}

function calcMissingKeys(i18nFiles: I18nFile[], srcKeyMap: Map<string, FileKey[]>): MissingKey[] {
  const localeKeys = new Map(i18nFiles.map((it) => [it.locale, new Set(it.keys)]))

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

function calcUnusedKeys(i18nFiles: I18nFile[], srcKeyMap: Map<string, FileKey[]>): UnusedKey[] {
  const localeKeyMap = new Map<string, { locale: string; file: string }[]>()
  for (const { locale, file, keys } of i18nFiles) {
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
