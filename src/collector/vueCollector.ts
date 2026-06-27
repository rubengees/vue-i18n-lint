import {
  type AttributeNode,
  type DirectiveNode,
  type ElementNode,
  type ExpressionNode,
  NodeTypes,
  type RootNode,
  type SimpleExpressionNode,
  type TemplateChildNode,
} from "@vue/compiler-core"
import type { Expression } from "oxc-parser"
import { parseScript } from "../parser/scriptParser.ts"
import type { SourceKey } from "../types.ts"
import { collectJsKeys } from "./jsCollector.ts"
import { TRANSLATION_CALL_REGEX } from "./translationFunctions.ts"

type WalkableNode = TemplateChildNode | AttributeNode | DirectiveNode | ExpressionNode

export type VueCollectorOptions = {
  fileSource?: string | undefined
}

export function collectVueKeys(file: string, templateAst: RootNode, options?: VueCollectorOptions): SourceKey[] {
  return templateAst.children.flatMap((c) => walkVueNode(file, c, options))
}

function walkVueNode(file: string, node: WalkableNode, options?: VueCollectorOptions): SourceKey[] {
  switch (node.type) {
    case NodeTypes.ELEMENT: {
      return [
        ...node.children.flatMap((c) => walkVueNode(file, c, options)),
        ...node.props.flatMap((c) => walkVueNode(file, c, options)),
        ...collectFromElementNode(node),
      ]
    }

    case NodeTypes.INTERPOLATION:
      return walkVueNode(file, node.content, options)

    case NodeTypes.DIRECTIVE: {
      if (node.name === "t") return collectFromDirective(file, node, options)

      return node.exp ? walkVueNode(file, node.exp, options) : []
    }

    case NodeTypes.SIMPLE_EXPRESSION:
      return node.isStatic ? [] : collectFromExpression(file, node, options)

    default:
      return []
  }
}

function collectFromElementNode(node: ElementNode): SourceKey[] {
  if (node.tag === "i18n-t") {
    for (const prop of node.props) {
      if (
        prop.type === NodeTypes.ATTRIBUTE &&
        (prop.name === "keypath" || prop.name === "path") &&
        prop.value?.content
      ) {
        return [
          {
            key: prop.value.content,
            start: prop.value.loc.start.offset + 1,
            end: prop.value.loc.end.offset - 1,
          },
        ]
      }
    }
  }

  return []
}

function collectFromDirective(file: string, node: DirectiveNode, options?: VueCollectorOptions): SourceKey[] {
  if (!node.exp || node.exp.type !== NodeTypes.SIMPLE_EXPRESSION) return []

  const rawContent = node.exp.content
  const content = rawContent.trim()
  if (!content) return []

  const trimStart = rawContent.length - rawContent.trimStart().length
  const adjustedOffset = node.exp.loc.start.offset - 1 + trimStart

  const program = parseScript(file, content, {
    wrapInParens: true,
    offset: adjustedOffset,
    fileSource: options?.fileSource,
  })

  const bodyPart = program.body[0]
  if (!bodyPart || bodyPart.type !== "ExpressionStatement") return []

  return walkDirective(bodyPart.expression, adjustedOffset)
}

function walkDirective(expression: Expression, offset: number): SourceKey[] {
  if (expression.type === "ParenthesizedExpression") return walkDirective(expression.expression, offset)

  if (expression.type === "Literal" && typeof expression.value === "string") {
    return [
      {
        key: expression.value,
        start: expression.start + offset + 1,
        end: expression.end + offset - 1,
      },
    ]
  }

  if (expression.type === "ObjectExpression") {
    for (const prop of expression.properties) {
      if (
        prop.type === "Property" &&
        prop.key.type === "Identifier" &&
        prop.key.name === "path" &&
        prop.value.type === "Literal" &&
        typeof prop.value.value === "string"
      ) {
        return [
          {
            key: prop.value.value,
            start: prop.value.start + offset + 1,
            end: prop.value.end + offset - 1,
          },
        ]
      }
    }
  }

  return []
}

function collectFromExpression(file: string, node: SimpleExpressionNode, options?: VueCollectorOptions) {
  const content = node.content
  if (!content.trim()) return []
  if (!TRANSLATION_CALL_REGEX.test(content)) return []

  const program = parseScript(file, content, {
    wrapInParens: true,
    offset: node.loc.start.offset - 1,
    fileSource: options?.fileSource,
  })

  return collectJsKeys(program, node.loc.start.offset - 1)
}
