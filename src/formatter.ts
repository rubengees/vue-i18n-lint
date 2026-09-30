import { readFileSync } from "node:fs"
import type { Writable } from "node:stream"
import { WriteStream as TTYWriteStream } from "node:tty"
import { styleText } from "node:util"
import { codeFrameColumns } from "@babel/code-frame"
import { encode } from "@toon-format/toon"
import { table, type TableUserConfig } from "table"
import type { z } from "zod"
import type { severityEnum } from "./config/schema.ts"
import type { DynamicKeyOccurrence, LocaleTypeWarning, MissingKey, SourceLocation, UnusedKey } from "./types.ts"
import { formatFilePath, writeLine } from "./utils.ts"

export function formatSummaryPart(stream: Writable, value: number, severity: z.infer<typeof severityEnum>) {
  const color = value === 0 ? "green" : severity === "warning" ? "yellow" : "red"

  return styleText(color, String(value), { stream })
}

export function outputTypeWarnings(stream: Writable, warnings: LocaleTypeWarning[]): void {
  writeLine(stream, styleText("bold", `Warnings (${warnings.length}):`, { stream }))

  const grouped = Object.groupBy(warnings, (it) => it.file)

  for (const [file, fileTypeWarnings] of Object.entries(grouped)) {
    writeLine(stream, formatFilePath(file))

    for (const typeWarning of fileTypeWarnings ?? []) {
      writeLine(
        stream,
        `  • Unexpected type ${styleText("italic", typeWarning.type, { stream })} for key ${typeWarning.key}`,
      )
    }

    writeLine(stream)
  }
}

export function outputMissingKeys(stream: Writable, keys: MissingKey[]): void {
  writeLine(stream, styleText("bold", `Missing keys (${keys.length}):`, { stream }))

  for (const key of keys) {
    outputMissingKey(stream, key)
  }
}

function outputMissingKey(stream: Writable, key: MissingKey) {
  for (const source of key.sources) {
    writeLine(stream, `  ${formatFilePath(source.file)}:${source.location.start.line}:${source.location.start.column}`)

    const content = readSourceFile(source.file)

    if (content != null) {
      writeLine(
        stream,
        codeFrameColumns(content, toCodeFrameLocation(source.location), {
          highlightCode: streamHasColors(stream),
          linesAbove: 1,
          linesBelow: 1,
          message: `Missing in ${styleText("bold", key.locales.join(", "), { stream })}`,
        }),
      )
    }

    writeLine(stream)
  }
}

function readSourceFile(file: string): string | null {
  try {
    return readFileSync(file, { encoding: "utf-8" })
  } catch {
    return null
  }
}

function toCodeFrameLocation(location: SourceLocation) {
  return {
    start: { line: location.start.line, column: location.start.column - 1 },
    end: { line: location.end.line, column: location.end.column - 1 },
  }
}

function streamHasColors(stream: Writable): stream is TTYWriteStream {
  return stream instanceof TTYWriteStream && stream.hasColors()
}

export function outputUnusedKeys(stream: Writable, keys: UnusedKey[]): void {
  writeLine(stream, styleText("bold", `Unused keys (${keys.length}):`, { stream }))

  const sortedKeys = keys.toSorted((a, b) => b.files.length - a.files.length || a.key.localeCompare(b.key))
  const rows = sortedKeys.map((unusedKey) => [unusedKey.key, unusedKey.files.map((file) => file.locale).join(", ")])
  const config: TableUserConfig = {
    drawHorizontalLine(index, size) {
      return index === 0 || index === 1 || index === size
    },
  }

  writeLine(stream, table([["Key", "Locales"], ...rows], config))
}

export function outputDynamicKeys(stream: Writable, keys: DynamicKeyOccurrence[]): void {
  writeLine(stream, styleText("bold", `Dynamic keys (${keys.length}):`, { stream }))

  for (const occurrence of keys) {
    const source = occurrence.source

    writeLine(stream, `  ${formatFilePath(source.file)}:${source.location.start.line}:${source.location.start.column}`)

    const content = readSourceFile(source.file)

    if (content != null) {
      writeLine(
        stream,
        codeFrameColumns(content, toCodeFrameLocation(source.location), {
          highlightCode: streamHasColors(stream),
          linesAbove: 1,
          linesBelow: 1,
          message: occurrence.partial ? "Partial dynamic key" : "Dynamic key",
        }),
      )
    }

    writeLine(stream)
  }
}

export function outputJson(
  stream: Writable,
  data: {
    missingKeys: MissingKey[] | undefined
    unusedKeys: UnusedKey[] | undefined
    dynamicKeys: DynamicKeyOccurrence[] | undefined
  },
): void {
  writeLine(stream, JSON.stringify(data, null, 2))
}

export function outputToon(
  stream: Writable,
  data: {
    missingKeys: MissingKey[] | undefined
    unusedKeys: UnusedKey[] | undefined
    dynamicKeys: DynamicKeyOccurrence[] | undefined
  },
): void {
  writeLine(stream, encode(data))
}
