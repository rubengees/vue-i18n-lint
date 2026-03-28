import { readFileSync } from "node:fs"
import { basename, extname } from "node:path"
import { parseJSON, parseJSON5, parseJSONC, parseYAML } from "confbox"
import type { LocaleFile } from "../types.ts"

export function collectLocaleFile(filePath: string): LocaleFile {
  const ext = extname(filePath)
  const locale = basename(filePath, ext)

  const parsers: Record<string, (content: string) => unknown> = {
    ".json": parseJSON,
    ".jsonc": parseJSONC,
    ".json5": parseJSON5,
    ".yaml": parseYAML,
    ".yml": parseYAML,
  }

  const parse = parsers[ext]
  if (!parse) throw new Error(`Unsupported file type: ${ext}`)

  const content = readFileSync(filePath, { encoding: "utf-8" })
  const data = parse(content)

  if (data == null || typeof data !== "object") throw new Error(`Language file ${filePath} is not an object`)

  try {
    return {
      locale,
      file: filePath,
      keys: flatten(data),
    }
  } catch (e) {
    throw new Error(`Invalid locale file ${filePath}: ${e instanceof Error ? e.message : e?.toString()}`)
  }
}

function flatten(data: object, prefix: string = ""): string[] {
  return Object.entries(data).flatMap(([key, value]) => {
    if (typeof value === "object") return flatten(value, `${prefix}${key}.`)
    if (typeof value === "string") return [`${prefix}${key}`]
    throw new Error(`Unsupported value type "${typeof value}" at key "${prefix}${key}"`)
  })
}
