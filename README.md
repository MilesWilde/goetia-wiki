# Goetia Wiki

Read the wiki at **[mileswilde.github.io/goetia-wiki](https://mileswilde.github.io/goetia-wiki/)**.

A linked reference to the 72 spirits, named figures, ritual sections, history, and illustrations in the Mathers–Crowley *Goetia*. Notes distinguish the supplied edition from later commentary and contextual sources, and cite the PDF by viewer page.

The wiki is built with [Quartz](https://quartz.jzhao.xyz/) and published through GitHub Pages. Search, backlinks, graph views, hover previews, and light/dark themes work in the browser. Fonts use the reader's installed system fonts; analytics are disabled.

## Read and edit

Open `content/` as an Obsidian vault, or edit the Markdown files with any text editor. `index.md` is the homepage. Use canonical note names in `[[wikilinks]]`, and preserve source citations, alternate spellings, and image credits.

Illustrations and their provenance manifests live in `content/Attachments/`. The cited edition is `content/sources/ac_goetia.pdf`; citation fragments such as `#page=29` refer to PDF viewer pages.

## Build

Use Node.js 24 or later and npm 10.9.2 or later:

```sh
npm ci
npm run build
python3 scripts/check_site.py public
```

For a local preview:

```sh
npm run preview
```

Push changes to `main` to run the GitHub Pages workflow. It builds the site, checks local links, and publishes only the generated `public/` directory. The workflow derives the site address from GitHub Pages settings.

## Sources and credits

Read the wiki's **Goetia Source Guide** for the edition, evidence boundaries, and citation conventions. Image credits and source links appear with the illustrations and in the two provenance manifests.

The Quartz engine is distributed under the MIT licence in `LICENSE.txt`. That licence covers the engine; source documents and credited images retain their respective attribution and licence information.
