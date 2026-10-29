export function localGraphLibraries(script: string): string {
  return script
    .replaceAll(
      '"https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"',
      '((document.body.dataset.basepath || "") + "/static/vendor/d3.min.js")',
    )
    .replaceAll(
      '"https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.js"',
      '((document.body.dataset.basepath || "") + "/static/vendor/pixi.min.js")',
    )
}
