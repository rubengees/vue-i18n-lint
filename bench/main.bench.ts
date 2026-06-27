import { copyFile, mkdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { run, type StricliProcess } from "@stricli/core"
import { afterAll, beforeAll, bench } from "vitest"
import { app } from "../src/app.ts"

const FIXTURES = "bench/fixtures"
const LOCALE_PATTERN = "locales/*.json"
const SRC_PATTERN = "src/**/*.{ts,vue}"

const tmpBase = join(tmpdir(), `vue-i18n-lint-bench-${Date.now()}`)

async function generateProject(srcDirs: number, locales: number) {
  await Promise.all(
    Array.from({ length: srcDirs }, async (_, i) => {
      const dir = join(tmpBase, "src", `dir${i}`, ...Array(i % 10).fill("a"))

      await mkdir(dir, { recursive: true })

      const noTranslations = i % 5 === 0
      const dynamic = !noTranslations && i % 5 === 0

      await Promise.all([
        copyFile(
          resolve(
            FIXTURES,
            noTranslations ? "component-no-translations.vue" : dynamic ? "component-dynamic.vue" : "component.vue",
          ),
          join(dir, `component${i}.vue`),
        ),
        copyFile(
          resolve(FIXTURES, noTranslations ? "script-no-translations.ts" : dynamic ? "script-dynamic.ts" : "script.ts"),
          join(dir, `script${i}.ts`),
        ),
      ])
    }),
  )

  await mkdir(join(tmpBase, "locales"), { recursive: true })

  await Promise.all(
    Array.from({ length: locales }, async (_, i) => {
      await Promise.all([
        copyFile(resolve(FIXTURES, "locale.json"), join(tmpBase, "locales", `locale${i}-json.json`)),
        copyFile(resolve(FIXTURES, "locale.yaml"), join(tmpBase, "locales", `locale${i}-yaml.yaml`)),
      ])
    }),
  )
}

function makeNoopProcess(): StricliProcess {
  return {
    stdout: { write() {} },
    stderr: { write() {} },
  }
}

async function runLint() {
  await run(app, [tmpBase, "--locale-pattern", LOCALE_PATTERN, "--src-pattern", SRC_PATTERN], {
    process: makeNoopProcess(),
  })
}

async function runRemoveUnused() {
  await run(
    app,
    ["removeUnused", tmpBase, "--locale-pattern", LOCALE_PATTERN, "--src-pattern", SRC_PATTERN, "--dry-run"],
    { process: makeNoopProcess() },
  )
}

beforeAll(async () => {
  await generateProject(1000, 20)
})

afterAll(async () => {
  await rm(tmpBase, { recursive: true, force: true })
})

bench("Remove unused keys from large project", runRemoveUnused)
bench("Lint large project", runLint)
