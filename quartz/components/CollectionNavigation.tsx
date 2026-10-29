import { resolveRelative } from "@quartz-community/utils";
import type { FullSlug } from "@quartz-community/types";
import type { QuartzComponent, QuartzComponentConstructor } from "./types";

const indexes = [
  { label: "Goetia index", slug: "goetia-entity-index" },
  {
    label: "Infernal Dictionary index",
    slug: "infernal-dictionary/infernal-entity-index",
  },
] as const;

export default (() => {
  const CollectionNavigation: QuartzComponent = ({ fileData }) => (
    <nav class="collection-navigation" aria-label="Book indexes">
      {indexes.map(({ label, slug }) => (
        <a
          key={slug}
          class="internal"
          href={resolveRelative(fileData.slug!, slug as FullSlug)}
          aria-current={fileData.slug === slug ? "page" : undefined}
          data-no-popover
        >
          {label}
        </a>
      ))}
    </nav>
  );
  CollectionNavigation.displayName = "CollectionNavigation";
  CollectionNavigation.css = `
.collection-navigation {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex-shrink: 0;
  font-size: 0.95rem;
}
.collection-navigation > a {
  display: block;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.35rem;
  color: var(--secondary);
  font-weight: 600;
  line-height: 1.4;
  text-decoration: none;
}
.collection-navigation > a:hover,
.collection-navigation > a[aria-current="page"] {
  background: var(--highlight);
}
.collection-navigation > a:focus-visible {
  outline: 2px solid var(--secondary);
  outline-offset: 2px;
}
@media all and (max-width: 800px) {
  .page > #quartz-body .sidebar.left:has(.collection-navigation) {
    flex-wrap: wrap;
    row-gap: 0.6rem;
  }
  .collection-navigation {
    order: 2;
    flex: 0 0 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .collection-navigation > a {
    padding: 0.6rem;
  }
}
`;
  return CollectionNavigation;
}) satisfies QuartzComponentConstructor;
