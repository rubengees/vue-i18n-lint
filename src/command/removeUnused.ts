import { writeFile } from "node:fs/promises"
import { extname } from "node:path"
import { type ApplicationContext, buildCommand } from "@stricli/core"
import { stringifyJSON, stringifyJSON5, stringifyJSONC, stringifyYAML } from "confbox"
import { defu } from "defu"
import { loadVueI18nLintConfig } from "../config/load.ts"
import type { CliArgs } from "../config/schema.ts"
import { processFiles } from "../processor.ts"
import { isPlainObject, writeLine } from "../utils.ts"
import { collectFiles } from "./shared.ts"

type Flags = Pick<CliArgs, "localePattern" | "srcPattern" | "ignorePatterns" | "ignoreKeys" | "ignoreUnusedKeys"> & {
  dryRun?: boolean
}

export const removeUnusedCommand = buildCommand({
  async func(this: ApplicationContext, flags: Flags, path?: string) {
    const targetPath = path || process.cwd()

    const config = await loadVueI18nLintConfig(targetPath, {
      localePattern: flags.localePattern,
      srcPattern: flags.srcPattern,
      ignorePatterns: flags.ignorePatterns,
      ignoreKeys: flags.ignoreKeys,
      ignoreUnusedKeys: flags.ignoreUnusedKeys,
    })

    const { localeFiles, sourceFiles, parseErrors } = await collectFiles(targetPath, config, this.process)

    const { unused } = processFiles(
      localeFiles,
      sourceFiles,
      defu({ checks: { missingKeys: { severity: "off" }, unusedKeys: { severity: "error" } } }, config),
    )

    const unusedSet = new Set(
      unused?.filter((it) => it.files.some((file) => file.scope === "global")).map((it) => it.key) ?? [],
    )

    if (parseErrors > 0) {
      writeLine(this.process.stdout)
    }

    if (unusedSet.size === 0) {
      writeLine(this.process.stdout, "No unused keys found.")
      return
    }

    if (!flags.dryRun) {
      await Promise.all(
        localeFiles.map(async (localeFile) => {
          const ext = extname(localeFile.file)
          const stringifier = stringifiers[ext]
          if (!stringifier) return

          removeKeysFromData(localeFile.rawData, unusedSet)

          await writeFile(localeFile.file, stringifier(localeFile.rawData), "utf-8")
        }),
      )
    }

    writeLine(
      this.process.stdout,
      flags.dryRun
        ? `Would remove ${unusedSet.size} unused key${unusedSet.size === 1 ? "" : "s"}.`
        : `Removed ${unusedSet.size} unused key${unusedSet.size === 1 ? "" : "s"}.`,
    )

    if (parseErrors > 0) {
      this.process.exitCode = 1
    }
  },
  parameters: {
    flags: {
      dryRun: { kind: "boolean", optional: true, brief: "Print count without modifying files" },
      localePattern: { kind: "parsed", parse: String, optional: true, brief: "Glob pattern for i18n locale files" },
      srcPattern: { kind: "parsed", parse: String, optional: true, brief: "Glob pattern for source files" },
      ignorePatterns: {
        kind: "parsed",
        parse: String,
        optional: true,
        variadic: ",",
        brief: "Comma-separated glob patterns to ignore",
      },
      ignoreKeys: {
        kind: "parsed",
        parse: String,
        optional: true,
        variadic: ",",
        brief: "Comma-separated keys to ignore",
      },
      ignoreUnusedKeys: {
        kind: "parsed",
        parse: String,
        optional: true,
        variadic: ",",
        brief: "Comma-separated keys to ignore in the unused keys check",
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Working directory",
          parse: String,
          placeholder: "path",
          optional: true,
        },
      ],
    },
  },
  docs: {
    brief: "Remove unused i18n keys from locale files",
  },
})

const stringifiers: Record<string, (data: Record<string, unknown>) => string> = {
  ".json": (data) => stringifyJSON(data, { indent: 2 }),
  ".jsonc": (data) => stringifyJSONC(data, { indent: 2 }),
  ".json5": (data) => stringifyJSON5(data, { indent: 2 }),
  ".yaml": (data) => stringifyYAML(data, { indent: 2 }),
  ".yml": (data) => stringifyYAML(data, { indent: 2 }),
}

function removeKeysFromData(data: unknown, keys: Set<string>, prefix: string = ""): boolean {
  if (typeof data !== "object" || data == null) return false

  if (isPlainObject(data)) {
    for (const key of Object.keys(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (keys.has(fullKey) || removeKeysFromData(data[key], keys, fullKey)) {
        delete data[key]
      }
    }

    return Object.keys(data).length === 0
  }

  if (Array.isArray(data)) {
    for (let i = data.length - 1; i >= 0; i--) {
      const fullKey = prefix ? `${prefix}.${i}` : String(i)
      if (keys.has(fullKey) || removeKeysFromData(data[i], keys, fullKey)) {
        data.splice(i, 1)
      }
    }

    return data.length === 0
  }

  return false
}
