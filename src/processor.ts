import escape from "regexp.escape"
import type { ConfigOutput } from "./config/schema.ts"
import type {
  DynamicKey,
  LocaleFile,
  LocaleTypeWarning,
  MissingKey,
  ProcessResult,
  SourceFile,
  UnusedKey,
} from "./types.ts"
import { getOrInsertComputed, mapGetOrInsert, newPrefixSet } from "./utils.ts"

export function processFiles(localeFiles: LocaleFile[], sourceFiles: SourceFile[], config: ConfigOutput) {
  const result: ProcessResult = {
    typeWarnings: calcTypeWarnings(localeFiles),
  }

  if (config.checks.missingKeys.severity !== "off") {
    const ignoreSet = new Set([...config.ignoreKeys, ...(config.checks.missingKeys.ignore ?? [])])
    const missingKeys = calcMissingKeys(localeFiles, sourceFiles)

    result.missing = missingKeys.filter((entry) => !ignoreSet.has(entry.key))
  }

  if (config.checks.unusedKeys.severity !== "off") {
    const ignoreSet = new Set([...config.ignoreKeys, ...(config.checks.unusedKeys.ignore ?? [])])
    const unusedKeys = calcUnusedKeys(localeFiles, sourceFiles)

    result.unused = unusedKeys.filter((entry) => !ignoreSet.has(entry.key))
  }

  return result
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
  const regexCache = new Map<string, RegExp>()

  for (const sourceFile of sourceFiles) {
    const localLocalePrefixes =
      sourceFile.localeFiles.length > 0
        ? new Map(sourceFile.localeFiles.map((it) => [it.locale, newPrefixSet(it.keys.map((k) => k.key))]))
        : undefined

    for (const { key, file, location } of sourceFile.keys) {
      if (typeof key !== "string") {
        const keyStr = dynamicKeyToString(key)
        const regex = getOrInsertComputed(regexCache, keyStr, () => buildDynamicKeyRegex(key))

        const missingLocales: string[] = []

        for (const locale of locales) {
          const local = localLocalePrefixes?.get(locale)
          const global = globalLocalePrefixes.get(locale)

          if (!setMatchesRegex(local, regex) && !setMatchesRegex(global, regex)) {
            missingLocales.push(locale)
          }
        }

        if (missingLocales.length > 0) {
          const missingKey = mapGetOrInsert(missingKeys, keyStr, {
            key: keyStr,
            locales: missingLocales,
            sources: [],
          })

          missingKey.sources.push({ file, location })
        }
      } else {
        const missingLocales: string[] = []

        for (const locale of locales) {
          const local = localLocalePrefixes?.get(locale)
          const global = globalLocalePrefixes.get(locale)

          if (!local?.has(key) && !global?.has(key)) {
            missingLocales.push(locale)
          }
        }

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

function setMatchesRegex(set: Set<string> | undefined, regex: RegExp): boolean {
  if (!set) return false

  return set.values().some((item) => regex.test(item))
}

function calcUnusedKeys(localeFiles: LocaleFile[], sourceFiles: SourceFile[]): UnusedKey[] {
  const unusedKeys = new Map<string, UnusedKey>()
  const sourceKeys = new Set<string>()
  const sourceDynamicKeys = new Map<string, RegExp>()

  for (const sourceFile of sourceFiles) {
    const sourceFileKeys = new Set<string>()
    const sourceFileDynamicKeys = new Map<string, RegExp>()

    for (const k of sourceFile.keys) {
      if (typeof k.key === "string") {
        sourceFileKeys.add(k.key)
      } else {
        const keyStr = dynamicKeyToString(k.key)

        if (!sourceFileDynamicKeys.has(keyStr)) sourceFileDynamicKeys.set(keyStr, buildDynamicKeyRegex(k.key))
      }
    }

    const sourceDynamicRegex = combineRegexes(Array.from(sourceFileDynamicKeys.values()))

    calcUnusedKeysInLocaleFiles(unusedKeys, sourceFile.localeFiles, sourceFileKeys, sourceDynamicRegex)

    for (const key of sourceFileKeys) {
      sourceKeys.add(key)
    }

    for (const [keyStr, regex] of sourceFileDynamicKeys) {
      if (!sourceDynamicKeys.has(keyStr)) sourceDynamicKeys.set(keyStr, regex)
    }
  }

  const sourceDynamicRegex = combineRegexes(Array.from(sourceDynamicKeys.values()))

  calcUnusedKeysInLocaleFiles(unusedKeys, localeFiles, sourceKeys, sourceDynamicRegex)

  return Array.from(unusedKeys.values())
}

function combineRegexes(regexes: RegExp[]): RegExp | null {
  if (regexes.length === 0) return null

  return new RegExp(regexes.map((r) => `(?:${r.source})`).join("|"))
}

function calcUnusedKeysInLocaleFiles(
  unusedKeys: Map<string, UnusedKey>,
  localeFiles: LocaleFile[],
  sourceKeys: Set<string>,
  sourceDynamicRegex: RegExp | null,
) {
  for (const localeFile of localeFiles) {
    for (const { key } of localeFile.keys) {
      const parts = key.split(".")

      // A locale key is considered used if the source uses the key itself or any of its ancestors
      // (e.g. source uses "aa.bb", locale has "aa.bb.cc" -> covered because "aa.bb" is a prefix of "aa.bb.cc").
      const covered = parts.some((_, i) => {
        const joined = parts.slice(0, i + 1).join(".")

        return sourceKeys.has(joined) || sourceDynamicRegex?.test(joined)
      })

      if (!covered) {
        const unusedKey = mapGetOrInsert(unusedKeys, key, { key, files: [] })

        unusedKey.files.push({ locale: localeFile.locale, file: localeFile.file, scope: localeFile.scope })
      }
    }
  }
}
