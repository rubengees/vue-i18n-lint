import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "@vue/compiler-sfc"
import { parseSync } from "oxc-parser"
import type { FileKey, SourceKey } from "../types.ts"
import { collectJsKeys } from "./jsCollector.ts"
import { collectVueKeys } from "./vueCollector.ts"

export function collectFileKeys(filePath: string): FileKey[] {
  const file = resolve(filePath)
  const source = readFileSync(file, { encoding: "utf-8" })
  const keys = filePath.endsWith(".vue") ? collectFromVue(source, filePath) : collectFromScript(source, filePath)

  return keys.map(({ key, start, end }) => {
    const startPos = offsetToPosition(source, start)
    const endPos = offsetToPosition(source, end)

    return { key, file, location: { start: startPos, end: endPos } }
  })
}

function collectFromScript(source: string, filename: string): SourceKey[] {
  const { program } = parseSync(filename, source)
  return collectJsKeys(program)
}

function collectFromVue(source: string, filename: string): SourceKey[] {
  const { descriptor } = parse(source, { filename })
  const keys: SourceKey[] = []

  const templateAst = descriptor.template?.ast
  if (templateAst) keys.push(...collectVueKeys(templateAst))

  for (const script of [descriptor.script, descriptor.scriptSetup]) {
    if (!script) continue
    const { program } = parseSync(filename, script.content)
    keys.push(...collectJsKeys(program, script.loc.start.offset))
  }

  return keys
}

function offsetToPosition(source: string, offset: number): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n")

  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  }
}
