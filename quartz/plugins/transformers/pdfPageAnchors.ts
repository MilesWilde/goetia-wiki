import type { Root } from "hast"
import { visit } from "unist-util-visit"
import type { QuartzTransformerPlugin } from "../types"

export function restorePdfPageAnchors(tree: Root): void {
  visit(tree, "element", node => {
    const href = node.properties.href
    if (node.tagName === "a" && typeof href === "string") {
      node.properties.href = href.replace(
        /^((?:\.\.\/|\.\/)*sources\/(?:ac_goetia|dictionnaireinfernal)\.pdf)#page([1-9][0-9]*)$/,
        "$1#page=$2",
      )
    }
  })
}

export const PdfPageAnchors: QuartzTransformerPlugin = () => ({
  name: "PdfPageAnchors",
  htmlPlugins: () => [() => restorePdfPageAnchors],
})
