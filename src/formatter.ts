import { readFileSync } from "node:fs"
import { styleText } from "node:util"
import { codeFrameColumns } from "@babel/code-frame"
import { table, type TableUserConfig } from "table"
import type { LocaleTypeWarning, MissingKey, UnusedKey } from "./types.ts"
import { formatFilePath } from "./utils.ts"

export function outputTypeWarnings(warnings: LocaleTypeWarning[]): void {
  console.log(styleText("bold", `Warnings (${warnings.length}):\n`))

  const grouped = Object.groupBy(warnings, (it) => it.file)

  for (const [file, fileTypeWarnings] of Object.entries(grouped)) {
    console.log(formatFilePath(file))

    for (const typeWarning of fileTypeWarnings ?? []) {
      console.log(`  • Unexpected type ${styleText("italic", typeWarning.type)} for key ${typeWarning.key}`)
    }

    console.log()
  }
}

export function outputMissingKeys(keys: MissingKey[]): void {
  console.log(styleText("bold", `Missing keys (${keys.length}):\n`))

  for (const key of keys) {
    outputMissingKey(key)
  }
}

function outputMissingKey(key: MissingKey) {
  for (const source of key.sources) {
    console.log(`  ${formatFilePath(source.file)}:${source.location.start.line}:${source.location.start.column}`)

    const content = readSourceFile(source.file)

    if (content != null) {
      console.log(
        codeFrameColumns(content, source.location, {
          highlightCode: true,
          linesAbove: 1,
          linesBelow: 1,
          message: `Missing in ${styleText("bold", key.locales.join(", "))}`,
        }),
      )
    }

    console.log()
  }
}

function readSourceFile(file: string): string | null {
  try {
    return readFileSync(file, { encoding: "utf-8" })
  } catch {
    return null
  }
}

export function outputUnusedKeys(keys: UnusedKey[]): void {
  console.log(styleText("bold", `Unused keys (${keys.length}):\n`))

  const sortedKeys = keys.toSorted((a, b) => b.files.length - a.files.length || a.key.localeCompare(b.key))
  const rows = sortedKeys.map((unusedKey) => [unusedKey.key, unusedKey.files.map((file) => file.locale).join(", ")])
  const config: TableUserConfig = {
    drawHorizontalLine(index, size) {
      return index === 0 || index === 1 || index === size
    },
  }

  console.log(table([["Key", "Locales"], ...rows], config))
}
