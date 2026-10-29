import assert from "node:assert/strict"
import test from "node:test"
import type { Root } from "hast"
import { restorePdfPageAnchors } from "../quartz/plugins/transformers/pdfPageAnchors"

test("source PDF citations open the requested viewer page after Markdown rendering", () => {
  const hrefs = [
    "../sources/ac_goetia.pdf#page27",
    "./sources/ac_goetia.pdf#page98",
    "../../sources/dictionnaireinfernal.pdf#page739",
    "../sources/ac_goetia.pdf#page=29",
    "../sources/ac_goetia.pdf#editorial-notes",
    "https://example.com/sources/ac_goetia.pdf#page27",
    "./other.pdf#page27",
    "./notes#page27",
  ]
  const tree: Root = {type: "root", children: hrefs.map(href => ({
    type: "element", tagName: "a", properties: {href}, children: [],
  }))}
  restorePdfPageAnchors(tree)
  assert.deepEqual(tree.children.map(node => node.type === "element" && node.properties.href), [
    "../sources/ac_goetia.pdf#page=27",
    "./sources/ac_goetia.pdf#page=98",
    "../../sources/dictionnaireinfernal.pdf#page=739",
    ...hrefs.slice(3),
  ])
})
