"""Check local links and anchors in a generated static website."""

import argparse
import re
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


@dataclass(frozen=True)
class Reference:
    url: str
    line: int


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.anchors = set()
        self.references = []
        self.feed(text)
        self.close()

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if attributes.get("id"):
            self.anchors.add(attributes["id"])
        if tag == "a" and attributes.get("name"):
            self.anchors.add(attributes["name"])
        for attribute in ("href", "src"):
            if attributes.get(attribute) is not None:
                self.references.append(Reference(attributes[attribute], self.getpos()[0]))
        if tag == "meta" and attributes.get("http-equiv", "").lower() == "refresh":
            match = re.search(r"(?:^|;)\s*url\s*=\s*(.*)", attributes.get("content", ""), re.I)
            if match:
                target = match.group(1).strip().strip("\"'")
                self.references.append(Reference(target, self.getpos()[0]))


def resolve_reference(root, source, url, base_path):
    """Return a target and fragment, or None for an external reference."""
    parsed = urlsplit(url.strip())
    if parsed.scheme in {"http", "https", "mailto", "tel", "data"}:
        return None
    if parsed.scheme:
        raise ValueError("local or unsupported URL scheme")
    if parsed.netloc:
        return None
    path = unquote(parsed.path)
    if "\\" in path or "\0" in path:
        raise ValueError("invalid local URL path")
    components = path.split("/")
    if any(part.startswith(".") and part not in {".", "..", ".well-known"} for part in components):
        raise ValueError("link to private configuration")
    if path.startswith("/"):
        if base_path:
            if path == base_path:
                path = "/"
            elif path.startswith(base_path + "/"):
                path = path[len(base_path):]
            else:
                raise ValueError("root URL is outside the configured site base")
        target = root / path.lstrip("/")
    elif path:
        target = source.parent / path
    else:
        target = source
    target = target.resolve()
    if not target.is_relative_to(root):
        raise ValueError("local URL escapes the published site")
    candidates = [target]
    if target != root:
        candidates.append(Path(str(target) + ".html"))
    candidates.append(target / "index.html")
    for candidate in candidates:
        candidate = candidate.resolve()
        if not candidate.is_relative_to(root):
            raise ValueError("linked file escapes the published site")
        if candidate.is_file():
            fragment = unquote(parsed.fragment).split(":~:", 1)[0]
            return candidate, fragment
    raise ValueError("missing local target")


def check_site(root, base_path):
    root = root.resolve()
    documents = {}
    errors = []
    checked = 0
    for path in sorted(root.rglob("*")):
        if path.suffix.lower() not in {".html", ".htm"} or not path.is_file():
            continue
        if not path.resolve().is_relative_to(root):
            errors.append(f"{path.relative_to(root)}: HTML file escapes the published site")
            continue
        try:
            documents[path.resolve()] = Document(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ValueError) as error:
            errors.append(f"{path.relative_to(root)}: cannot read HTML: {error}")
    if not documents:
        errors.append("No HTML files found; build the site before checking it.")
    for source, document in documents.items():
        for reference in document.references:
            try:
                resolved = resolve_reference(root, source, reference.url, base_path)
                if resolved is None:
                    continue
                checked += 1
                target, fragment = resolved
                if target.suffix.lower() == ".pdf" and fragment.lower().startswith("page"):
                    if not re.fullmatch(r"page=[1-9][0-9]*(?:&.*)?", fragment):
                        raise ValueError("invalid PDF page fragment; expected #page=N with a positive page")
                if fragment and target in documents:
                    if fragment not in documents[target].anchors and fragment.lower() != "top":
                        raise ValueError(f"missing HTML anchor #{fragment}")
            except (ValueError, OSError) as error:
                errors.append(f"{source.relative_to(root)}:{reference.line}: {reference.url!r}: {error}")
    return len(documents), checked, errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", nargs="?", type=Path, default=Path("public"))
    parser.add_argument("--base-path", default="/goetia-wiki", help="Published URL prefix; use / for root hosting")
    arguments = parser.parse_args()
    base_path = "/" + arguments.base_path.strip("/") if arguments.base_path.strip("/") else ""
    pages, links, errors = check_site(arguments.directory, base_path)
    print(f"Checked {pages} HTML files and {links} local links: {len(errors)} errors.")
    for error in errors[:40]:
        print(error)
    if len(errors) > 40:
        print(f"... {len(errors) - 40} additional errors.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
