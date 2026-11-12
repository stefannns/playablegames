# Playable Lab

The game review platform, its For You player, and the current game files.

## Run locally

This repository includes a built copy of the For You player. With Python 3 installed, run:

```sh
python3 serve.py
```

Open http://localhost:8000/ to use the review platform. The batch selector, Italian versions, still and animated covers, game downloads, and the FYP player use the files in this repository.

The editable player source is in `fyp/`; it has its own Node.js dependencies and build configuration. Some upstream dependencies may require access to ByteDance's package registry. `review/` contains the review interface and Italian game packs. The adjacent game folders and `fyp/public/resource/` contain the game assets used by the interface.

A `vercel.json` supplies the URL mappings for static hosting on Vercel. Deploying this repository is separate from pushing it to GitHub.
