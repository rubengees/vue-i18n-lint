import { readFile } from "node:fs/promises"
import { extname, resolve } from "node:path"
import { parseJSON, parseJSON5, parseJSONC, parseYAML } from "confbox"
import { createJiti } from "jiti"
import { ParseError } from "../error.ts"

const jiti = createJiti(import.meta.url)

const supportedJsExtensions = [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]

const fileParsers: Record<string, (text: string) => unknown> = {
  ".json": parseJSON,
  ".jsonc": parseJSONC,
  ".json5": parseJSON5,
  ".yaml": parseYAML,
  ".yml": parseYAML,
}

export async function parseLocaleFile(filePath: string): Promise<Record<string, unknown>> {
  if (supportedJsExtensions.includes(extname(filePath))) {
    return await readLocaleScriptFile(filePath)
  }

  const content = await readFile(filePath, { encoding: "utf-8" })

  return parseLocale(content, filePath)
}

async function readLocaleScriptFile(filePath: string): Promise<Record<string, unknown>> {
  let result: unknown
  try {
    result = await jiti.import(resolve(filePath), { default: true })
  } catch (e) {
    throw new ParseError("Failed to import locale module", filePath, { cause: e })
  }

  if (!isPlainObject(result)) {
    throw new ParseError("Locale module default export is not an object", filePath)
  }

  return result
}

export type ParseLocaleOptions = {
  ext?: string
}

export function parseLocale(content: string, file: string, options: ParseLocaleOptions = {}): Record<string, unknown> {
  const ext = options.ext ?? extname(file)
  const parse = fileParsers[ext]

  if (!parse) {
    throw new ParseError(`Unsupported locale type: ${ext}`, file)
  }

  let result: unknown
  try {
    result = parse(content)
  } catch (e) {
    throw new ParseError("Failed to parse locale content", file, { cause: e })
  }

  if (!isPlainObject(result)) {
    throw new ParseError("Locale content is not an object", file)
  }

  return result
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}
