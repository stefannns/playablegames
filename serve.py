#!/usr/bin/env python3
"""Serve the review UI and its FYP player from a single local origin."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import os

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/app' or path.startswith('/app/'):
            self.path = '/fyp-build/index.html'
        elif path.startswith('/assets/'):
            self.path = '/fyp-build' + self.path
        elif path.startswith('/resource/'):
            self.path = '/fyp/public' + self.path
        elif path in ('/favicon.svg', '/apple-touch-icon.png', '/pwa-512x512.png', '/manifest.webmanifest'):
            self.path = '/fyp-build' + self.path
        super().do_GET()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8000'))
    print(f'Playable Lab: http://localhost:{port}/review/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
