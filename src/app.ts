import { buildApplication, buildRouteMap, text_en } from "@stricli/core"
import { initCommand } from "./command/init.ts"
import { lintCommand } from "./command/lint.ts"
import { removeUnusedCommand } from "./command/removeUnused.ts"
import { formatErrorMessage } from "./error.ts"

const root = buildRouteMap({
  routes: {
    lint: lintCommand,
    init: initCommand,
    removeUnused: removeUnusedCommand,
  },
  defaultCommand: "lint",
  docs: {
    brief: "Fast and accurate linting for Vue i18n.",
  },
})

export const app = buildApplication(root, {
  name: "vue-i18n-lint",
  scanner: {
    caseStyle: "allow-kebab-for-camel",
  },
  documentation: {
    caseStyle: "convert-camel-to-kebab",
  },
  localization: {
    text: {
      ...text_en,
      formatException: formatErrorMessage,
    },
  },
})
