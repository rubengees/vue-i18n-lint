# vue-i18n-lint

Fast and accurate linting for Vue i18n. Detects missing and unused translation keys across your locale files and source
code.

Intended for use in CI pipelines, pre-commit hooks, or as part of your development workflow to maintain translation
integrity.

Runs in under 1s for medium-sized projects thanks to the [OXC toolchain](https://oxc.rs/) and optimized algorithms.

## Quick start

```sh
npx vue-i18n-lint [command] [options] [path]
```

`path` defaults to the current working directory.

<details>
<summary>pnpm</summary>

```sh
pnpm dlx vue-i18n-lint [command] [options] [path]
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn dlx vue-i18n-lint [command] [options] [path]
```

</details>

<details>
<summary>Bun</summary>

```sh
bunx vue-i18n-lint [command] [options] [path]
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
pnpm add -D vue-i18n-lint
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn add -D vue-i18n-lint
```

</details>

<details>
<summary>Bun</summary>

```sh
bun add -D vue-i18n-lint
```

</details>

You can run it like this:

```sh
vue-i18n-lint [command] [options] [path]
```

### Subcommands

| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `lint` (default) | Detect missing and unused translation keys       |
| `remove-unused`  | Remove unused translation keys from locale files |
| `init`           | Scaffold a configuration file                    |

### Options

| Option                    | Description                                                   | Default                            |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| `--format`                | Output format: `text`, `json`, or `toon`                      | `text`                             |
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

Dynamic missing keys are reported with `<dynamic>` as a placeholder (e.g. `status.<dynamic>`).
Use that string in `ignoreKeys` or `checks.missingKeys.ignore` to suppress them.

### gitignore

Files matched by any `.gitignore` in your project are automatically excluded when scanning locale and source files,
in addition to any `ignorePatterns` you configure.

## Dynamic keys

Keys built from template literals or string concatenation with runtime variables are understood:

```ts
t(`status.${type}`) // matched against locale keys as "status.*"
t("prefix." + key) // matched against locale keys as "prefix.*"
```

A dynamic key is not reported missing if at least one locale key matches its pattern. Locale keys
that match a dynamic pattern are not reported as unused.

If no locale key matches, the missing key is reported with `<dynamic>` as a placeholder,
e.g. `status.<dynamic>`.

Purely dynamic expressions with no static fragments (e.g. `t(variable)`) are ignored.

Dynamic key support is best-effort. There are many more complex cases that can't be detected by vue-i18n-lint (yet).

> [!TIP]
> Ignoring dynamic keys is done using the `<dynamic>` placeholder, e.g. `ignoreKeys: ["status.<dynamic>"]`

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

## Creating configuration file

```sh
npx vue-i18n-lint init [path]
```

This command creates a config file with the defaults in the specified path
(or current working directory if not specified). The file format is auto-detected: If a `tsconfig.json` exists, a
TypeScript config file is created; otherwise, a JavaScript config file is created.

The `--format` option can be used to specify the file format (`ts`, `js`, `json`, or `yaml`).

## Removing unused keys

The `remove-unused` subcommand removes unused translation keys directly from your locale files. Only the simple
file types (JSON, JSONC, JSON5, YAML) are supported (JS/TS files and `<i18n>` blocks are ignored).

```sh
npx vue-i18n-lint remove-unused [options] [path]
```

Pass `--dry-run` to see how many keys would be removed without making changes:

```sh
npx vue-i18n-lint remove-unused --dry-run
```

> [!NOTE]
> The remove command is naively implemented. Files are reconstructed so comments or special formatting are lost.

## Requirements

- Node.js >= 22
