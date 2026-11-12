# /// script
# requires-python = ">=3.10"
# ///
"""Build Mini TT for Goofy with CDN resource sync.

[INPUT]: depends on local public/resource files, CDN scripts, and bytedcli for deploy.
[OUTPUT]: writes a CDN-only Vite dist (build itself dedup-uploads new media into the pinned
          namespace), adds SPA entry pages for every static app route (Goofy only serves real files),
          and optionally deploys it to a Goofy quick preview.
[POS]: scripts/cdn release orchestrator for Goofy / cloud publishing; same deploy channel as DesAgent's Share -> Goofy.
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CDN_BASE = "https://lf3-static.bytednsdoc.com/obj/eden-cn/nuhboeh7uhopg/desagent/minitt/v1"
ALIAS_ENV_KEY = "MINITT_GOOFY_ALIAS"


def resolve_bytedcli() -> list[str] | None:
    """Locate bytedcli: PATH first, then the global npm module (bin symlink can be missing)."""
    exe = shutil.which("bytedcli")
    if exe:
        return [exe]
    probe = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True)
    entry = Path(probe.stdout.strip()) / "@bytedance-dev/bytedcli/dist/bytedcli.js"
    return ["node", str(entry)] if entry.exists() else None


ROUTE_TREE = REPO_ROOT / "src" / "routes" / "app_route_tree.ts"
DIST = REPO_ROOT / "dist"


def app_route_paths() -> list[str]:
    """Static app paths from the route tree: each tab root, its find-friends page, and every literal sub-path."""
    source = ROUTE_TREE.read_text(encoding="utf-8")
    root = re.search(r'APP_ROOT_PATH = "([^"]+)"', source).group(1)
    tabs = sorted(set(re.findall(r'tab: "([a-z-]+)"', source)))
    literals = re.findall(r"APP_ROOT_PATH\}(/[a-z0-9/_-]+)`", source)
    return sorted({root, *(f"{root}/{tab}" for tab in tabs), *(f"{root}/{tab}/find-friends" for tab in tabs), *(root + path for path in literals)})


def write_spa_entries() -> int:
    """Goofy's page server has no SPA fallback, so a reload or shared link on /app/... would 404.
    Copy index.html to <route>/index.html (Goofy serves directory indexes) for every static route."""
    print("\n==> Add SPA entry pages for app routes", flush=True)
    index = DIST / "index.html"
    if not index.exists():
        print("dist/index.html missing; build first.", file=sys.stderr)
        return 1
    paths = app_route_paths()
    for path in paths:
        target = DIST / path.lstrip("/") / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(index, target)
    print(f"{len(paths)} entry pages written", flush=True)
    return 0


def run_step(label: str, command: list[str], env: dict[str, str] | None = None) -> int:
    print(f"\n==> {label}", flush=True)
    print("$ " + " ".join(command), flush=True)
    return subprocess.run(command, cwd=REPO_ROOT, env=env).returncode


def main() -> int:
    parser = argparse.ArgumentParser(description="Optimize, build, and optionally deploy Mini TT for Goofy.")
    parser.add_argument(
        "--cdn-base",
        default=os.environ.get("VITE_MINITT_RESOURCE_CDN_BASE", DEFAULT_CDN_BASE),
        help="CDN base used by the final build. Defaults to the Mini TT DesAgent CDN.",
    )
    parser.add_argument(
        "--alias",
        default=os.environ.get(ALIAS_ENV_KEY),
        help="Goofy quick-preview alias; when set, deploys dist via `bytedcli goofy preview deploy` "
        f"(same channel as DesAgent). Defaults from {ALIAS_ENV_KEY}.",
    )
    args = parser.parse_args()

    cdn_base = args.cdn_base.strip().rstrip("/")
    if not cdn_base:
        print("Missing CDN base.", file=sys.stderr)
        return 2

    build_env = {**os.environ, "VITE_MINITT_RESOURCE_CDN_BASE": cdn_base}

    steps = [
        (
            "Optimize oversized MP4 resources",
            [sys.executable, "scripts/cdn/optimize_minitt_videos.py"],
            None,
        ),
        (
            # CDN dedup-upload now lives inside the build itself (vite plugin buildStart).
            "Build CDN dist for Goofy (auto-syncs new media to CDN)",
            ["npm", "run", "build:cdn"],
            build_env,
        ),
    ]

    if args.alias:
        bytedcli = resolve_bytedcli()
        if not bytedcli:
            print(
                "bytedcli not found. Install it (`npm i -g @bytedance-dev/bytedcli`) "
                "and log in (`bytedcli auth login`) to deploy.",
                file=sys.stderr,
            )
            return 2
        steps.append(
            (
                f"Deploy dist to Goofy quick preview ({args.alias}.gf-preview.bytedance.net)",
                [*bytedcli, "goofy", "preview", "deploy", "dist", "--alias", args.alias, "--override"],
                None,
            )
        )
    else:
        print(f"(no --alias / {ALIAS_ENV_KEY}: building only, skipping Goofy deploy)", flush=True)

    deploy = steps[2:]
    for label, command, env in steps[:2]:
        code = run_step(label, command, env)
        if code != 0:
            return code
    code = write_spa_entries()
    if code != 0:
        return code
    for label, command, env in deploy:
        code = run_step(label, command, env)
        if code != 0:
            return code
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
