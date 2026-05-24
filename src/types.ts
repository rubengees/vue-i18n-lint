export type SourceFile = {
  keys: FileKey[]
  localeFiles: LocaleFile[]
}

export type LocaleFile = {
  locale: string
  file: string
  keys: LocaleKey[]
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
  isDynamic?: boolean
}

export type LocaleKey = {
  key: string
  type: string
}

export type SourceKey = {
  key: string
  start: number
  end: number
  isDynamic?: boolean
}

export type MissingKey = {
  key: string
  locales: string[]
  sources: { file: string; location: SourceLocation }[]
}

export type UnusedKey = {
  key: string
  files: UnusedKeyFile[]
}

export type UnusedKeyFile = {
  locale: string
  file: string
  scope: "global" | "local"
}

export type LocaleTypeWarning = {
  key: string
  locale: string
  file: string
  type: string
}

export type ProcessResult = {
  typeWarnings: LocaleTypeWarning[]
  missing: MissingKey[]
  unused: UnusedKey[]
}
