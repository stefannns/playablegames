# /// script
# requires-python = ">=3.10"
# ///
"""Mirror the Flora playable library games into the For You feed.

[INPUT]: https://flora-playable-library.netlify.app (data.json, previews/version-history.json, each game's files).
[OUTPUT]: public/resource/playable-library/<id>/ — the game's files as published, its entry page with
          the feed adapter (/resource/playable-feed/pocket-host.js) injected first, plus a stable
          <id>/index.html that forwards to the entry; catalog.json lists what was mirrored.
[POS]: scripts/playable-library vendoring tool. The folder is git-ignored and deploys with the site as-is
       (the CDN pipeline skips it: games load their media by relative path). Re-run to refresh: files download
       in parallel into a staging folder that replaces the live one only when complete, so the feed keeps
       working mid-refresh.
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import json
import re
import shutil
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SITE = "https://flora-playable-library.netlify.app"
REPO_ROOT = Path(__file__).resolve().parents[2]
OUT = REPO_ROOT / "public" / "resource" / "playable-library"
# Outside public/ (not served, not uploaded) but on the same volume, so the final swap is a rename.
STAGING = REPO_ROOT / "node_modules" / ".cache" / "playable-library.staging"
POOL = ThreadPoolExecutor(max_workers=12)
ADAPTER = '<script src="/resource/playable-feed/pocket-host.js" data-seed-random="off"></script>'
ASSET_RE = re.compile(
    r"""["'`(]\s*(\.{0,2}/?(?:[\w@.-]+/)*[\w@.-]+\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg|m4a|aac|mp4|webm|woff2?|ttf|otf|json|glb|gltf|bin|css|js|wasm|txt))(?:\?[^"'`)]*)?\s*["'`)]""",
    re.I,
)


def fetch(path: str) -> bytes:
    with urllib.request.urlopen(SITE + path, timeout=30) as response:
        return response.read()


def default_entry(history: dict, game_id: str) -> tuple[str, str | None]:
    """The library's default (newest reviewed) version, else the batch build."""
    game = history.get(game_id, {})
    for version in game.get("versions", []):
        if game.get("default_version") in (version.get("id"), version.get("formal_version")):
            return version["entry"], version.get("manifest")
    return f"/previews/batch01/{game_id}-working/game.html", None


def try_fetch(path: str) -> bytes | None:
    try:
        return fetch(path)
    except Exception:
        return None


def crawl(base: str, entry_rel: str) -> dict[str, bytes]:
    """No manifest: follow relative references out of the html/js/css/json files."""
    files: dict[str, bytes] = {}
    queue, seen = [entry_rel], set()
    while queue:
        rel = queue.pop()
        if rel in seen:
            continue
        seen.add(rel)
        try:
            body = fetch(base + rel)
        except Exception:  # download filenames, dev-only paths and other false positives
            continue
        files[rel] = body
        if rel.rsplit(".", 1)[-1].lower() in ("html", "js", "css", "json"):
            for ref in ASSET_RE.findall(body.decode("utf-8", "ignore")):
                if ref.startswith(("http", "//", "/")):
                    continue
                nxt = urllib.parse.urljoin("x/" + rel, ref)[2:]
                if not nxt.startswith("../") and nxt not in seen:
                    queue.append(nxt)
    return files


def inject_adapter(html: str) -> str:
    match = re.search(r"<head[^>]*>", html, re.I)
    at = match.end() if match else 0
    return html[:at] + ADAPTER + html[at:]


def main() -> int:
    data = json.loads(fetch("/data.json"))
    history = json.loads(fetch("/previews/version-history.json"))["games"]
    if STAGING.exists():
        shutil.rmtree(STAGING)
    STAGING.parent.mkdir(parents=True, exist_ok=True)
    catalog = []
    for record in data["records"]:
        game_id = record["id"]
        entry, manifest = default_entry(history, game_id)
        if manifest:
            base = manifest.rsplit("/", 1)[0] + "/"
            entry_rel = entry[len(base):]
            rels = sorted({*(item["path"] for item in json.loads(fetch(manifest))["files"]), entry_rel})
            bodies = POOL.map(lambda rel: try_fetch(base + rel), rels)
            # Manifests also list build sources that aren't published; those come back None.
            files = {rel: body for rel, body in zip(rels, bodies) if body is not None}
        else:
            base = entry.rsplit("/", 1)[0] + "/"
            entry_rel = entry[len(base):]
            files = crawl(base, entry_rel)
        files[entry_rel] = inject_adapter(files[entry_rel].decode("utf-8")).encode("utf-8")
        for rel, body in files.items():
            target = STAGING / game_id / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
        # Stable entry for the app: the library moves entries between versions.
        (STAGING / game_id / "index.html").write_text(
            f'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={entry_rel}">'
            f'<script>location.replace({json.dumps(entry_rel)} + location.hash)</script>',
            encoding="utf-8",
        )
        size = sum(len(body) for body in files.values())
        catalog.append({"id": game_id, "name": record["name"], "category": record["category"], "entry": entry_rel, "source": SITE + entry, "bytes": size})
        print(f"{game_id:4} {len(files):4} files {size / 1e6:6.2f} MB  {record['name']}", flush=True)
    (STAGING / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1), encoding="utf-8")
    # Swap only once everything downloaded: the live folder never sits half-empty.
    retired = STAGING.with_name("playable-library.old")
    if retired.exists():
        shutil.rmtree(retired)
    if OUT.exists():
        OUT.rename(retired)
    STAGING.rename(OUT)
    if retired.exists():
        shutil.rmtree(retired)
    print(f"{len(catalog)} games, {sum(item['bytes'] for item in catalog) / 1e6:.1f} MB -> {OUT.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
