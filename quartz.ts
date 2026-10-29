import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PdfPageAnchors } from "./quartz/plugins/transformers/pdfPageAnchors"
import { EntityIndexPortraits } from "./quartz/plugins/transformers/entityIndexPortraits"
import CollectionNavigation from "./quartz/components/CollectionNavigation"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"

const config = await loadQuartzConfig()
config.plugins.transformers.push(PdfPageAnchors())
config.plugins.transformers.push(EntityIndexPortraits())
const publicationUrl = process.env.GOETIA_BASE_URL
if (publicationUrl) {
  config.configuration.baseUrl = publicationUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
}
export default config
export const layout = await loadQuartzLayout()
const collectionNavigation = CollectionNavigation()
for (const pageLayout of [layout.defaults, ...Object.values(layout.byPageType ?? {})]) {
  const left = pageLayout.left
  if (!left?.length || left.includes(collectionNavigation)) continue
  const explorer = left.findIndex((component) => component.name === "ExplorerComponent")
  left.splice(explorer < 0 ? left.length : explorer, 0, collectionNavigation)
}
// The YAML loader constructs its dispatcher before these layout additions.
// Give that same emitter the completed layout used by this site.
const dispatcher = config.plugins.emitters.findIndex((emitter) => emitter.name === "PageTypeDispatcher")
if (dispatcher < 0) throw new Error("The site requires the page type dispatcher")
config.plugins.emitters[dispatcher] = PageTypeDispatcher(layout)
