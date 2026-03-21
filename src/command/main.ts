import { resolve } from "node:path"
import { styleText } from "node:util"
import { defineCommand } from "citty"
import { globby } from "globby"
import { collectFileKeys } from "../collector/fileCollector.ts"
import { collectI18nFile } from "../collector/jsonCollector.ts"
import { outputMissingKeys, outputUnusedKeys } from "../formatter.ts"
import { processFiles } from "../processor.ts"

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
    i18nPattern: {
      type: "string",
      description: "Glob pattern for i18n files",
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

    const rawI18nFiles = await globby(args.i18nPattern, {
      cwd: args.path,
      ignore: ignorePatterns,
      gitignore: true,
    })

    const i18nFiles = await Promise.all(rawI18nFiles.map((path) => collectI18nFile(resolve(args.path, path))))

    const rawSrcFiles = await globby(args.srcPattern, {
      cwd: args.path,
      ignore: ignorePatterns,
      gitignore: true,
    })

    const srcKeys = await Promise.all(rawSrcFiles.flatMap((path) => collectFileKeys(resolve(args.path, path))))

    const { missing, unused } = processFiles(i18nFiles, srcKeys)
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

    console.log(`Processed ${rawI18nFiles.length} i18n files and ${rawSrcFiles.length} source files in ${elapsed}ms.`)

    process.exit(missing.length > 0 ? 1 : 0)
  },
})
