import { readFileSync } from "node:fs"
import { extname, resolve } from "node:path"
import type { SFCBlock, SFCDescriptor } from "@vue/compiler-sfc"
import { parse } from "@vue/compiler-sfc"
import { parseSync } from "oxc-parser"
import type { FileKey, LocaleFile, SourceFile, SourceKey } from "../types.ts"
import { flatten } from "../utils.ts"
import { collectJsKeys } from "./jsCollector.ts"
import { parseLocaleSync } from "./localeCollector.ts"
import { collectVueKeys } from "./vueCollector.ts"

export function collectSourceFile(filePath: string): SourceFile {
  const file = resolve(filePath)
  const source = readFileSync(file, { encoding: "utf-8" })

  if (extname(filePath) === ".vue") {
    return collectFromVue(source, file, filePath)
  }

  const rawKeys = collectFromScript(source, filePath)
  return { keys: rawKeys.map((k) => toFileKey(k, file, source)), localeFiles: [] }
}

function collectFromScript(source: string, filename: string): SourceKey[] {
  const { program } = parseSync(filename, source)
  return collectJsKeys(program)
}

function collectFromVue(source: string, file: string, filename: string): SourceFile {
  const { descriptor } = parse(source, { filename })
  const rawKeys: SourceKey[] = []

  const templateAst = descriptor.template?.ast
  if (templateAst) rawKeys.push(...collectVueKeys(templateAst))

  for (const script of [descriptor.script, descriptor.scriptSetup]) {
    if (!script) continue
    const { program } = parseSync(filename, script.content)
    rawKeys.push(...collectJsKeys(program, script.loc.start.offset))
  }

  return {
    keys: rawKeys.map((k) => toFileKey(k, file, source)),
    localeFiles: collectI18nBlocks(descriptor, file),
  }
}

function collectI18nBlocks(descriptor: SFCDescriptor, file: string): LocaleFile[] {
  const localeFiles: LocaleFile[] = []

  for (const block of descriptor.customBlocks) {
    if (block.type !== "i18n") continue

    try {
      localeFiles.push(...parseI18nBlock(block, file))
    } catch (e) {
      throw new Error(`Invalid <i18n> block in ${file}: ${e instanceof Error ? e.message : e?.toString()}`)
    }
  }

  return localeFiles
}

function parseI18nBlock(block: SFCBlock, file: string): LocaleFile[] {
  const lang = typeof block.attrs["lang"] === "string" ? block.attrs["lang"] : "json"

  const data = parseLocaleSync(block.content, `.${lang}`)

  if (data == null || typeof data !== "object") throw new Error(`Not an object`)

  return Object.entries(data).map(([locale, localeData]) => {
    if (localeData == null || typeof localeData !== "object") {
      throw new Error(`Locale ${locale} is not an object`)
    }

    return {
      locale,
      file,
      scope: "local",
      sourceFile: file,
      keys: flatten(localeData),
    }
  })
}

function toFileKey(sourceKey: SourceKey, file: string, source: string): FileKey {
  return {
    key: sourceKey.key,
    file,
    location: {
      start: offsetToPosition(source, sourceKey.start),
      end: offsetToPosition(source, sourceKey.end),
    },
  }
}

function offsetToPosition(source: string, offset: number): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n")

  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  }
}
