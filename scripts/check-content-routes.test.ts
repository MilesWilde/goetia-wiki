import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkContentRoutes } from "./check-content-routes";

async function fixture(
  files: Record<string, string>,
  run: (root: string) => Promise<void>,
) {
  const root = await mkdtemp(path.join(tmpdir(), "quartz-routes-"));
  try {
    for (const [name, text] of Object.entries(files)) {
      const target = path.join(root, name);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, text);
    }
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const note = (aliases: string[]) =>
  `---\naliases: ${JSON.stringify(aliases)}\n---\n# Entry\n`;

test("the seven historical shared aliases collide at the site root until qualified", async () => {
  const names = [
    "amaimon",
    "michaël",
    "asmodai",
    "beal",
    "botis",
    "furcas",
    "gaap",
  ];
  const files: Record<string, string> = {};
  for (const name of names) {
    files[`Goetia/${name}.md`] = note([name]);
    files[`Infernal Dictionary/${name}.md`] = note([name]);
  }
  await fixture(files, async (root) => {
    const result = await checkContentRoutes(root);
    assert.deepEqual(
      result.collisions.map((collision) => collision.route).sort(),
      [...names].sort(),
    );
    assert.ok(
      result.collisions.every((collision) => collision.owners.length === 2),
    );
    for (const name of names) {
      await writeFile(
        path.join(root, `Infernal Dictionary/${name}.md`),
        note([`${name} (Dictionnaire Infernal)`]),
      );
    }
    assert.deepEqual((await checkContentRoutes(root)).collisions, []);
  });
});

test("an alias cannot overwrite another source note's canonical route", async () => {
  await fixture(
    {
      "Names/Shared Name.md": "# Original",
      "Other/Note.md": note(["/Names/Shared Name.md"]),
    },
    async (root) => {
      const result = await checkContentRoutes(root);
      assert.equal(result.collisions[0]?.route, "names/shared-name");
      assert.deepEqual(
        result.collisions[0]?.owners.map((owner) => owner.source).sort(),
        ["Names/Shared Name.md", "Other/Note.md"],
      );
    },
  );
});

test("canonical and repeated self aliases belong to the same source", async () => {
  await fixture(
    { "Profile.md": note(["Profile", "profile.md", "PROFILE", "Profile"]) },
    async (root) => {
      assert.deepEqual((await checkContentRoutes(root)).collisions, []);
    },
  );
});

test("folder index aliases use Quartz's _index and repeated-folder conventions", async () => {
  await fixture(
    { "Folder/_index.md": "# Index", "Other.md": note(["Folder/Folder"]) },
    async (root) => {
      assert.equal(
        (await checkContentRoutes(root)).collisions[0]?.route,
        "folder/",
      );
    },
  );
});

test("relative aliases resolve from the same simplified source path as the emitter", async () => {
  await fixture(
    { "Folder/Index.md": note(["./Sibling"]), "Sibling.md": "# Root sibling" },
    async (root) => {
      assert.equal(
        (await checkContentRoutes(root)).collisions[0]?.route,
        "sibling",
      );
    },
  );
});

test("singular alias and comma-separated scalar values follow NoteProperties coercion", async () => {
  await fixture(
    {
      "One.md": "---\nalias: first, second\n---\n",
      "Two.md": note(["second"]),
    },
    async (root) => {
      assert.equal(
        (await checkContentRoutes(root)).collisions[0]?.route,
        "second",
      );
    },
  );
});

test("permalinks participate in the same emitted alias namespace", async () => {
  await fixture(
    { "One.md": "---\npermalink: shared\n---\n", "Two.md": note(["shared"]) },
    async (root) => {
      assert.equal(
        (await checkContentRoutes(root)).collisions[0]?.route,
        "shared",
      );
    },
  );
});

test("only leading YAML frontmatter supplies aliases and non-note assets are ignored", async () => {
  await fixture(
    {
      "One.md": "# Text\n---\naliases: [Shared]\n---\n",
      "Two.md": note(["Shared"]),
      "Asset.txt": note(["Shared"]),
    },
    async (root) => {
      const result = await checkContentRoutes(root);
      assert.equal(result.notes, 2);
      assert.deepEqual(result.collisions, []);
    },
  );
});

test("malformed YAML fails with the responsible note path", async () => {
  await fixture(
    { "Broken.md": "---\naliases: [unclosed\n---\n" },
    async (root) => {
      await assert.rejects(checkContentRoutes(root), /Broken\.md/);
    },
  );
});
