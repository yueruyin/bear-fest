#!/usr/bin/env bash
set -euo pipefail

MIRROR_URL="${1:-${ALIYUN_DOCKER_MIRROR:-}}"

if [ -z "$MIRROR_URL" ]; then
  echo "用法："
  echo "  ./scripts/configure-docker-mirror.sh https://你的专属地址.mirror.aliyuncs.com"
  echo
  echo "请在阿里云控制台进入：容器镜像服务 ACR > 镜像工具 > 镜像加速器，"
  echo "复制当前账号的专属加速器地址。"
  exit 1
fi

case "$MIRROR_URL" in
  https://*.mirror.aliyuncs.com|http://*.mirror.aliyuncs.com) ;;
  *)
    echo "加速器地址格式不正确：$MIRROR_URL"
    echo "预期格式：https://xxxx.mirror.aliyuncs.com"
    exit 1
    ;;
esac

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  exec sudo -- "$0" "$MIRROR_URL"
fi

install -d -m 0755 /etc/docker

MIRROR_URL="$MIRROR_URL" python3 - <<'PY'
import json
import os
from pathlib import Path
from shutil import copy2
from time import strftime

config_path = Path("/etc/docker/daemon.json")
mirror_url = os.environ["MIRROR_URL"]

if config_path.exists():
    try:
        config = json.loads(config_path.read_text(encoding="utf-8") or "{}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"{config_path} 不是有效 JSON，请先修复：{exc}") from exc
    backup_path = config_path.with_name(f"daemon.json.backup-{strftime('%Y%m%d-%H%M%S')}")
    copy2(config_path, backup_path)
    print(f"已备份原配置到 {backup_path}")
else:
    config = {}

mirrors = config.get("registry-mirrors", [])
if not isinstance(mirrors, list):
    raise SystemExit("daemon.json 中的 registry-mirrors 必须是数组")

config["registry-mirrors"] = [mirror_url, *[item for item in mirrors if item != mirror_url]]
temp_path = config_path.with_suffix(".json.tmp")
temp_path.write_text(
    json.dumps(config, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
temp_path.replace(config_path)
PY

systemctl daemon-reload
systemctl restart docker

echo
echo "Docker镜像加速已配置：$MIRROR_URL"
docker info --format 'Registry Mirrors: {{json .RegistryConfig.Mirrors}}'
