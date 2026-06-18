# AGENTS.md

CLI tool that lints Vue i18n projects: detects missing keys, unused keys, and non-string/function locale values. Built for CI, pre-commit hooks, and dev workflows.

## Tech Stack

This project deliberately uses the **OXC toolchain** plus **tsgo** instead of the mainstream JS/TS tools. Do not swap them out.

- **Language**: TypeScript, ESM only (`"type": "module"`)
- **Runtime**: Node.js >= 22 (CI tests 22, 24, 26)
- **Package manager**: pnpm (always — never npm/yarn)
- **Build**: `tsdown` (rolldown-based) → `dist/cli.mjs`, `dist/index.mjs`, `dist/index.d.mts`
- **Lint**: `oxlint` (+ `oxlint-tsgolint` for type-aware rules) — _not_ ESLint
- **Format**: `oxfmt` — _not_ Prettier
- **Type check**: `tsgo` (`@typescript/native-preview`) — _not_ `tsc`
- **Test/bench**: `vitest`
- **Dev runner**: `jiti` (runs CLI from source, no build needed)
- **Key deps**: `@stricli/core` (CLI), `c12` (config), `globby`, `@vue/compiler-sfc`, `oxc-parser`, `zod` v4, `defu`, `confbox`

## Commands

| Command             | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev`          | Vitest watch mode                                     |
| `pnpm start`        | Run CLI from source via jiti (no build)               |
| `pnpm build`        | Bundle to `dist/`                                     |
| `pnpm test`         | Run tests once                                        |
| `pnpm lint`         | Run oxlint (`maxWarnings: 0`, type-aware)             |
| `pnpm format`       | Run oxfmt in place                                    |
| `pnpm format:check` | Check formatting only                                 |
| `pnpm check`        | Type check via tsgo                                   |
| `pnpm verify`       | `format:check && lint && check && test` — the CI gate |
| `pnpm bench`        | Run benchmarks                                        |

**Always run `pnpm verify` before declaring work done.** It is exactly what CI runs.

## Project Structure

```
src/
  app.ts                 # Application definition (routes, help config)
  cli.ts                 # CLI entry (#!/usr/bin/env node banner)
  index.ts               # Library entry — exports defineConfig + VueI18nLintConfig
  processor.ts           # Diff logic: missing/unused/typeWarnings
  formatter.ts           # Console output (code frames, tables)
  filter.ts              # Applies ignore lists
  error.ts               # ParseError + formatErrorMessage
  utils.ts               # merge, writeLine, PrefixSet, position helpers
  types.ts               # Domain types (SourceFile, LocaleFile, FileKey, DynamicKey)
  command/{lint,init}.ts # @stricli/core commands
  config/{schema,load}.ts # zod schema + c12 loader
  collector/             # Source/locale/Vue/JS collectors
  parser/                # oxc-parser + confbox/jiti wrappers
test/                    # Mirrors src/ layout; fixtures under test/fixtures/
bench/                   # vitest bench + generated fixtures
```

## Code Style & Conventions

Configured via `.oxfmtrc.json`, `.oxlintrc.json`, `tsconfig.json`:

- Double quotes, **no semicolons**, trailing commas, 2-space indent, ~120 char width
- **Imports must use `.ts` extensions**: `import { foo } from "./bar.ts"` (relies on `rewriteRelativeImportExtensions`)
- **`import type { ... }` for type-only imports** (`verbatimModuleSyntax: true`, enforced by `typescript/consistent-type-imports`)
- `node:` prefix for Node built-ins (`node:fs/promises`, `node:path`)
- `type X = ...` aliases preferred over interfaces
- Explicit return types on exported functions; named functions for top-level, arrows for inline callbacks
- `noUncheckedIndexedAccess` is on — array/index access yields `T | undefined`; handle it (in tests, `array[0]!` is acceptable)
- `exactOptionalPropertyTypes` is on — don't pass `undefined` where the property is omitted
- Heavy use of `Map`/`Set` and helpers like `mapGetOrInsert`, `getOrInsertComputed`, `newPrefixSet`

## Testing

- Vitest, no custom config. Tests in `test/`, mirroring `src/` layout.
- Style: top-level `test("...", () => {})`; `describe` only when grouping is useful.
- **Use `toStrictEqual`, not `toEqual`** (enforced by `vitest/prefer-strict-equal`).
- Console assertions: use `buildTestProcess`, `runTest`, `expectStdoutContains`, `expectStdoutNotContains`, `expectStderrContains` from `test/helpers.ts` — wraps `@stricli/core`'s `run` with in-memory streams and handles ANSI stripping.
- CLI tests: `runTest([...])` returns a `TestProcess` with captured stdout/stderr + exit code.
- Fixtures: `test/fixtures/projects/<name>/{locales,src}/...` for end-to-end; `test/fixtures/{vue,ts,js,locales,config}/` for unit-level.

## Architecture Notes

**Pipeline**: `globby` → `collectLocaleFile` / `collectSourceFile` (parallel) → `processFiles` (diff) → `filterResults` (ignores) → `formatter` → exit code.

Key concepts:

- **`FileKey.key`** is `string` (static) or `DynamicKey = (string | typeof DYNAMIC_PART)[]` (template literals / concatenations with runtime parts). `DYNAMIC_PART` is a `unique symbol`.
- **Dynamic key matching**: regex built per dynamic key (`^prefix.*suffix$`), cached in a `Map`; combined via alternation for unused-key checks.
- **Prefix coverage**: `aa.bb` covers `aa.bb.cc` and vice versa for missing-key checks. Implemented by `PrefixSet`, which pre-expands all dot-segment prefixes.
- **Scope**: locale files are `"global"` (matched by `localePattern`) or `"local"` (`<i18n>` SFC blocks scoped to their component).
- **Translation function detection**: `TRANSLATION_FUNCTIONS = Set(['t','te','tm','tc','$t','$te','$tm','$tc'])`. A regex fast-path (`/\$?t[emc]?\s*\(/`) gates the full oxc parser.
- **Errors**: `ParseError` carries `file/line/column`; unparseable files are _skipped_ (logged, exit bumped to 1) — one bad file does not abort the run.
- **Config**: `c12` loads `vue-i18n-lint.config.{ts,js,json,yaml}`. CLI args take precedence. Merge via `merge` in `utils.ts` (defu-based) where **arrays from higher-priority layers replace, not concatenate**. Final result validated by zod.
- **CLI**: `@stricli/core` `buildCommand` / `buildRouteMap` / `buildApplication`. `init` and `lint` are proper routes; `lint` is the default command.

## Git & Workflow

- Default branch: `main`. Author: Ruben Gees.
- **Commit messages**: short, imperative, sentence-cased, **no Conventional Commit prefixes**. Examples: `Implement init command`, `Fix position edge case`, `Add support for v-t directive`.
- Pre-commit (`.husky/pre-commit` → `lint-staged`): runs `oxfmt`, `oxlint --fix`, and `tsgo --noEmit` (full project) on staged changes.
- CI (`.github/workflows/ci.yml`): `pnpm install` → `pnpm verify` → `pnpm build` on Node 22/24/26.
- Only commit/push when explicitly asked.
