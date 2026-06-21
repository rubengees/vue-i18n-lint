import { readFileSync } from "node:fs"
import { styleText } from "node:util"
import { codeFrameColumns } from "@babel/code-frame"
import type { StricliProcess } from "@stricli/core"
import { encode } from "@toon-format/toon"
import { table, type TableUserConfig } from "table"
import type { LocaleTypeWarning, MissingKey, UnusedKey } from "./types.ts"
import { formatFilePath, writeLine } from "./utils.ts"

export function outputTypeWarnings(process: StricliProcess, warnings: LocaleTypeWarning[]): void {
  writeLine(process.stdout, styleText("bold", `Warnings (${warnings.length}):\n`))

  const grouped = Object.groupBy(warnings, (it) => it.file)

  for (const [file, fileTypeWarnings] of Object.entries(grouped)) {
    writeLine(process.stdout, formatFilePath(file))

    for (const typeWarning of fileTypeWarnings ?? []) {
      writeLine(
        process.stdout,
        `  • Unexpected type ${styleText("italic", typeWarning.type)} for key ${typeWarning.key}`,
      )
    }

    writeLine(process.stdout)
  }
}

export function outputMissingKeys(process: StricliProcess, keys: MissingKey[]): void {
  writeLine(process.stdout, styleText("bold", `Missing keys (${keys.length}):\n`))

  for (const key of keys) {
    outputMissingKey(process, key)
  }
}

function outputMissingKey(process: StricliProcess, key: MissingKey) {
  for (const source of key.sources) {
    writeLine(
      process.stdout,
      `  ${formatFilePath(source.file)}:${source.location.start.line}:${source.location.start.column}`,
    )

    const content = readSourceFile(source.file)

    if (content != null) {
      writeLine(
        process.stdout,
        codeFrameColumns(content, source.location, {
          highlightCode: true,
          linesAbove: 1,
          linesBelow: 1,
          message: `Missing in ${styleText("bold", key.locales.join(", "))}`,
        }),
      )
    }

    writeLine(process.stdout)
  }
}

function readSourceFile(file: string): string | null {
  try {
    return readFileSync(file, { encoding: "utf-8" })
  } catch {
    return null
  }
}

export function outputUnusedKeys(process: StricliProcess, keys: UnusedKey[]): void {
  writeLine(process.stdout, styleText("bold", `Unused keys (${keys.length}):\n`))

  const sortedKeys = keys.toSorted((a, b) => b.files.length - a.files.length || a.key.localeCompare(b.key))
  const rows = sortedKeys.map((unusedKey) => [unusedKey.key, unusedKey.files.map((file) => file.locale).join(", ")])
  const config: TableUserConfig = {
    drawHorizontalLine(index, size) {
      return index === 0 || index === 1 || index === size
    },
  }

  writeLine(process.stdout, table([["Key", "Locales"], ...rows], config))
}

export function outputJson(process: StricliProcess, result: { missing: MissingKey[]; unused: UnusedKey[] }): void {
  writeLine(process.stdout, JSON.stringify({ missingKeys: result.missing, unusedKeys: result.unused }, null, 2))
}

export function outputToon(process: StricliProcess, result: { missing: MissingKey[]; unused: UnusedKey[] }): void {
  writeLine(process.stdout, encode({ missingKeys: result.missing, unusedKeys: result.unused }))
}
