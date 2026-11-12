# /// script
# requires-python = ">=3.10"
# ///
"""Upload Mini TT public resources to the ByteDance CDN.

[INPUT]: depends on public/resource files, upload_cdn_asset.upload_one, and the pinned CDN base namespace.
[OUTPUT]: writes a CDN audit manifest with relPath, size, sha256, cdnUrl, and uploadedAt; every upload is
          verified to land inside the CDN base's namespace so multi-user uploads stay consistent.
[POS]: scripts/cdn batch uploader for the Mini TT /resource protocol.
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from upload_cdn_asset import MAX_FILE_BYTES, UploadError, upload_one

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RESOURCE_ROOT = REPO_ROOT / "public" / "resource"
DEFAULT_MANIFEST_PATH = Path(__file__).resolve().parent / "minitt-resource-cdn-manifest.json"
DEFAULT_CDN_DIR_PREFIX = "desagent/minitt/v1"
DEFAULT_CDN_BASE = "https://lf3-static.bytednsdoc.com/obj/eden-cn/nuhboeh7uhopg/desagent/minitt/v1"
MEDIA_SUFFIXES = {".gif", ".jpg", ".jpeg", ".mp4", ".png", ".svg", ".webp"}
# Vendored games that load their media by relative path; they ship with the site, never the CDN.
SELF_CONTAINED_DIRS = ("playable-library", "playable-local")


def namespace_root(cdn_base: str) -> str:
    """https://host/obj/<region>/<owner>/ — the namespace every upload must land in."""
    head, tail = cdn_base.split("/obj/", 1)
    region, owner = tail.split("/")[:2]
    return f"{head}/obj/{region}/{owner}/"


def namespace_email(cdn_base: str) -> str:
    """Decode the fast-deliver owner segment back to its email; the repo's CDN base pins the
    upload namespace for EVERY contributor, so builds can rewrite /resource to one single base.
    Case matters: fast-deliver derives DISTINCT spaces from email case variants."""
    owner = cdn_base.split("/obj/", 1)[1].split("/")[1]
    shifted = "".join(
        chr((ord(c) - (65 if c.isupper() else 97) - 7) % 26 + (65 if c.isupper() else 97)) if c.isalpha() else c
        for c in owner
    )
    return shifted[::-1].replace("7ax", ".") + "@bytedance.com"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def posix_rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def iter_media_files(resource_root: Path) -> list[Path]:
    return sorted(
        path
        for path in resource_root.rglob("*")
        if path.is_file() and path.suffix.lower() in MEDIA_SUFFIXES
        and path.relative_to(resource_root).parts[0] not in SELF_CONTAINED_DIRS
    )


def read_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"version": 1, "assets": {}}
    try:
        payload = json.loads(path.read_text("utf-8"))
    except Exception as exc:
        raise SystemExit(f"Could not read manifest {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise SystemExit(f"Manifest {path} must be a JSON object.")
    assets = payload.get("assets")
    if not isinstance(assets, dict):
        payload["assets"] = {}
    return payload


def write_manifest(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True) + "\n", "utf-8")


def cdn_dir_for(rel_path: str, prefix: str) -> str:
    parent = Path(rel_path).parent.as_posix()
    prefix = prefix.strip("/")
    return prefix if parent == "." else f"{prefix}/{parent}"


def existing_asset(manifest: dict[str, Any], rel_path: str) -> dict[str, Any] | None:
    item = manifest.get("assets", {}).get(rel_path)
    return item if isinstance(item, dict) else None


