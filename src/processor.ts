import escape from "regexp.escape"
import type {
  DynamicKey,
  LocaleFile,
  LocaleTypeWarning,
  MissingKey,
  ProcessResult,
  SourceFile,
  UnusedKey,
} from "./types.ts"
import { mapGetOrInsert, newPrefixSet } from "./utils.ts"

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
  const locales = new Set([
    ...globalLocalePrefixes.keys(),
    ...sourceFiles.flatMap((sf) => sf.localeFiles.map((lf) => lf.locale)),
  ])

  const missingKeys = new Map<string, MissingKey>()

  for (const sourceFile of sourceFiles) {
    const localLocalePrefixes = new Map(
      sourceFile.localeFiles.map((it) => [it.locale, newPrefixSet(it.keys.map((k) => k.key))]),
    )

    for (const { key, file, location } of sourceFile.keys) {
      if (typeof key !== "string") {
        const regex = buildDynamicKeyRegex(key)

        const missingLocales = Array.from(locales.values()).filter(
          (locale) =>
            !localLocalePrefixes
              .get(locale)
              ?.values()
              ?.some((localeKey) => regex.test(localeKey)) &&
            !globalLocalePrefixes
              .get(locale)
              ?.values()
              ?.some((localeKey) => regex.test(localeKey)),
        )

        if (missingLocales.length > 0) {
          const keyStr = dynamicKeyToString(key)
          const missingKey = mapGetOrInsert(missingKeys, keyStr, {
            key: keyStr,
            locales: missingLocales,
            sources: [],
          })

          missingKey.sources.push({ file, location })
        }
      } else {
        const missingLocales = Array.from(locales.values()).filter(
          (locale) => !localLocalePrefixes.get(locale)?.has(key) && !globalLocalePrefixes.get(locale)?.has(key),
        )

        if (missingLocales.length > 0) {
          const missingKey = mapGetOrInsert(missingKeys, key, { key, locales: missingLocales, sources: [] })

          missingKey.sources.push({ file, location })
        }
      }
    }
  }

  return Array.from(missingKeys.values())
}

function dynamicKeyToString(dynamicKey: DynamicKey): string {
  return dynamicKey.map((part) => (typeof part === "string" ? part : "<dynamic>")).join("")
}

function buildDynamicKeyRegex(dynamicKey: DynamicKey): RegExp {
  return new RegExp("^" + dynamicKey.map((part) => (typeof part === "string" ? escape(part) : ".*")).join("") + "$")
}

function calcUnusedKeys(localeFiles: LocaleFile[], sourceFiles: SourceFile[]): UnusedKey[] {
  const unusedKeys = new Map<string, UnusedKey>()
  const sourceKeys = new Set<string>()
  const sourceDynamicKeys: RegExp[] = []

  for (const sourceFile of sourceFiles) {
    const sourceFileKeys = new Set(sourceFile.keys.flatMap((k) => (typeof k.key === "string" ? [k.key] : [])))
    const sourceFileDynamicKeys = sourceFile.keys
      .flatMap((k) => (typeof k.key !== "string" ? [k.key] : []))
      .map(buildDynamicKeyRegex)

    calcUnusedKeysInLocaleFiles(unusedKeys, sourceFile.localeFiles, sourceFileKeys, sourceFileDynamicKeys)

    for (const key of sourceFileKeys) {
      sourceKeys.add(key)
    }

    for (const regex of sourceFileDynamicKeys) {
      sourceDynamicKeys.push(regex)
    }
  }

  calcUnusedKeysInLocaleFiles(unusedKeys, localeFiles, sourceKeys, sourceDynamicKeys)

  return Array.from(unusedKeys.values())
}

function calcUnusedKeysInLocaleFiles(
  unusedKeys: Map<string, UnusedKey>,
  localeFiles: LocaleFile[],
  sourceKeys: Set<string>,
  sourceDynamicKeys: RegExp[] = [],
) {
  for (const localeFile of localeFiles) {
    for (const { key } of localeFile.keys) {
      const parts = key.split(".")

      // A locale key is considered used if the source uses the key itself or any of its ancestors
      // (e.g. source uses "aa.bb", locale has "aa.bb.cc" -> covered because "aa.bb" is a prefix of "aa.bb.cc").
      const covered = parts.some((_, i) => {
        const joined = parts.slice(0, i + 1).join(".")

        return sourceKeys.has(joined) || sourceDynamicKeys.some((regex) => regex.test(joined))
      })

      if (!covered) {
        const unusedKey = mapGetOrInsert(unusedKeys, key, { key, files: [] })

        unusedKey.files.push({ locale: localeFile.locale, file: localeFile.file, scope: localeFile.scope })
      }
    }
  }
}
