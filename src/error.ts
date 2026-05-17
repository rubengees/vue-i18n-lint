import { formatFilePath } from "./utils.ts"

export type ParseErrorOptions = ErrorOptions & {
  line?: number | undefined
  column?: number | undefined
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly file: string,
    public readonly options?: ParseErrorOptions,
  ) {
    super(message, { cause: options?.cause })

    this.name = "ParseError"
  }
}

export function formatErrorMessage(e: unknown): string {
  if (!(e instanceof Error)) return String(e)

  if (e instanceof ParseError) {
    const location = formatFilePath(e.file, e.options?.line, e.options?.column)
    const detail = e.cause != null ? `: ${formatErrorMessage(e.cause)}` : ""
    return `${location}: ${e.message}${detail}`
  }

  if (e.cause != null) {
    return `${e.message}: ${formatErrorMessage(e.cause)}`
  } else {
    return e.message
  }
}
