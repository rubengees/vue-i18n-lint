export type I18nFile = {
  locale: string
  file: string
  keys: string[]
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
  }[]
}

export type ProcessResult = {
  missing: MissingKey[]
  unused: UnusedKey[]
}
