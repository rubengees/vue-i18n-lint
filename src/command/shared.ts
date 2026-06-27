import { resolve } from "node:path"
import type { StricliProcess } from "@stricli/core"
import { globby } from "globby"
import { collectLocaleFile } from "../collector/localeCollector.ts"
import { collectSourceFile } from "../collector/sourceCollector.ts"
import type { ConfigOutput } from "../config/schema.ts"
import { formatErrorMessage } from "../error.ts"
import type { LocaleFile, SourceFile } from "../types.ts"
import { writeLine } from "../utils.ts"

export async function collectFiles(config: ConfigOutput, process: StricliProcess) {
  const globOptions = {
    cwd: config.path,
    ignore: config.ignorePatterns,
    gitignore: true,
  }

  const [rawLocalePaths, rawSrcPaths] = await Promise.all([
    globby(config.localePattern, globOptions),
    globby(config.srcPattern, globOptions),
  ])

  const [localeFiles, sourceFiles] = await Promise.all([
    Promise.all(rawLocalePaths.map((p) => collectFile(resolve(config.path, p), collectLocaleFile, process))),
    Promise.all(rawSrcPaths.map((p) => collectFile(resolve(config.path, p), collectSourceFile, process))),
  ])

  const validLocaleFiles = localeFiles.filter((f): f is LocaleFile => f != null)
  const validSourceFiles = sourceFiles.filter((f): f is SourceFile => f != null)
  const parseErrors = localeFiles.length - validLocaleFiles.length + (sourceFiles.length - validSourceFiles.length)

  return {
    localeFiles: validLocaleFiles,
    sourceFiles: validSourceFiles,
    parseErrors,
  }
}

async function collectFile<T>(
  file: string,
  collect: (file: string) => Promise<T>,
  process: StricliProcess,
): Promise<T | null> {
  try {
    return await collect(file)
  } catch (e) {
    writeLine(process.stderr, `Failed to process: ${formatErrorMessage(e)}`)
    return null
  }
}
