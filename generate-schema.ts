import { readFile, writeFile } from "node:fs/promises"
import { format } from "oxfmt"
import { configSchema } from "./src/config/schema.ts"

const SCHEMA_FILE = "config.schema.json"
const SCHEMA_ID = "https://raw.githubusercontent.com/rubengees/vue-i18n-lint/main/config.schema.json"

const args = process.argv.slice(2)
const checkOnly = args.includes("--check")

const raw = configSchema.toJSONSchema({ target: "draft-2020-12", io: "input", unrepresentable: "any" })

const output = {
  $schema: raw.$schema ?? "https://json-schema.org/draft/2020-12/schema",
  $id: SCHEMA_ID,
  title: "vue-i18n-lint configuration",
  description: "Configuration schema for vue-i18n-lint",
  type: raw.type,
  properties: raw.properties,
  required: raw.required,
  additionalProperties: raw.additionalProperties,
}

const { code: content } = await format(SCHEMA_FILE, JSON.stringify(output, null, 2), {})

if (checkOnly) {
  const existing = await readFile(SCHEMA_FILE, "utf-8").catch(() => "")

  if (existing.trim() !== content.trim()) {
    console.error(`${SCHEMA_FILE} is out of date. Run \`pnpm generate-schema\` to update it.`)
    process.exit(1)
  }
} else {
  await writeFile(SCHEMA_FILE, content, "utf-8")
}
