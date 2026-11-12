# /// script
# requires-python = ">=3.10"
# ///
"""Optimize Mini TT feed videos before CDN upload.

[INPUT]: depends on ffmpeg, ffprobe, and Mini TT video files under public/resource.
[OUTPUT]: rewrites oversized MP4 files only when the optimized file is smaller.
[POS]: scripts/cdn media preflight for keeping the /resource CDN payload small.
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_VIDEO_ROOT = REPO_ROOT / "public" / "resource" / "feed_video"


def run_json(command: list[str]) -> dict[str, Any]:
    proc = subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return json.loads(proc.stdout)


def video_info(path: Path) -> dict[str, Any]:
    payload = run_json(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height,r_frame_rate,duration,bit_rate",
            "-of",
            "json",
            str(path),
        ]
    )
    streams = payload.get("streams")
    if not isinstance(streams, list) or not streams:
        raise RuntimeError(f"No video stream found: {path}")
    stream = streams[0]
    return {
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "fps": stream.get("r_frame_rate"),
        "duration": stream.get("duration"),
        "bitRate": stream.get("bit_rate"),
    }


def iter_videos(root: Path) -> list[Path]:
    return sorted(path for path in root.rglob("*.mp4") if path.is_file())


def scale_filter(max_long_edge: int) -> str:
    return (
        "scale="
        f"'if(gt(iw,ih),min(iw,{max_long_edge}),-2)':"
        f"'if(gt(iw,ih),-2,min(ih,{max_long_edge}))'"
    )


def encode_video(source: Path, target: Path, max_long_edge: int, crf: int, preset: str) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-map",
            "0:v:0",
            "-map",
            "0:a?",
            "-vf",
            scale_filter(max_long_edge),
            "-c:v",
            "libx264",
            "-preset",
            preset,
            "-crf",
            str(crf),
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            str(target),
        ],
        check=True,
    )


def optimize(path: Path, args: argparse.Namespace) -> dict[str, Any]:
    before = path.stat().st_size
    info = video_info(path)
    long_edge = max(info["width"], info["height"])
    candidate = long_edge > args.max_long_edge or args.force
    record: dict[str, Any] = {
        "path": path.relative_to(REPO_ROOT).as_posix(),
        "before": before,
        "width": info["width"],
        "height": info["height"],
        "candidate": candidate,
        "changed": False,
    }
    if not candidate or args.dry_run:
        return record

    with tempfile.TemporaryDirectory(prefix="minitt-video-") as tmp_dir:
        output = Path(tmp_dir) / path.name
        encode_video(path, output, args.max_long_edge, args.crf, args.preset)
        after = output.stat().st_size
        record["after"] = after
        record["saved"] = before - after
        record["savingRatio"] = round((before - after) / before, 4) if before else 0
        if after < before * (1 - args.min_saving_ratio):
            shutil.copy2(output, path)
            record["changed"] = True
        return record


def main() -> int:
    parser = argparse.ArgumentParser(description="Optimize Mini TT MP4 resources before CDN upload.")
    parser.add_argument("--video-root", type=Path, default=DEFAULT_VIDEO_ROOT)
    parser.add_argument("--max-long-edge", type=int, default=1920)
    parser.add_argument("--crf", type=int, default=24)
    parser.add_argument("--preset", default="medium")
    parser.add_argument("--min-saving-ratio", type=float, default=0.05)
    parser.add_argument("--force", action="store_true", help="Encode every MP4, including files already within size bounds.")
    parser.add_argument("--dry-run", action="store_true", help="Only list candidates; do not run ffmpeg.")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise SystemExit("ffmpeg and ffprobe are required. Install ffmpeg before optimizing videos.")

    root = args.video_root.expanduser().resolve()
    if not root.is_dir():
        raise SystemExit(f"Video root not found: {root}")

    records = [optimize(path, args) for path in iter_videos(root)]
    summary = {
        "dryRun": args.dry_run,
        "videoRoot": str(root),
        "maxLongEdge": args.max_long_edge,
        "crf": args.crf,
        "preset": args.preset,
        "total": len(records),
        "candidates": sum(1 for item in records if item["candidate"]),
        "changed": sum(1 for item in records if item["changed"]),
        "before": sum(int(item["before"]) for item in records),
        "after": sum(int(item.get("after", item["before"])) for item in records),
        "records": records,
    }

    if args.json:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print(
            f"videos={summary['total']} candidates={summary['candidates']} "
            f"changed={summary['changed']}"
        )
        for item in records:
            if item["candidate"]:
                after = item.get("after", "-")
                print(f"{item['path']}\t{item['before']}\t{after}\tchanged={item['changed']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
