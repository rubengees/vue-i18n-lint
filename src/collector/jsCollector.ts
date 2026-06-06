import { type Argument, type Program, Visitor } from "oxc-parser"
import { DYNAMIC_PART, type DynamicKey, type SourceKey } from "../types.ts"
import { TRANSLATION_FUNCTIONS } from "./translationFunctions.ts"

export function collectJsKeys(program: Program, offset: number = 0): SourceKey[] {
  const result: SourceKey[] = []

  const visitor = new Visitor({
    CallExpression(node) {
      if (!isTranslationFunction(node)) return

      const arg = node.arguments[0]
      if (!arg) return

      const keys = extractKey(arg, offset)
      result.push(...keys)
    },
  })

  visitor.visit(program)

  return result
}

function isTranslationFunction(node: any): boolean {
  if (node.callee.type === "Identifier") return TRANSLATION_FUNCTIONS.has(node.callee.name)

  if (node.callee.type === "MemberExpression" && node.callee.property.type === "Identifier") {
    return TRANSLATION_FUNCTIONS.has(node.callee.property.name)
  }

  return false
}

function extractKey(arg: Argument, offset: number): SourceKey[] {
  if (arg.type === "ConditionalExpression") {
    return [...extractKey(arg.consequent, offset), ...extractKey(arg.alternate, offset)]
  }

  const collectedParts = collect(arg)

  const normalizedParts = collectedParts.reduce<DynamicKey>((acc, curr) => {
    const last = acc[acc.length - 1]

    if (typeof last === "string" && typeof curr === "string") acc[acc.length - 1] = last + curr
    else if (last !== curr) acc.push(curr)

    return acc
  }, [])

  if (normalizedParts.length === 0) return []
  if (normalizedParts.every((p) => typeof p !== "string")) return []

  const start = offset + arg.start
  const end = offset + arg.end

  if (normalizedParts.length === 1 && typeof normalizedParts[0] === "string") {
    return [{ key: normalizedParts[0], start: start + 1, end: end - 1 }]
  }

  return [{ key: normalizedParts, start, end }]
}

function collect(arg: Argument): DynamicKey {
  if (
    arg.type === "Literal" &&
    (typeof arg.value === "string" || typeof arg.value === "number" || typeof arg.value === "boolean")
  ) {
    return [String(arg.value)]
  }

  if (arg.type === "TemplateLiteral") {
    const parts: DynamicKey = []

    for (let i = 0; i < arg.quasis.length; i++) {
      const quasi = arg.quasis[i]!
      const expression = arg.expressions[i]!

      if (!quasi.tail && quasi.value.cooked) parts.push(quasi.value.cooked)
      if (expression) parts.push(...collect(expression))
      if (quasi.tail && quasi.value.cooked) parts.push(quasi.value.cooked)
    }

    return parts
  }

  if (arg.type === "BinaryExpression" && arg.operator === "+") {
    return [...collect(arg.left), ...collect(arg.right)]
  }

  return [DYNAMIC_PART]
}
