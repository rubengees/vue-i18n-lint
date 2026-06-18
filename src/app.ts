import { buildApplication, buildRouteMap } from "@stricli/core"
import { initCommand } from "./command/init.ts"
import { lintCommand } from "./command/lint.ts"

const root = buildRouteMap({
  routes: {
    lint: lintCommand,
    init: initCommand,
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
})
