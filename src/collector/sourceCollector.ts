import { readFile } from "node:fs/promises"
import { basename, extname } from "node:path"
import type { SFCBlock, SFCDescriptor } from "@vue/compiler-sfc"
import { parse } from "@vue/compiler-sfc"
import { parseLocale } from "../parser/localeParser.ts"
import { parseScript } from "../parser/scriptParser.ts"
import type { FileKey, LocaleFile, SourceFile, SourceKey } from "../types.ts"
import { formatFilePath } from "../utils.ts"
import { collectJsKeys } from "./jsCollector.ts"
import { extractLocaleKeys } from "./localeExtractor.ts"
import { TRANSLATION_CALL_REGEX } from "./translationFunctions.ts"
import { collectVueKeys } from "./vueCollector.ts"

export async function collectSourceFile(file: string): Promise<SourceFile> {
  const source = await readSourceFile(file)
  if (source == null) return { keys: [], localeFiles: [] }

  if (extname(file) === ".vue") {
    return collectFromVue(source, file)
  }

  const rawKeys = collectFromScript(source, file)
  return { keys: rawKeysToFileKeys(rawKeys, file, source), localeFiles: [] }
}

async function readSourceFile(file: string): Promise<string | null> {
  try {
    return await readFile(file, { encoding: "utf-8" })
  } catch (e) {
    console.error(`Failed to read source file ${formatFilePath(file)}:`, e instanceof Error ? e.message : e)
    return null
  }
}

function collectFromScript(source: string, file: string): SourceKey[] {
  if (!TRANSLATION_CALL_REGEX.test(source)) return []

  const program = parseScript(file, source)

  return collectJsKeys(program)
}

function collectFromVue(source: string, file: string): SourceFile {
  const descriptor = parseVueFile(source, file)
  if (descriptor == null) return { keys: [], localeFiles: [] }

  const rawKeys: SourceKey[] = []

  const templateAst = descriptor.template?.ast
  if (templateAst) rawKeys.push(...collectVueKeys(file, templateAst))

  for (const script of [descriptor.script, descriptor.scriptSetup]) {
    if (!script) continue
    if (!TRANSLATION_CALL_REGEX.test(script.content)) continue

    const program = parseScript(file, script.content, {
      lang: script.lang,
      loc: { line: script.loc.start.line, column: script.loc.start.column },
    })

    rawKeys.push(...collectJsKeys(program, script.loc.start.offset))
  }

  return {
    keys: rawKeysToFileKeys(rawKeys, file, source),
    localeFiles: collectI18nBlocks(descriptor, file),
  }
}

function parseVueFile(source: string, file: string) {
  try {
    const result = parse(source, { filename: basename(file), templateParseOptions: { prefixIdentifiers: false } })

    if (result.errors.length > 0) {
      console.error(
        `Failed to parse Vue file ${formatFilePath(file)}:\n${result.errors.map((e) => `  • ${e.message}`).join("\n")}\n`,
      )
    }

    return result.descriptor
  } catch (e) {
    console.error(`Failed to parse Vue file ${formatFilePath(file)}:`, e instanceof Error ? e.message : e)
    return null
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

  const data = parseLocale(block.content, file, {
    ext: `.${lang}`,
    loc: { line: block.loc.start.line, column: block.loc.start.column },
  })

  if (data == null) return []

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

function offsetToPosition(source: string, offset: number): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n")

  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  }
}
