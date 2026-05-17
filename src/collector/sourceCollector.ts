import { readFile } from "node:fs/promises"
import { basename, extname } from "node:path"
import type { SFCBlock, SFCDescriptor } from "@vue/compiler-sfc"
import { parse } from "@vue/compiler-sfc"
import { ParseError } from "../error.ts"
import { parseLocale } from "../parser/localeParser.ts"
import { parseScript } from "../parser/scriptParser.ts"
import type { FileKey, LocaleFile, SourceFile, SourceKey } from "../types.ts"
import { offsetToPosition } from "../utils.ts"
import { collectJsKeys } from "./jsCollector.ts"
import { extractLocaleKeys } from "./localeExtractor.ts"
import { TRANSLATION_CALL_REGEX } from "./translationFunctions.ts"
import { collectVueKeys } from "./vueCollector.ts"

export async function collectSourceFile(file: string): Promise<SourceFile> {
  const source = await readFile(file, { encoding: "utf-8" })

  if (extname(file) === ".vue") {
    return collectFromVue(source, file)
  }

  const rawKeys = collectFromScript(source, file)
  return { keys: rawKeysToFileKeys(rawKeys, file, source), localeFiles: [] }
}

function collectFromScript(source: string, file: string): SourceKey[] {
  if (!TRANSLATION_CALL_REGEX.test(source)) return []

  const program = parseScript(file, source)

  return collectJsKeys(program)
}

function collectFromVue(source: string, file: string): SourceFile {
  const { descriptor, errors } = parse(source, {
    filename: basename(file),
    templateParseOptions: { prefixIdentifiers: false },
  })

  if (errors.length > 0 && !descriptor.template && !descriptor.script && !descriptor.scriptSetup) {
    const messages = errors.map((e) => `  • ${e.message}`).join("\n")
    const firstError = errors[0]!

    if ("loc" in firstError) {
      const line = firstError.loc?.start.line
      const column = firstError.loc?.start.column != null ? firstError.loc.start.column + 1 : undefined

      throw new ParseError(`Failed to parse Vue file:\n${messages}`, file, { line, column })
    } else {
      throw new ParseError(`Failed to parse Vue file:\n${messages}`, file)
    }
  }

  const rawKeys: SourceKey[] = []

  const templateAst = descriptor.template?.ast
  if (templateAst) rawKeys.push(...collectVueKeys(file, templateAst, { fileSource: source }))

  for (const script of [descriptor.script, descriptor.scriptSetup]) {
    if (!script) continue
    if (!TRANSLATION_CALL_REGEX.test(script.content)) continue

    const program = parseScript(file, script.content, {
      lang: script.lang,
      offset: script.loc.start.offset,
      fileSource: source,
    })

    rawKeys.push(...collectJsKeys(program, script.loc.start.offset))
  }

  return {
    keys: rawKeysToFileKeys(rawKeys, file, source),
    localeFiles: collectI18nBlocks(descriptor, file),
  }
}

function collectI18nBlocks(descriptor: SFCDescriptor, file: string): LocaleFile[] {
  const localeFiles: LocaleFile[] = []

  for (const block of descriptor.customBlocks) {
    if (block.type !== "i18n") continue

    localeFiles.push(...parseI18nBlock(block, file))
  }

  return localeFiles
}

function parseI18nBlock(block: SFCBlock, file: string): LocaleFile[] {
  const lang = typeof block.attrs["lang"] === "string" ? block.attrs["lang"] : "json"

  const data = parseLocale(block.content, file, { ext: `.${lang}` })

  return Object.entries(data).map(([locale, localeData]) => {
    if (localeData == null) {
      return { locale, file: file, keys: [], scope: "local" }
    }

    return {
      locale,
      file,
      scope: "local",
      sourceFile: file,
      keys: extractLocaleKeys(localeData),
    }
  })
}

function rawKeysToFileKeys(rawKeys: SourceKey[], file: string, source: string): FileKey[] {
  return rawKeys.map((k) => ({
    key: k.key,
    file,
    location: {
      start: offsetToPosition(source, k.start),
      end: offsetToPosition(source, k.end),
    },
  }))
}
