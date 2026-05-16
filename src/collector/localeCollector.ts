import { readFile } from "node:fs/promises"
import { basename, extname, resolve } from "node:path"
import { parseJSON, parseJSON5, parseJSONC, parseYAML } from "confbox"
import { createJiti } from "jiti"
import type { LocaleFile } from "../types.ts"
import { extractLocaleKeys } from "./localeExtractor.ts"

const jiti = createJiti(import.meta.url)

export async function collectLocaleFile(filePath: string): Promise<LocaleFile> {
  const ext = extname(filePath)
  const locale = basename(filePath, ext)
  const data = await parseLocaleFile(filePath, ext)

  if (data == null || typeof data !== "object") throw new Error(`Language file ${filePath} is not an object`)

  try {
    return {
      locale,
      file: filePath,
      keys: extractLocaleKeys(data),
      scope: "global",
    }
  } catch (e) {
    throw new Error(`Invalid locale file ${filePath}: ${e instanceof Error ? e.message : e?.toString()}`, { cause: e })
  }
}

const supportedJsExtensions = [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]

async function parseLocaleFile(filePath: string, ext: string): Promise<unknown> {
  if (supportedJsExtensions.includes(ext)) {
    try {
      return await jiti.import(resolve(filePath), { default: true })
    } catch {
      return undefined
    }
  }

  return await parseLocale(await readFile(filePath, { encoding: "utf-8" }), ext)
}

const fileParsers: Record<string, (text: string) => unknown> = {
  ".json": parseJSON,
  ".jsonc": parseJSONC,
  ".json5": parseJSON5,
  ".yaml": parseYAML,
  ".yml": parseYAML,
}

export async function parseLocale(content: string, ext: string) {
  const parse = fileParsers[ext]
  if (!parse) throw new Error(`Unsupported file type: ${ext}`)

  return parse(content)
}

export function parseLocaleSync(content: string, ext: string): unknown {
  const parse = fileParsers[ext]
  if (!parse) throw new Error(`Unsupported file type: ${ext}`)

  return parse(content)
}
