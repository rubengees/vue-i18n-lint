import { type Argument, type Program, Visitor } from "oxc-parser"
import type { SourceKey } from "../types.ts"
import { TRANSLATION_FUNCTIONS } from "./translationFunctions.ts"

export function collectJsKeys(program: Program, offset: number = 0): SourceKey[] {
  const result: SourceKey[] = []

  const visitor = new Visitor({
    CallExpression(node) {
      if (!isTranslationFunction(node)) return

      const arg = node.arguments[0]
      if (!arg || !isKeyArgument(arg)) return

      result.push({
        key: arg.value,
        start: offset + arg.start + 1,
        end: offset + arg.end - 1,
      })
    },
  })

  visitor.visit(program)

  return result
}

function isTranslationFunction(node: any): boolean {
  if (node.callee.type === "Identifier") {
    return TRANSLATION_FUNCTIONS.has(node.callee.name)
  }

  if (node.callee.type === "MemberExpression" && node.callee.property.type === "Identifier") {
    return TRANSLATION_FUNCTIONS.has(node.callee.property.name)
  }

  return false
}

function isKeyArgument(arg: Argument) {
  return arg.type === "Literal" && typeof arg.value === "string"
}
