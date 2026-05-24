import type { LocaleFile, LocaleTypeWarning, MissingKey, ProcessResult, SourceFile, UnusedKey } from "./types.ts"
import { dynamicKeyToRegex, mapGetOrInsert, newPrefixSet } from "./utils.ts"

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
  const globalLocalePrefixes = new Map(localeFiles.map((it) => [it.locale, newPrefixSet(it.keys.map((k) => k.key))]))
  const globalLocaleKeys = new Map(localeFiles.map((it) => [it.locale, it.keys.map((k) => k.key)]))
  const locales = new Set([
    ...globalLocalePrefixes.keys(),
    ...sourceFiles.flatMap((sf) => sf.localeFiles.map((lf) => lf.locale)),
  ])

  const missingKeys = new Map<string, MissingKey>()

  for (const sourceFile of sourceFiles) {
    const localLocalePrefixes = new Map(
      sourceFile.localeFiles.map((it) => [it.locale, newPrefixSet(it.keys.map((k) => k.key))]),
    )
    const localLocaleKeys = new Map(sourceFile.localeFiles.map((it) => [it.locale, it.keys.map((k) => k.key)]))

    for (const { key, file, location, isDynamic } of sourceFile.keys) {
      let missingLocales: string[]

      if (isDynamic) {
        const pattern = dynamicKeyToRegex(key)
        missingLocales = Array.from(locales.values()).filter((locale) => {
          const allKeys = [...(localLocaleKeys.get(locale) ?? []), ...(globalLocaleKeys.get(locale) ?? [])]
          return !allKeys.some((k) => pattern.test(k))
        })
      } else {
        missingLocales = Array.from(locales.values()).filter(
          (locale) => !localLocalePrefixes.get(locale)?.has(key) && !globalLocalePrefixes.get(locale)?.has(key),
        )
      }

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
  const staticSourceKeys = new Set<string>()
  const dynamicSourcePatterns: RegExp[] = []

  for (const sourceFile of sourceFiles) {
    const fileStaticKeys = new Set(sourceFile.keys.filter((k) => !k.isDynamic).map((k) => k.key))
    const fileDynamicPatterns = sourceFile.keys.filter((k) => k.isDynamic).map((k) => dynamicKeyToRegex(k.key))

    calcUnusedKeysInLocaleFiles(unusedKeys, sourceFile.localeFiles, fileStaticKeys, fileDynamicPatterns)

    for (const key of fileStaticKeys) {
      staticSourceKeys.add(key)
    }

    for (const pattern of fileDynamicPatterns) {
      dynamicSourcePatterns.push(pattern)
    }
  }

  calcUnusedKeysInLocaleFiles(unusedKeys, localeFiles, staticSourceKeys, dynamicSourcePatterns)

  return Array.from(unusedKeys.values())
}

function calcUnusedKeysInLocaleFiles(
  unusedKeys: Map<string, UnusedKey>,
  localeFiles: LocaleFile[],
  sourceKeys: Set<string>,
  dynamicPatterns: RegExp[],
) {
  for (const localeFile of localeFiles) {
    for (const { key } of localeFile.keys) {
      // A locale key is considered used if the source uses the key itself or any of its ancestors
      // (e.g. source uses "aa.bb", locale has "aa.bb.cc" -> covered because "aa.bb" is a prefix of "aa.bb.cc").
      const parts = key.split(".")
      const coveredByStatic = parts.some((_, i) => sourceKeys.has(parts.slice(0, i + 1).join(".")))
      const coveredByDynamic = !coveredByStatic && dynamicPatterns.some((pattern) => pattern.test(key))

      if (!coveredByStatic && !coveredByDynamic) {
        const unusedKey = mapGetOrInsert(unusedKeys, key, { key, files: [] })

        unusedKey.files.push({ locale: localeFile.locale, file: localeFile.file, scope: localeFile.scope })
      }
    }
  }
}
