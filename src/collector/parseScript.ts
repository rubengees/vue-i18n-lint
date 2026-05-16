import { type Program, parseSync, type ParserOptions } from "oxc-parser"

export interface ParseScriptOptions {
  lang?: string | undefined
  wrapInParens?: boolean
  loc?: {
    line: number
    column: number
  }
}

export function parseScript(filename: string, content: string, options: ParseScriptOptions = {}): Program {
  const source = options.wrapInParens ? `(${content})` : content
  const parseOptions: ParserOptions = {}

  const lang = asLang(options.lang)
  if (lang) parseOptions.lang = lang

  const { program, errors } = parseSync(filename, source, parseOptions)

  if (errors.length > 0) {
    const location = options.loc ? `at ${filename}:${options.loc.line}:${options.loc.column}` : filename

    console.error(`Failed to parse script ${location}:\n${errors.map((e) => `  • ${e.message}`).join("\n")}\n`)
  }

  return program
}

function asLang(lang: string | undefined): ParserOptions["lang"] | undefined {
  if (lang === "js" || lang === "jsx" || lang === "ts" || lang === "tsx" || lang === "dts") {
    return lang
  }

  return undefined
}
