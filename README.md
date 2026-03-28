# vue-i18n-lint

Fast and accurate linting for Vue i18n. Detects missing and unused translation keys across your locale files and source
code.

## Installation

```sh
npm install -D vue-i18n-lint
```

## Usage

```sh
npx vue-i18n-lint [options] [path]
```

`path` defaults to the current working directory.

### Options

| Option             | Description                             | Default                            |
|--------------------|-----------------------------------------|------------------------------------|
| `--localePattern`  | Glob pattern for i18n locale files      | `**/locales/*.json`                |
| `--srcPattern`     | Glob pattern for source files           | `**/*.{ts,cts,mts,js,cjs,mjs,vue}` |
| `--ignorePatterns` | Comma-separated glob patterns to ignore |                                    |

### Example

```sh
npx vue-i18n-lint --localePattern "**/i18n/*.{json}" ./my-project
```

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
