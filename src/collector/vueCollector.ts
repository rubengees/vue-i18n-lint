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

    case NodeTypes.DIRECTIVE:
      return node.exp ? walkVueNode(file, node.exp, options) : []

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
