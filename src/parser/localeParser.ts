import { readFile } from "node:fs/promises"
import { extname, resolve } from "node:path"
import { parseJSON, parseJSON5, parseJSONC, parseYAML } from "confbox"
import { createJiti } from "jiti"
import { formatFilePath } from "../utils.ts"

const jiti = createJiti(import.meta.url)

const supportedJsExtensions = [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]

const fileParsers: Record<string, (text: string) => Record<string, unknown>> = {
  ".json": parseJSON,
  ".jsonc": parseJSONC,
  ".json5": parseJSON5,
  ".yaml": parseYAML,
  ".yml": parseYAML,
}

export async function parseLocaleFile(filePath: string): Promise<object | null> {
  if (supportedJsExtensions.includes(extname(filePath))) {
    return await readLocaleScriptFile(filePath)
  }

  const content = await readLocaleFile(filePath)
  if (content == null) return null

  return parseLocale(content, filePath)
}

export type ParseLocaleOptions = {
  ext?: string
  loc?: {
    line: number
    column: number
  }
}

async function readLocaleScriptFile(filePath: string) {
  try {
    const data = await jiti.import(resolve(filePath), { default: true })

    if (data == null || typeof data !== "object" || Array.isArray(data)) {
      console.error(`Failed to read locale file ${formatFilePath(filePath)}: Not an object`)
      return null
    }

    return data
  } catch (e) {
    console.error(`Failed to read locale file ${formatFilePath(filePath)}:`, e instanceof Error ? e.message : e)
    return null
  }
}

async function readLocaleFile(filePath: string) {
  try {
    return await readFile(filePath, { encoding: "utf-8" })
  } catch (e) {
    console.error(`Failed to read locale file ${formatFilePath(filePath)}:`, e instanceof Error ? e.message : e)
    return null
  }
}

export function parseLocale(
  content: string,
  file: string,
  options: ParseLocaleOptions = {},
): Record<string, unknown> | null {
  const ext = options.ext ?? extname(file)
  const location = options.loc ? `at ${file}:${options.loc.line}:${options.loc.column}` : `file ${file}`

  const parse = fileParsers[ext]

  if (!parse) {
    console.error(`Failed to parse locale ${location}: Unsupported type: ${ext}`)
    return null
  }

  try {
    const result = parse(content)

    if (typeof result !== "object" || result === null || Array.isArray(result)) {
      console.error(`Failed to parse locale ${location}: Not an object`)
      return null
    }

    return result
  } catch (e) {
    console.error(`Failed to parse locale ${location}:`, e instanceof Error ? e.message : e)
    return null
  }
}
