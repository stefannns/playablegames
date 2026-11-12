#!/usr/bin/env bash
# [INPUT]: 依赖已安装的 node_modules/.bin/vite，并复用 install_tux_skills.sh 的健康检测能力。
# [OUTPUT]: 非阻塞确保 TUX Skills 后，以当前进程启动 Vite 并透传全部命令行参数。
# [POS]: Mini TT 的标准开发启动器，由 package.json 的 npm run dev 唯一调用。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VITE_BIN="${ROOT_DIR}/node_modules/.bin/vite"
TUX_SKILLS_INSTALLER="${ROOT_DIR}/install_tux_skills.sh"

if [[ ! -x "$VITE_BIN" ]]; then
  printf '[Mini TT] 未检测到本地 Vite。请先在项目根执行 npm install，再运行 npm run dev。\n' >&2
  exit 1
fi

if [[ -f "$TUX_SKILLS_INSTALLER" ]]; then
  if ! bash "$TUX_SKILLS_INSTALLER" --quiet; then
    printf '[Mini TT] TUX Skills 暂未就绪，继续启动开发服务器；稍后可运行 ./install_tux_skills.sh 重试。\n' >&2
  fi
else
  printf '[Mini TT] 仓库中缺少 install_tux_skills.sh，继续启动开发服务器。\n' >&2
fi

exec "$VITE_BIN" "$@"
