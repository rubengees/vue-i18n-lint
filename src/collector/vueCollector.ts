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
import { parseSync } from "oxc-parser"
import type { SourceKey } from "../types.ts"
import { collectJsKeys } from "./jsCollector.ts"

type WalkableNode = TemplateChildNode | AttributeNode | DirectiveNode | ExpressionNode

export function collectVueKeys(templateAst: RootNode): SourceKey[] {
  return templateAst.children.flatMap(walkVueNode)
}

function walkVueNode(node: WalkableNode): SourceKey[] {
  switch (node.type) {
    case NodeTypes.ELEMENT: {
      return [
        ...node.children.flatMap(walkVueNode),
        ...node.props.flatMap(walkVueNode),
        ...collectFromElementNode(node),
      ]
    }

    case NodeTypes.INTERPOLATION:
      return walkVueNode(node.content)

    case NodeTypes.DIRECTIVE:
      return node.exp ? walkVueNode(node.exp) : []

    case NodeTypes.SIMPLE_EXPRESSION:
      return node.isStatic ? [] : collectFromExpression(node)

    default:
      return []
  }
}

function collectFromElementNode(node: ElementNode): SourceKey[] {
  if (node.tag === "i18n-t") {
    for (const prop of node.props) {
      if (prop.type === NodeTypes.ATTRIBUTE && prop.name === "keypath" && prop.value?.content) {
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

function collectFromExpression(node: SimpleExpressionNode) {
  const content = node.content
  if (!content.trim()) return []

  const { program } = parseSync("", content)

  return collectJsKeys(program, node.loc.start.offset)
}
