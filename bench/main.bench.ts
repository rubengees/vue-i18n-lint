import { copyFile, mkdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { runMain } from "citty"
import { afterAll, beforeAll, bench, vi } from "vitest"
import { mainCommand } from "../src/command/main.ts"

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

      await Promise.all([
        copyFile(
          resolve(FIXTURES, noTranslations ? "component-no-translations.vue" : "component.vue"),
          join(dir, `component${i}.vue`),
        ),
        copyFile(
          resolve(FIXTURES, noTranslations ? "script-no-translations.ts" : "script.ts"),
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

async function run() {
  await runMain(mainCommand, {
    rawArgs: [tmpBase, "--localePattern", LOCALE_PATTERN, "--srcPattern", SRC_PATTERN],
  })
}

beforeAll(async () => {
  await generateProject(1000, 20)

  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(process, "exit").mockImplementation(vi.fn<(code?: number | string | null) => never>())
})

afterAll(async () => {
  await rm(tmpBase, { recursive: true, force: true })

  vi.restoreAllMocks()
})

bench("Large project", run)
