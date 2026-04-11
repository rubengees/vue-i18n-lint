export type SourceFile = {
  keys: FileKey[]
  localeFiles: LocaleFile[]
}

export type LocaleFile = {
  locale: string
  file: string
  keys: string[]
  scope: "global" | "local"
  sourceFile?: string
}

export type Position = {
  line: number
  column: number
}

export type SourceLocation = {
  start: Position
  end: Position
}

export type FileKey = {
  key: string
  file: string
  location: SourceLocation
}

export type SourceKey = {
  key: string
  start: number
  end: number
}

export type MissingKey = {
  key: string
  locales: string[]
  sources: { file: string; location: SourceLocation }[]
}

export type UnusedKey = {
  key: string
  files: {
    locale: string
    file: string
    scope: "global" | "local"
  }[]
}

export type ProcessResult = {
  missing: MissingKey[]
  unused: UnusedKey[]
}
