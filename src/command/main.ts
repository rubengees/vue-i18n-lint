import { availableParallelism } from "node:os"
import { resolve } from "node:path"
import { styleText } from "node:util"
import { defineCommand } from "citty"
import { globby } from "globby"
import Tinypool from "tinypool"
import { collectLocaleFile } from "../collector/localeCollector.ts"
import { outputMissingKeys, outputUnusedKeys } from "../formatter.ts"
import { processFiles } from "../processor.ts"
import type { FileKey } from "../types.ts"

export const mainCommand = defineCommand({
  meta: {
    name: "vue-i18n-lint",
    description: "Fast and accurate linting for Vue i18n.",
  },
  args: {
    path: {
      type: "positional",
      description: "Working directory",
      default: process.cwd(),
    },
    localePattern: {
      type: "string",
      description: "Glob pattern for i18n locale files",
      default: "**/locales/*.json",
    },
    srcPattern: {
      type: "string",
      description: "Glob pattern for source files",
      default: "**/*.{ts,cts,mts,js,cjs,mjs,vue}",
    },
    ignorePatterns: {
      type: "string",
      description: "Comma-separated glob patterns to ignore",
    },
  },
  async run({ args }) {
    const startTime = performance.now()

    const ignorePatterns =
      args.ignorePatterns
        ?.split(",")
        ?.map((p) => p.trim())
        ?.filter((p) => p.length > 0) ?? []

    const rawLocaleFiles = await globby(args.localePattern, {
      cwd: args.path,
      ignore: ignorePatterns,
      gitignore: true,
    })

    const localeFiles = await Promise.all(rawLocaleFiles.map((path) => collectLocaleFile(resolve(args.path, path))))

    const rawSrcFiles = await globby(args.srcPattern, {
      cwd: args.path,
      ignore: ignorePatterns,
      gitignore: true,
    })

    const workerUrl = new URL(
      import.meta.url.endsWith(".ts") ? "../worker/fileWorker.ts" : "../worker/fileWorker.mjs",
      import.meta.url,
    )
    const threadCount = availableParallelism()
    const pool = new Tinypool({ filename: workerUrl.href, minThreads: threadCount })
    const resolvedSrcFiles = rawSrcFiles.map((path) => resolve(args.path, path))
    const chunkSize = Math.ceil(resolvedSrcFiles.length / threadCount)
    const chunks: string[][] = Array.from({ length: threadCount }, (_, i) =>
      resolvedSrcFiles.slice(i * chunkSize, (i + 1) * chunkSize),
    ).filter((chunk) => chunk.length > 0)
    const srcKeyArrays = await Promise.all(chunks.map((chunk): Promise<FileKey[]> => pool.run(chunk)))
    const srcKeys = srcKeyArrays.flat()
    await pool.destroy()

    const { missing, unused } = processFiles(localeFiles, srcKeys)
    const elapsed = Math.round(performance.now() - startTime)

    if (missing.length > 0) {
      outputMissingKeys(missing)
    }

    if (unused.length > 0) {
      outputUnusedKeys(unused)
    }

    console.log(
      `Found ${styleText("red", `${missing.length} missing`)} and ${styleText("yellow", `${unused.length} unused`)} keys.`,
    )

    console.log(`Processed ${rawLocaleFiles.length} i18n files and ${rawSrcFiles.length} source files in ${elapsed}ms.`)

    process.exit(missing.length > 0 ? 1 : 0)
  },
})
