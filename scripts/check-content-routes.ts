import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import {
  getFileExtension,
  isRelativeURL,
  simplifySlug,
  slugifyFilePath,
} from "@quartz-community/utils";
import type { FilePath, FullSlug } from "@quartz-community/types";

type Owner = { source: string; kinds: string[] };
type Collision = { route: string; owners: Owner[] };

async function markdownFiles(
  directory: string,
  prefix = "",
): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(path.join(directory, prefix), {
    withFileTypes: true,
  })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory())
      files.push(...(await markdownFiles(directory, relative)));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative);
  }
  return files.sort();
}

// Match NoteProperties' aliases/alias selection and scalar/list coercion.
function aliases(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value))
    return String(value)
      .split(",")
      .map((item) => item.trim());
  return value
    .filter((item) => typeof item === "string" || typeof item === "number")
    .map(String);
}

export async function checkContentRoutes(directory: string): Promise<{
  notes: number;
  collisions: Collision[];
}> {
  const files = await markdownFiles(directory);
  const routes = new Map<string, Map<string, Owner>>();
  const claim = (slug: string, source: string, kind: string) => {
    // File writes normalize path segments; Quartz simplifies directory indexes
    // while retaining their trailing slash, unlike a sibling folder.html page.
    const route = simplifySlug(
      path.posix.normalize(slug).replace(/^\/+/, "") as FullSlug,
    );
    const owners = routes.get(route) ?? new Map<string, Owner>();
    const owner = owners.get(source) ?? { source, kinds: [] };
    if (!owner.kinds.includes(kind)) owner.kinds.push(kind);
    owners.set(source, owner);
    routes.set(route, owners);
  };

  for (const source of files) {
    const canonical = slugifyFilePath(source as FilePath);
    claim(canonical, source, "canonical");
    const text = (await readFile(path.join(directory, source), "utf8")).replace(
      /^\uFEFF/,
      "",
    );
    const frontmatter = /^---\r?\n([\s\S]*?)^---[\t ]*(?:\r?\n|$)/m.exec(text);
    if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) continue;
    if (!frontmatter) throw new Error(`${source}: unclosed YAML frontmatter`);
    let metadata: Record<string, unknown>;
    try {
      metadata = parse(frontmatter[1]) ?? {};
    } catch (error) {
      throw new Error(`${source}: invalid YAML frontmatter: ${String(error)}`);
    }
    const targets = aliases(metadata.aliases ?? metadata.alias).map(
      (alias) => ({
        slug: slugifyFilePath(
          (getFileExtension(alias) === ".md"
            ? alias
            : `${alias}.md`) as FilePath,
        ),
        kind: `alias ${JSON.stringify(alias)}`,
      }),
    );
    // NoteProperties appends permalinks verbatim to the alias emitter's input.
    if (metadata.permalink != null && String(metadata.permalink) !== "") {
      targets.push({
        slug: String(metadata.permalink) as FullSlug,
        kind: "permalink",
      });
    }
    const original = simplifySlug(canonical);
    for (const target of targets) {
      // Bare aliases are site-root paths, not paths within the note's folder.
      const resolved = isRelativeURL(target.slug)
        ? path.posix.normalize(path.posix.join(original, "..", target.slug))
        : target.slug;
      claim(resolved, source, target.kind);
    }
  }

  const collisions = [...routes.entries()]
    .filter(([, owners]) => owners.size > 1)
    .map(([route, owners]) => ({ route, owners: [...owners.values()] }))
    .sort((a, b) => a.route.localeCompare(b.route));
  return { notes: files.length, collisions };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = await checkContentRoutes(process.argv[2] ?? "content");
    for (const collision of result.collisions) {
      console.error(`Route collision: ${collision.route}`);
      for (const owner of collision.owners) {
        console.error(`  ${owner.source} (${owner.kinds.join(", ")})`);
      }
    }
    if (result.collisions.length) process.exitCode = 1;
    else
      console.log(
        `Content routes valid: ${result.notes} Markdown notes; no collisions.`,
      );
  } catch (error) {
    console.error(String(error));
    process.exitCode = 1;
  }
}
