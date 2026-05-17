import { basename, extname } from "node:path"
import { parseLocaleFile } from "../parser/localeParser.ts"
import type { LocaleFile } from "../types.ts"
import { extractLocaleKeys } from "./localeExtractor.ts"

export async function collectLocaleFile(filePath: string): Promise<LocaleFile> {
  const locale = basename(filePath, extname(filePath))
  const data = await parseLocaleFile(filePath)

  return {
    locale,
    file: filePath,
    keys: extractLocaleKeys(data),
    scope: "global",
  }
}
