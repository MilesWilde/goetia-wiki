"""Exercise the published-site checker against small real sites."""

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


CHECKER = Path(__file__).with_name("check_site.py")


class SiteChecks(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.site = Path(self.temporary.name) / "public"
        self.site.mkdir()

    def write(self, relative, content):
        path = self.site / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def run_checker(self, *arguments):
        return subprocess.run(
            [sys.executable, str(CHECKER), str(self.site), *arguments],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_links_assets_unicode_and_pdf_pages(self):
        self.write("index.html", """
            <a href="notes/G%C3%A4ap#appearance">Spirit</a>
            <a href="/goetia-wiki/notes/">Notes</a>
            <a href="source.pdf#page=27">Citation</a>
            <img src="art/seal.png?version=1">
            <a href="https://example.org/missing">External</a>
            <a href="mailto:reader@example.org">Email</a>
            <img src="data:image/svg+xml;base64,PHN2Zz4=">
        """)
        self.write("notes/Gäap.html", '<h2 id="appearance">Appearance</h2>')
        self.write("notes/index.html", '<a href="../">Home</a>')
        self.write("source.pdf", "PDF fixture")
        self.write("art/seal.png", "Image fixture")
        result = self.run_checker()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("3 HTML files", result.stdout)
        self.assertIn("0 errors", result.stdout)

    def test_reports_missing_assets_and_html_anchors(self):
        self.write("index.html", """
            <a href="missing">Missing page</a>
            <img src="missing.png">
            <a href="known#absent">Missing anchor</a>
            <a href="missing.pdf#page=1">Missing PDF</a>
        """)
        self.write("known.html", '<h1 id="present">Known</h1>')
        result = self.run_checker()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("4 errors", result.stdout)
        self.assertIn("missing.png", result.stdout)
        self.assertIn("#absent", result.stdout)
        self.assertIn("missing.pdf", result.stdout)

    def test_checks_alias_meta_refresh_targets(self):
        self.write("index.html", '<a href="alias">Alias</a>')
        self.write("alias.html", """
            <meta http-equiv="Refresh" content="0; URL='./notes/Target#details'">
        """)
        self.write("notes/Target.html", '<h2 id="details">Details</h2>')
        good = self.run_checker()
        self.assertEqual(good.returncode, 0, good.stdout + good.stderr)
        self.write("alias.html", '<meta http-equiv="refresh" content="0; url=missing">')
        bad = self.run_checker()
        self.assertEqual(bad.returncode, 1, bad.stdout + bad.stderr)
        self.assertIn("alias.html", bad.stdout)
        self.assertIn("missing", bad.stdout)

    def test_rejects_malformed_pdf_page_fragments(self):
        self.write("index.html", """
            <a href="source.pdf#page27">Missing equals sign</a>
            <a href="source.pdf#page=0">Zero page</a>
            <a href="source.pdf#page=-1">Negative page</a>
            <a href="source.pdf#page=first">Nonnumeric page</a>
            <a href="source.pdf#page=27">Valid page</a>
            <a href="source.pdf#page=27&amp;zoom=100">Valid view options</a>
            <a href="source.pdf#nameddest=introduction">Named destination</a>
        """)
        self.write("source.pdf", "PDF fixture")
        result = self.run_checker()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("4 errors", result.stdout)
        self.assertIn("page27", result.stdout)
        self.assertIn("invalid PDF page fragment", result.stdout)

    def test_rejects_local_files_escapes_and_private_configuration(self):
        self.write("index.html", """
            <a href="file:///tmp/personal.txt">Local</a>
            <a href="../outside.html">Escaped</a>
            <a href="%2e%2e/outside.html">Encoded escape</a>
            <a href=".git/config">Private configuration</a>
            <a href="/unrelated/">Outside project site</a>
        """)
        (self.site.parent / "outside.html").write_text("Outside", encoding="utf-8")
        self.write(".git/config", "configuration")
        result = self.run_checker()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("5 errors", result.stdout)
        self.assertIn("file:", result.stdout)
        self.assertIn(".git/config", result.stdout)

    def test_accepts_same_page_anchors_and_root_hosting(self):
        self.write("index.html", """
            <h1 id="gr%C3%A6co">Encoded identifier</h1>
            <h2 id="ranks">Ranks</h2>
            <a name="legacy"></a>
            <a href="#ranks">Ranks</a>
            <a href="#legacy">Legacy anchor</a>
            <a href="#top">Top</a>
            <a href="/">Home</a>
            <a href="?search=rank#ranks">Query</a>
            <a href="#:~:text=Ranks">Text fragment</a>
        """)
        result = self.run_checker("--base-path", "/")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_reports_empty_build(self):
        result = self.run_checker()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("No HTML files", result.stdout)


if __name__ == "__main__":
    unittest.main()
