# /// script
# requires-python = ">=3.10"
# ///
"""Upload prototype media assets to the intranet CDN.

[INPUT]: depends on a local media file, an uploader email, and the intranet CDN upload endpoint.
[OUTPUT]: returns absolute CDN URLs for files uploaded to a requested CDN dir.
[POS]: low-level single-file uploader used by Mini TT batch CDN migration tooling.
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

This mirrors DesAgent's File -> Upload to CDN window. It posts one or more
files to https://ife.bytedance.net/cdn/upload and prints the returned absolute
https URL so agents can paste it into prototype HTML/CSS/JS.

Usage:
    uv run scripts/upload_cdn_asset.py hero.jpg --dir team/prototype --email user@example.com
    uv run scripts/upload_cdn_asset.py hero.jpg clip.mp4 --dir team/prototype --json

If --email is omitted, the script tries:
    1. DESAGENT_CDN_EMAIL / CDN_UPLOAD_EMAIL / BYTEDANCE_EMAIL
    2. `bytedcli --json auth status`

Failures are bounded by timeouts and reported with agent-readable messages.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import socket
import shutil
import subprocess
import sys
import uuid
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

CDN_UPLOAD_ENDPOINT = "https://ife.bytedance.net/cdn/upload"
MAX_FILE_BYTES = 200 * 1024 * 1024


class UploadError(Exception):
    pass


def default_email() -> tuple[str | None, str | None]:
    for key in ("DESAGENT_CDN_EMAIL", "CDN_UPLOAD_EMAIL", "BYTEDANCE_EMAIL"):
        value = os.environ.get(key)
        if value:
            return value, None

    bytedcli = shutil.which("bytedcli")
    if not bytedcli:
        return None, "No --email was provided and bytedcli is not installed or not on PATH."
    try:
        proc = subprocess.run(
            [bytedcli, "--json", "auth", "status"],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5,
            env={**os.environ, "NO_COLOR": "1"},
        )
    except subprocess.TimeoutExpired:
        return None, "`bytedcli --json auth status` timed out after 5s. Pass --email explicitly."
    except Exception as exc:
        return None, f"Failed to read bytedcli auth status: {exc}. Pass --email explicitly."
    if proc.returncode != 0 or not proc.stdout.strip():
        detail = (proc.stderr or proc.stdout or "").strip()
        return None, (
            "bytedcli is installed but auth status failed. "
            "Run `bytedcli auth login` or pass --email explicitly."
            + (f" Detail: {detail[:240]}" if detail else "")
        )
    try:
        payload = json.loads(proc.stdout)
    except Exception as exc:
        return None, f"Could not parse bytedcli auth status JSON: {exc}. Pass --email explicitly."
    if not isinstance(payload, dict):
        return None, "bytedcli auth status returned unexpected JSON. Pass --email explicitly."
    bytecloud_auth = payload.get("data", {}).get("bytecloud_auth", {})
    if payload.get("data", {}).get("authenticated") is not True or bytecloud_auth.get("status") != "ready":
        return None, "bytedcli is not logged in. Run `bytedcli auth login` or pass --email explicitly."
    identity = (
        payload.get("data", {})
        .get("bytecloud_auth", {})
        .get("identity", {})
    )
    email = identity.get("email")
    if isinstance(email, str) and email:
        return email, None
    return None, "bytedcli is logged in but did not report an email. Pass --email explicitly."


def network_error_message(reason: object, timeout: float) -> str:
    text = str(reason)
    lower = text.lower()
    if isinstance(reason, socket.timeout) or isinstance(reason, TimeoutError) or "timed out" in lower:
        return (
            f"CDN upload timed out after {timeout:g}s while connecting to {CDN_UPLOAD_ENDPOINT}. "
            "Check VPN/intranet access or try again from the corporate network."
        )
    if (
        "name or service not known" in lower
        or "nodename nor servname" in lower
        or "temporary failure in name resolution" in lower
        or "no address associated" in lower
    ):
        return (
            f"Cannot resolve intranet CDN host for {CDN_UPLOAD_ENDPOINT}. "
            "Check VPN/intranet DNS access."
        )
    if "network is unreachable" in lower or "connection refused" in lower or "connection reset" in lower:
        return (
            f"Cannot reach intranet CDN endpoint {CDN_UPLOAD_ENDPOINT}: {text}. "
            "Check VPN/intranet access."
        )
    return f"Network error during CDN upload to {CDN_UPLOAD_ENDPOINT}: {text}"


def make_multipart(fields: dict[str, str], file_path: Path) -> tuple[bytes, str]:
    boundary = "----desagent-cdn-" + uuid.uuid4().hex
    filename = file_path.name
    mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    chunks: list[bytes] = []

    for name, value in fields.items():
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        chunks.append(str(value).encode())
        chunks.append(b"\r\n")

    chunks.append(f"--{boundary}\r\n".encode())
    chunks.append(
        (
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {mime_type}\r\n\r\n"
        ).encode()
    )
    chunks.append(file_path.read_bytes())
    chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), boundary


def upload_one(file_path: Path, *, dir_name: str, email: str, region: str, timeout: float) -> dict[str, Any]:
    if not file_path.exists():
        raise UploadError(f"File not found: {file_path}")
    if not file_path.is_file():
        raise UploadError(f"Not a regular file: {file_path}")
    size = file_path.stat().st_size
    if size > MAX_FILE_BYTES:
        mb = size / 1024 / 1024
        raise UploadError(f"{file_path.name} is {mb:.1f} MB, exceeds the 200 MB CDN upload cap.")

    body, boundary = make_multipart(
        {"dir": dir_name, "region": region, "email": email},
        file_path,
    )
    request = urllib.request.Request(
        CDN_UPLOAD_ENDPOINT,
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", errors="replace")
        if err.code in (401, 403):
            raise UploadError(
                f"CDN upload rejected ({err.code}). Check intranet auth/permission, "
                f"or use DesAgent File -> Upload to CDN if browser SSO is required. Response: {raw[:240]}"
            )
        raise UploadError(f"CDN upload failed ({err.code}): {raw[:240]}")
    except urllib.error.URLError as err:
        raise UploadError(network_error_message(err.reason, timeout))
    except (TimeoutError, socket.timeout) as err:
        raise UploadError(network_error_message(err, timeout))

    try:
        payload = json.loads(raw)
    except Exception as exc:
        raise UploadError(f"CDN upload returned non-JSON response: {raw[:240]}") from exc
    if not isinstance(payload, dict):
        raise UploadError(f"CDN upload returned unexpected JSON: {raw[:240]}")

    cdn_url = payload.get("cdnUrl")
    full_url = payload.get("url")
    if isinstance(full_url, str) and full_url:
        url = full_url
    elif isinstance(cdn_url, str) and cdn_url:
        url = cdn_url if cdn_url.startswith("http") else f"https://{cdn_url}"
    else:
        raise UploadError(f"CDN upload returned no URL: {json.dumps(payload, ensure_ascii=False)[:240]}")

    return {"file": str(file_path), "filename": file_path.name, "size": size, "url": url}


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload media files to the intranet CDN.")
    parser.add_argument("files", nargs="+", help="Files to upload.")
    parser.add_argument("--dir", required=True, help="CDN directory, for example team/prototype.")
    parser.add_argument("--email", help="Uploader email. Defaults from env or bytedcli auth status.")
    parser.add_argument("--region", default="CN", help="CDN region. Defaults to CN.")
    parser.add_argument("--timeout", type=float, default=30.0, help="HTTP timeout per file in seconds. Defaults to 30.")
    parser.add_argument("--json", action="store_true", help="Print structured JSON.")
    parser.add_argument("--markdown", action="store_true", help="Print Markdown image/video snippets.")
    args = parser.parse_args()

    email, email_error = (args.email, None) if args.email else default_email()
    if not email:
        message = email_error or "email is required. Pass --email or set DESAGENT_CDN_EMAIL."
        if args.json:
            print(json.dumps({
                "success": False,
                "results": [],
                "errors": [{"file": "<auth>", "error": message}],
            }, indent=2, ensure_ascii=False))
            return 2
        parser.error(message)

    results: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    for raw in args.files:
        path = Path(raw).expanduser().resolve()
        try:
            results.append(upload_one(path, dir_name=args.dir, email=email, region=args.region, timeout=args.timeout))
        except UploadError as exc:
            errors.append({"file": str(path), "error": str(exc)})

    if args.json:
        print(json.dumps({"success": not errors, "results": results, "errors": errors}, indent=2, ensure_ascii=False))
    elif args.markdown:
        for item in results:
            name = item["filename"]
            url = item["url"]
            suffix = Path(name).suffix.lower()
            if suffix in {".mp4", ".mov", ".webm"}:
                print(f'<video src="{url}" muted autoplay loop playsinline></video>')
            else:
                print(f'![{name}]({url})')
        for err in errors:
            print(f"ERROR {err['file']}: {err['error']}", file=sys.stderr)
    else:
        for item in results:
            print(f"{item['filename']}\t{item['url']}")
        for err in errors:
            print(f"ERROR {err['file']}: {err['error']}", file=sys.stderr)

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
