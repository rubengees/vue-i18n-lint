import { type ParserOptions, parseSync, type Program } from "oxc-parser"
import { ParseError } from "../error.ts"
import { offsetToPosition } from "../utils.ts"

export type ScriptParserOptions = {
  lang?: string | undefined
  wrapInParens?: boolean | undefined
  fileSource?: string | undefined
  offset?: number | undefined
}

export function parseScript(file: string, content: string, options: ScriptParserOptions = {}): Program {
  const source = options.wrapInParens ? `(${content})` : content
  const parseOptions: ParserOptions = {}

  const lang = asLang(options.lang)
  if (lang) parseOptions.lang = lang

  const { program, errors } = parseSync(file, source, parseOptions)

  if (errors.length > 0) {
    const messages = errors.map((e) => `  • ${e.message}`).join("\n")
    const firstError = errors[0]!

    const rawOffset = firstError.labels?.[0]?.start ?? 0
    const { line, column } = offsetToPosition(options.fileSource ?? content, rawOffset + (options.offset ?? 0))

    throw new ParseError(`Failed to parse script:\n${messages}`, file, { line, column })
  }

  return program
}

function asLang(lang: string | undefined): ParserOptions["lang"] | undefined {
  if (lang === "js" || lang === "jsx" || lang === "ts" || lang === "tsx" || lang === "dts") {
    return lang
  }

  if (lang !== undefined) {
    throw new ParseError(`Unsupported script lang: "${lang}"`, "", { line: 0, column: 0 })
  }

  return undefined
}
