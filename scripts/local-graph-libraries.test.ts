import assert from "node:assert/strict"
import test from "node:test"
import { localGraphLibraries } from "../quartz/util/localGraphLibraries"

test("graph scripts load pinned libraries from the site's own base path", () => {
  const script = 'load("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js");load("https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.js")'
  const urls: string[] = []
  const localized = localGraphLibraries(script)
  const execute = new Function("document", "load", localized)
  execute({body:{dataset:{basepath:"/goetia-wiki"}}}, (url: string) => urls.push(url))
  assert.deepEqual(urls, ["/goetia-wiki/static/vendor/d3.min.js", "/goetia-wiki/static/vendor/pixi.min.js"])
  urls.length = 0
  execute({body:{dataset:{basepath:""}}}, (url: string) => urls.push(url))
  assert.deepEqual(urls, ["/static/vendor/d3.min.js", "/static/vendor/pixi.min.js"])
})
