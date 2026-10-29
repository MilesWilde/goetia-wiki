import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PdfPageAnchors } from "./quartz/plugins/transformers/pdfPageAnchors"

const config = await loadQuartzConfig()
config.plugins.transformers.push(PdfPageAnchors())
const publicationUrl = process.env.GOETIA_BASE_URL
if (publicationUrl) {
  config.configuration.baseUrl = publicationUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
}
export default config
export const layout = await loadQuartzLayout()
