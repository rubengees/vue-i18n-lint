import { readFileSync } from "node:fs"
import { basename, extname, resolve } from "node:path"
import { parseJSON, parseJSON5, parseJSONC, parseYAML } from "confbox"
import { createJiti } from "jiti"
import type { LocaleFile } from "../types.ts"

export async function collectLocaleFile(filePath: string): Promise<LocaleFile> {
  const ext = extname(filePath)
  const locale = basename(filePath, ext)
  const data = await parseLocaleFile(filePath, ext)

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

const supportedExtensions = [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]

const parsers: Record<string, <T>(text: string) => T> = {
  ".json": parseJSON,
  ".jsonc": parseJSONC,
  ".json5": parseJSON5,
  ".yaml": parseYAML,
  ".yml": parseYAML,
}

async function parseLocaleFile(filePath: string, ext: string): Promise<unknown> {
  if (supportedExtensions.includes(ext)) {
    const jiti = createJiti(import.meta.url)

    try {
      return await jiti.import(resolve(filePath), { default: true })
    } catch {
      return undefined
    }
  }

  const parse = parsers[ext]
  if (!parse) throw new Error(`Unsupported file type: ${ext}`)

  return parse(readFileSync(filePath, { encoding: "utf-8" }))
}

function flatten(data: object, prefix: string = ""): string[] {
  return Object.entries(data).flatMap(([key, value]) => {
    if (typeof value === "object") return flatten(value, `${prefix}${key}.`)
    if (typeof value === "string") return [`${prefix}${key}`]
    throw new Error(`Unsupported value type "${typeof value}" at key "${prefix}${key}"`)
  })
}
