# vue-i18n-lint

Fast and accurate linting for Vue i18n. Detects missing and unused translation keys across your locale files and source
code.

Intended for use in CI pipelines, pre-commit hooks, or as part of your development workflow to maintain translation
integrity.

## Usage

```sh
npx vue-i18n-lint [options] [path]
```

`path` defaults to the current working directory.

<details>
<summary>pnpm</summary>

```sh
pnpm dlx vue-i18n-lint [options] [path]
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn dlx vue-i18n-lint [options] [path]
```

</details>

<details>
<summary>Bun</summary>

```sh
bunx vue-i18n-lint [options] [path]
```

</details>

## Installation

The cli can also be installed and run locally in your project:

```sh
npm install -D vue-i18n-lint
```

<details>
<summary>pnpm</summary>

```sh
pnpm add -D vue-i18n-lint [options] [path]
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn add -D vue-i18n-lint [options] [path]
```

</details>

<details>
<summary>Bun</summary>

```sh
bun add -D vue-i18n-lint [options] [path]
```

</details>

You can run it like this:

```sh
vue-i18n-lint [options] [path]
```

### Options

| Option                    | Description                                                   | Default                            |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| `--locale-pattern`        | Glob pattern for i18n locale files                            | `**/locales/*.json`                |
| `--src-pattern`           | Glob pattern for source files                                 | `**/*.{ts,cts,mts,js,cjs,mjs,vue}` |
| `--ignore-patterns`       | Comma-separated glob patterns to ignore                       |                                    |
| `--ignore-keys`           | Comma-separated keys to ignore in all checks                  |                                    |
| `--ignore-missing-keys`   | Comma-separated keys to ignore only in the missing keys check |                                    |
| `--ignore-unused-keys`    | Comma-separated keys to ignore only in the unused keys check  |                                    |
| `--missing-keys-severity` | Severity for missing keys: `error`, `warning`, or `off`       | `error`                            |
| `--unused-keys-severity`  | Severity for unused keys: `error`, `warning`, or `off`        | `warning`                          |

### Example

```sh
npx vue-i18n-lint --locale-pattern "**/i18n/*.{json}" ./my-project
```

## Configuration file

In addition to CLI options, vue-i18n-lint can be configured via a config file in your project root.
[c12](https://github.com/unjs/c12) is used for config loading, so the following file names are supported:

- `vue-i18n-lint.config.ts`
- `vue-i18n-lint.config.js`
- `vue-i18n-lint.config.json`
- `vue-i18n-lint.config.yaml`

```ts
// vue-i18n-lint.config.ts
import { defineConfig } from "vue-i18n-lint"

export default defineConfig({
  localePattern: "**/i18n/*.json",
  srcPattern: "**/*.{ts,vue}",
  ignorePatterns: ["**/fixtures/**"],
  ignoreKeys: ["dynamic.key"],
  checks: {
    missingKeys: {
      severity: "error",
      ignore: ["only.missing"],
    },
    unusedKeys: {
      severity: "warning",
      ignore: ["only.unused"],
    },
  },
})
```

Use the exported `defineConfig` helper for TypeScript autocompletion.

### gitignore

Files matched by any `.gitignore` in your project are automatically excluded when scanning locale and source files,
in addition to any `ignorePatterns` you configure.

## What it checks

- **Missing keys**: Translation keys used in source code but not defined in any locale file
- **Unused keys**: Translation keys defined in locale files but never referenced in source code

### Dynamic keys

Keys that contain runtime variables are supported on a best-effort basis. Both template literals
and `+` concatenation are recognised:

```ts
t(`a.b.${variable}.c`)       // pattern: a.b.*.c
t("a.b." + variable + ".c") // pattern: a.b.*.c
```

Each variable part is treated as a wildcard (`*`) that matches one or more dot-separated key segments.

- **Missing**: a dynamic key is only reported missing if no locale key matches its pattern.
- **Unused**: a locale key is not reported unused if a dynamic key pattern matches it.

Fully dynamic keys (`t(someVariable)`) are ignored.

## Supported locale file formats

- JSON, JSONC, JSON5
- YAML
- JS/TS modules (expecting a default export of an object)
- `<i18n>` blocks in Vue SFCs

## Severity levels

Each check (`missingKeys`, `unusedKeys`) supports a `severity` setting:

| Value       | Behavior                                                    |
| ----------- | ----------------------------------------------------------- |
| `"error"`   | Prints output and sets exit code to `1` if issues are found |
| `"warning"` | Prints output but does not set exit code to `1`             |
| `"off"`     | Does not print output and does not affect exit code         |

## Requirements

- Node.js >= 22
