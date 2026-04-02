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

| Option             | Description                             | Default                            |
| ------------------ | --------------------------------------- | ---------------------------------- |
| `--localePattern`  | Glob pattern for i18n locale files      | `**/locales/*.json`                |
| `--srcPattern`     | Glob pattern for source files           | `**/*.{ts,cts,mts,js,cjs,mjs,vue}` |
| `--ignorePatterns` | Comma-separated glob patterns to ignore |                                    |

### Example

```sh
npx vue-i18n-lint --localePattern "**/i18n/*.{json}" ./my-project
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
})
```

Use the exported `defineConfig` helper for TypeScript autocompletion.

### gitignore

Files matched by any `.gitignore` in your project are automatically excluded when scanning locale and source files,
in addition to any `ignorePatterns` you configure.

## What it checks

- **Missing keys**: Translation keys used in source code but not defined in any locale file
- **Unused keys**: Translation keys defined in locale files but never referenced in source code

## Supported formats

- JSON, JSONC, JSON5
- YAML

## Exit codes

- `0` — No missing keys
- `1` — One or more missing keys found

## Requirements

- Node.js >= 22
