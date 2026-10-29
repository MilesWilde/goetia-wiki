# Goetia & Infernal Dictionary

Read the wiki at **[mileswilde.github.io/goetia-wiki](https://mileswilde.github.io/goetia-wiki/)**.

A shared English reference to the 72 spirits, named figures, ritual sections, history, and illustrations in the Mathers–Crowley *Goetia*, and 697 demons and named supernatural beings in Collin de Plancy's 1863 *Dictionnaire infernal*. A common directory and 89 reviewed reciprocal comparisons connect the collections. Each account retains its own source citations and differences.

The wiki is built with [Quartz](https://quartz.jzhao.xyz/) and published through GitHub Pages. One search index, backlinks, graph views, hover previews, and light/dark themes work across both books. Fonts use the reader's installed system fonts; analytics are disabled.

## Read and edit

Open `content/` as an Obsidian vault, or edit the Markdown files with any text editor. `index.md` is the homepage. Use canonical note names in `[[wikilinks]]`, and preserve source citations, alternate spellings, and image credits.

Existing Goetia notes and URLs retain their locations. The English dictionary notes live in `content/Infernal Dictionary/`. `Entity Directory.md` and `Source Comparisons.md` connect both collections with internal wikilinks.

Illustrations and provenance manifests live in each collection's `Attachments/` folder. The original scans are `content/sources/ac_goetia.pdf` (98 pages) and `content/sources/dictionnaireinfernal.pdf` (739 pages). Citation fragments such as `#page=29` refer to PDF viewer pages. The dictionary's missing printed pages 213–214 are separately supplied and credited to the Library of Congress / Internet Archive scan.

## Build

Use Node.js 24 or later and npm 10.9.2 or later:

```sh
npm ci
node --import tsx scripts/check-content-routes.ts
npm run build
python3 scripts/check_site.py public
```

For a local preview:

```sh
npm run preview
```

Push changes to `main` to run the GitHub Pages workflow. It builds the site, checks local links, and publishes only the generated `public/` directory. The workflow derives the site address from GitHub Pages settings.

## Sources and credits

Read the wiki's **Goetia Source Guide** and **Infernal Source Guide** for editions, evidence boundaries, naming and citation conventions. Dictionary profiles are English summaries, with original headwords retained as aliases and source evidence. They describe the historical author's accounts and classifications. This is a curated reference, not a translation of every dictionary article.

Image credits and source links appear with the illustrations and in their provenance manifests. The dictionary includes 56 reviewed portrait crops from the BnF/Gallica scan, preserving its original linework and attribution; its title page advertises 72 demon portraits among 550 engravings, which does not define the same roster as the Goetia's 72 spirits.

The Quartz engine is distributed under the MIT licence in `LICENSE.txt`. That licence covers the engine; source documents and credited images retain their respective attribution and licence information.
