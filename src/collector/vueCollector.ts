import {
  type AttributeNode,
  type DirectiveNode,
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
    case NodeTypes.ELEMENT:
      return [...node.children.flatMap(walkVueNode), ...node.props.flatMap(walkVueNode)]

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

function collectFromExpression(node: SimpleExpressionNode) {
  const content = node.content.trim()
  if (!content) return []

  const { program } = parseSync("", content)

  return collectJsKeys(program, node.loc.start.offset)
}
