import { readFileSync } from "node:fs"
import { relative } from "node:path"
import { styleText } from "node:util"
import { codeFrameColumns } from "@babel/code-frame"
import { table, type TableUserConfig } from "table"
import type { MissingKey, UnusedKey } from "./types.ts"

export function outputMissingKeys(keys: MissingKey[]): void {
  console.log(styleText("bold", `Missing keys (${keys.length}):\n`))

  for (const key of keys) {
    outputMissingKey(key)
  }
}

function outputMissingKey(key: MissingKey) {
  for (const source of key.sources) {
    const relativePath = relative(process.cwd(), source.file)
    const displayPath = relativePath.startsWith("..") ? source.file : relativePath

    console.log(`  ${displayPath}:${source.location.start.line}:${source.location.start.column}`)

    console.log(
      codeFrameColumns(readFileSync(source.file, { encoding: "utf-8" }), source.location, {
        highlightCode: true,
        linesAbove: 1,
        linesBelow: 1,
        message: `Missing in ${styleText("bold", key.locales.join(", "))}`,
      }),
    )

    console.log()
  }
}

export function outputUnusedKeys(keys: UnusedKey[]): void {
  console.log(styleText("bold", `Unused keys (${keys.length}):\n`))

  const sortedKeys = keys.sort((a, b) => b.files.length - a.files.length || a.key.localeCompare(b.key))
  const rows = sortedKeys.map((unusedKey) => [unusedKey.key, unusedKey.files.map((file) => file.locale).join(", ")])
  const config: TableUserConfig = {
    drawHorizontalLine(index, size) {
      return index === 0 || index === 1 || index === size
    },
  }

  console.log(table([["Key", "Locales"], ...rows], config))
}
