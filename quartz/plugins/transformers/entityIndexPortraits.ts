import type { Element, Root } from "hast"
import { visit } from "unist-util-visit"
import type { QuartzTransformerPlugin } from "../types"

/** Make each index thumbnail part of its adjacent profile link. */
export const EntityIndexPortraits: QuartzTransformerPlugin = () => ({
  name: "EntityIndexPortraits",
  htmlPlugins: () => [() => (tree: Root, file) => {
    if (file.data.frontmatter?.portrait_index !== true) return
    visit(tree, "element", (node) => {
      if (node.tagName !== "li") return
      const container = node.children.find((child): child is Element =>
        child.type === "element" && child.tagName === "p") ?? node
      const picture = container.children.find((child): child is Element =>
        child.type === "element" && child.tagName === "img")
      const link = container.children.find((child): child is Element =>
        child.type === "element" && child.tagName === "a")
      if (!picture || !link) return
      let name = ""
      visit(link, "text", (text) => { name += text.value })
      picture.properties = {
        ...picture.properties,
        className: ["entity-portrait-thumbnail"],
        alt: "",
        width: 36,
        height: 36,
        loading: "lazy",
        decoding: "async",
      }
      container.children = container.children.filter((child) => child !== picture)
      link.children.unshift(picture, { type: "text", value: " " })
      const classes = link.properties.className
      link.properties.className = [...(Array.isArray(classes) ? classes : typeof classes === "string" ? classes.split(/\s+/) : []), "illustrated-profile"]
      link.properties.ariaLabel = `${name} — illustrated profile`
      link.properties.title = "Profile includes an illustration"
    })
  }],
})
