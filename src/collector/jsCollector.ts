import { type Argument, type Program, Visitor } from "oxc-parser"
import type { SourceKey } from "../types.ts"
import { TRANSLATION_FUNCTIONS } from "./translationFunctions.ts"

export function collectJsKeys(program: Program, offset: number = 0): SourceKey[] {
  const result: SourceKey[] = []

  const visitor = new Visitor({
    CallExpression(node) {
      if (!isTranslationFunction(node)) return

      const arg = node.arguments[0]
      if (!arg) return

      if (isKeyArgument(arg)) {
        result.push({
          key: arg.value,
          start: offset + arg.start + 1,
          end: offset + arg.end - 1,
        })
        return
      }

      const pattern = extractDynamicPattern(arg)
      if (pattern !== null) {
        result.push({
          key: pattern,
          start: offset + arg.start,
          end: offset + arg.end,
          isDynamic: true,
        })
      }
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

function isKeyArgument(arg: Argument): arg is Argument & { value: string } {
  return arg.type === "Literal" && typeof (arg as any).value === "string"
}

/**
 * Extracts a dynamic key pattern from a template literal or binary `+` expression.
 * Returns a pattern string with `*` wildcards for variable parts, or `null` if the
 * expression cannot be reduced to a useful pattern.
 *
 * Examples:
 *   `a.b.${x}.c`          → "a.b.*.c"
 *   "a.b." + key + ".c"   → "a.b.*.c"
 */
function extractDynamicPattern(arg: Argument): string | null {
  if (arg.type === "TemplateLiteral") {
    const node = arg as any
    if (node.expressions.length === 0) return null

    const parts: (string | null)[] = node.quasis.map((q: any) => q.value.cooked as string | null)
    if (parts.some((p) => p === null)) return null

    return (parts as string[]).join("*")
  }

  if (arg.type === "BinaryExpression" && (arg as any).operator === "+") {
    const pattern = extractPatternPart(arg as any)
    return pattern !== null && pattern.includes("*") ? pattern : null
  }

  return null
}

function extractPatternPart(node: any): string | null {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value
  }

  if (node.type === "TemplateLiteral") {
    if (node.expressions.length === 0) {
      return node.quasis[0]?.value.cooked ?? null
    }

    const parts: (string | null)[] = node.quasis.map((q: any) => q.value.cooked as string | null)
    if (parts.some((p) => p === null)) return null

    return (parts as string[]).join("*")
  }

  if (node.type === "BinaryExpression" && node.operator === "+") {
    const leftPart = extractPatternPart(node.left)
    const rightPart = extractPatternPart(node.right)

    if (leftPart === null && rightPart === null) return null

    return (leftPart ?? "*") + (rightPart ?? "*")
  }

  return null
}