def refresh_asset(rel_path: str, prefix: str, region: str, email: str, timeout: float) -> None:
    """Best-effort async CDN purge after a same-name overwrite; failure only means slower propagation."""
    import urllib.parse
    import urllib.request

    query = urllib.parse.urlencode(
        {"dir": cdn_dir_for(rel_path, prefix), "region": region, "file": Path(rel_path).name, "email": email}
    )
    try:
        urllib.request.urlopen(f"https://ife.bytedance.net/cdn/refresh?{query}", timeout=timeout)
    except Exception as exc:
        print(f"    warning: CDN refresh failed for {rel_path}: {exc}", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload Mini TT public resources to the ByteDance CDN.")
    parser.add_argument("--resource-root", type=Path, default=DEFAULT_RESOURCE_ROOT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST_PATH)
    parser.add_argument("--cdn-dir-prefix", default=DEFAULT_CDN_DIR_PREFIX)
    parser.add_argument(
        "--cdn-base",
        default=os.environ.get("VITE_MINITT_RESOURCE_CDN_BASE") or DEFAULT_CDN_BASE,
        help="Pinned CDN base; uploads always land in ITS namespace regardless of who runs this.",
    )
    parser.add_argument(
        "--email",
        help="Migration-only override of the upload namespace. Normally derived from --cdn-base "
        "so every contributor uploads to the same space.",
    )
    parser.add_argument("--region", default="CN")
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--limit", type=int, help="Upload only the first N changed files. Useful for smoke tests.")
    parser.add_argument("--force", action="store_true", help="Upload even when relPath + sha256 already has a CDN URL.")
    parser.add_argument("--dry-run", action="store_true", help="List planned uploads without network calls or manifest writes.")
    parser.add_argument("--json", action="store_true", help="Print structured JSON summary.")
    args = parser.parse_args()

    resource_root = args.resource_root.expanduser().resolve()
    if not resource_root.is_dir():
        raise SystemExit(f"Resource root not found: {resource_root}")

    cdn_base = args.cdn_base.strip().rstrip("/")
    # The namespace is pinned by the repo's CDN base, NOT by whoever runs this —
    # builds rewrite /resource to one single base, so every upload must land there.
    email = args.email or namespace_email(cdn_base)
    ns_root = namespace_root(cdn_base)

    manifest = read_manifest(args.manifest.expanduser().resolve())
    files = iter_media_files(resource_root)

    planned: list[dict[str, Any]] = []
    skipped: list[str] = []
    uploaded: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []

    for path in files:
        rel_path = posix_rel(path, resource_root)
        size = path.stat().st_size
        sha256 = sha256_file(path)
        current = existing_asset(manifest, rel_path)
        # Synced means EXACTLY what builds will emit: cdn_base + relPath. Same content on a
        # different base (e.g. after a namespace migration) counts as unsynced and re-uploads.
        if (
            not args.force
            and current
            and current.get("sha256") == sha256
            and current.get("cdnUrl") == f"{cdn_base}/{rel_path}"
        ):
            skipped.append(rel_path)
            continue
        if size > MAX_FILE_BYTES:
            errors.append({"relPath": rel_path, "error": f"file exceeds {MAX_FILE_BYTES} bytes"})
            continue
        planned.append({"relPath": rel_path, "size": size, "sha256": sha256})

    upload_queue = planned[: args.limit] if args.limit else planned

    if not args.dry_run:
        assets = manifest.setdefault("assets", {})
        for index, item in enumerate(upload_queue, start=1):
            rel_path = item["relPath"]
            path = resource_root / rel_path
            overwriting = bool(existing_asset(manifest, rel_path))
            if not args.json:
                print(f"[{index}/{len(upload_queue)}] upload {rel_path}", flush=True)
            try:
                result = upload_one(
                    path,
                    dir_name=cdn_dir_for(rel_path, args.cdn_dir_prefix),
                    email=email,
                    region=args.region,
                    timeout=args.timeout,
                )
            except UploadError as exc:
                errors.append({"relPath": rel_path, "error": str(exc)})
                continue
            # Case-SENSITIVE: fast-deliver namespaces differ by email case; a wrong-case landing is a real 404.
            if not result["url"].startswith(ns_root):
                errors.append(
                    {
                        "relPath": rel_path,
                        "error": f"landed outside pinned namespace: {result['url']} (expected under {ns_root})",
                    }
                )
                continue
            if overwriting:
                # Same-name overwrite: CDN edges cache old bytes up to 30 days; purge is async best-effort.
                refresh_asset(rel_path, args.cdn_dir_prefix, args.region, email, args.timeout)
                if not args.json:
                    print(f"    overwrite: CDN refresh queued for {rel_path} (edges may lag minutes)", flush=True)
            record = {
                "relPath": rel_path,
                "size": item["size"],
                "sha256": item["sha256"],
                "cdnUrl": result["url"],
                "uploadedAt": utc_now(),
            }
            assets[rel_path] = record
            uploaded.append(record)

        if uploaded or errors:
            manifest.update(
                {
                    "version": 1,
                    "cdnDirPrefix": args.cdn_dir_prefix.strip("/"),
                    "resourceRoot": "public/resource",
                    "updatedAt": utc_now(),
                    "lastRunErrors": errors,
                }
            )
            write_manifest(args.manifest.expanduser().resolve(), manifest)

    summary = {
        "dryRun": args.dry_run,
        "resourceRoot": str(resource_root),
        "cdnDirPrefix": args.cdn_dir_prefix.strip("/"),
        "totalFiles": len(files),
        "planned": len(planned),
        "limitedTo": len(upload_queue),
        "skipped": len(skipped),
        "uploaded": len(uploaded),
        "errors": errors,
        "sample": upload_queue[:5],
    }

    if args.json:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print(
            f"{'DRY RUN ' if args.dry_run else ''}"
            f"files={summary['totalFiles']} planned={summary['planned']} "
            f"skipped={summary['skipped']} uploaded={summary['uploaded']} errors={len(errors)}"
        )
        for item in upload_queue[:10]:
            print(f"{item['relPath']}\t{cdn_dir_for(item['relPath'], args.cdn_dir_prefix)}")
        if len(upload_queue) > 10:
            print(f"... {len(upload_queue) - 10} more")
        for err in errors:
            print(f"ERROR {err['relPath']}: {err['error']}", file=sys.stderr)

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
