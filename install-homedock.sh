#!/usr/bin/env bash
set -e

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

PULLED_IMAGE=""

pull_image() {
  local image="$1"
  echo "拉取镜像: $image"
  if $SUDO docker pull "$image"; then
    PULLED_IMAGE="$image"
    return 0
  fi
  local tag="${image##*:}"
  if [ -z "$tag" ] || [ "$tag" = "$image" ]; then
    tag="latest"
  fi
  local fallback="ghcr.io/binbin1213/homedock:${tag}"
  echo "从 Docker Hub 拉取失败，尝试从 GitHub 容器仓库拉取: $fallback"
  if $SUDO docker pull "$fallback"; then
    PULLED_IMAGE="$fallback"
    return 0
  fi
  return 1
}

while true; do
  echo "请选择操作:"
  echo "1) 部署/安装 HomeDock"
  echo "2) 一键检查更新"
  echo "3) 卸载 HomeDock"
  read -r -p "请输入选项 (默认: 1): " ACTION
  if [ -z "$ACTION" ]; then
    ACTION="1"
  fi

  if [ "$ACTION" = "3" ]; then
    if ! command -v docker >/dev/null 2>&1; then
      echo "未检测到 Docker，HomeDock 似乎未安装。"
      exit 0
    fi

    echo "开始卸载 HomeDock..."

    if $SUDO docker ps -a --format '{{.Names}}' | grep -q '^homedock$'; then
      echo "正在停止并删除容器 homedock..."
      $SUDO docker rm -f homedock >/dev/null 2>&1 || true
    else
      echo "未找到名为 homedock 的容器。"
    fi

    read -r -p "是否删除镜像 binbin1213/homedock (y/N): " RM_IMG
    if [ "$RM_IMG" = "y" ] || [ "$RM_IMG" = "Y" ]; then
      IMAGE_IDS=$($SUDO docker images binbin1213/homedock -q | sort -u)
      if [ -n "$IMAGE_IDS" ]; then
        echo "正在删除镜像..."
        $SUDO docker rmi $IMAGE_IDS || true
      else
        echo "未找到 binbin1213/homedock 镜像。"
      fi
    fi

    read -r -p "是否删除数据目录 (默认: /opt/homedock-data) [y/N]: " RM_DATA
    if [ "$RM_DATA" = "y" ] || [ "$RM_DATA" = "Y" ]; then
      read -r -p "请输入要删除的数据目录 (默认: /opt/homedock-data): " DATA_DIR
      if [ -z "$DATA_DIR" ]; then
        DATA_DIR="/opt/homedock-data"
      fi
      if [ -d "$DATA_DIR" ]; then
        echo "正在删除数据目录 $DATA_DIR..."
        $SUDO rm -rf "$DATA_DIR"
      else
        echo "未找到目录 $DATA_DIR，跳过删除。"
      fi
    fi

    echo "卸载完成。"
    exit 0
  fi

  if [ "$ACTION" = "2" ]; then
    if ! command -v docker >/dev/null 2>&1; then
      echo "未检测到 Docker，无法检查更新。"
      continue
    fi

    if ! $SUDO docker ps -a --format '{{.Names}}' | grep -q '^homedock$'; then
      echo "未检测到已安装的 HomeDock 容器。"
      continue
    fi

    echo "检测到已安装的 HomeDock。"
    read -r -p "是否从仓库拉取最新镜像并更新？[y/N]: " CONFIRM_UPDATE
    if [ "$CONFIRM_UPDATE" != "y" ] && [ "$CONFIRM_UPDATE" != "Y" ]; then
      echo "已取消更新，返回菜单。"
      continue
    fi

    DATA_DIR=$($SUDO docker inspect homedock --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}')
    if [ -z "$DATA_DIR" ]; then
      DATA_DIR="/opt/homedock-data"
    fi

    PORT=$($SUDO docker inspect homedock --format '{{with index .NetworkSettings.Ports "8000/tcp"}}{{(index . 0).HostPort}}{{end}}')
    if [ -z "$PORT" ]; then
      PORT="8000"
    fi

    IMAGE=$($SUDO docker inspect homedock --format '{{.Config.Image}}')
    if [ -z "$IMAGE" ]; then
      IMAGE="binbin1213/homedock:latest"
    fi

    echo "使用数据目录: $DATA_DIR"
    echo "使用端口: $PORT"
    echo "使用镜像: $IMAGE"

    $SUDO mkdir -p "$DATA_DIR"

    pull_image "$IMAGE"
    IMAGE="$PULLED_IMAGE"

    echo "停止并删除旧容器 homedock..."
    $SUDO docker rm -f homedock >/dev/null 2>&1 || true

    echo "启动容器..."
    $SUDO docker run -d \
      --name homedock \
      -p "${PORT}:8000" \
      -v "${DATA_DIR}:/data" \
      --restart unless-stopped \
      "$IMAGE"

    if hostname -I >/dev/null 2>&1; then
      HOST_IP=$(hostname -I | awk '{print $1}')
    else
      HOST_IP="localhost"
    fi

    if [ -z "$HOST_IP" ]; then
      HOST_IP="localhost"
    fi

    echo
    echo "更新完成。"
    echo "首页:  http://${HOST_IP}:${PORT}/index.html"
    echo "后台:  http://${HOST_IP}:${PORT}/admin.html"
    exit 0
  fi

  if [ "$ACTION" != "1" ]; then
    echo "无效选项，请重新选择。"
    continue
  fi

  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME="${NAME:-Unknown}"
  else
    OS_NAME="Unknown"
  fi

  echo "检测到系统: $OS_NAME"

  if ! command -v docker >/dev/null 2>&1; then
    echo "未检测到 Docker，正在安装..."
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL https://get.docker.com | $SUDO sh
    elif command -v wget >/dev/null 2>&1; then
      wget -qO- https://get.docker.com | $SUDO sh
    else
      echo "需要 curl 或 wget 来安装 Docker，请先手动安装其中之一。"
      exit 1
    fi
  else
    echo "已检测到 Docker，跳过安装。"
  fi

  if ! $SUDO docker info >/dev/null 2>&1; then
    echo "Docker 服务未运行，尝试启动..."
    if command -v systemctl >/dev/null 2>&1; then
      $SUDO systemctl start docker || true
    fi
  fi

  echo
  read -r -p "请输入数据目录 (默认: /opt/homedock-data): " DATA_DIR
  if [ -z "$DATA_DIR" ]; then
    DATA_DIR="/opt/homedock-data"
  fi

  echo
  read -r -p "请输入映射端口 (默认: 8000): " PORT
  if [ -z "$PORT" ]; then
    PORT="8000"
  fi

  read -r -p "请输入镜像版本标签 (默认: latest): " IMAGE_TAG
  if [ -z "$IMAGE_TAG" ]; then
    IMAGE_TAG="latest"
  fi

  echo "使用数据目录: $DATA_DIR"
  echo "使用端口: $PORT"
  echo "使用镜像: binbin1213/homedock:${IMAGE_TAG}"

  $SUDO mkdir -p "$DATA_DIR"

  IMAGE="binbin1213/homedock:${IMAGE_TAG}"

  pull_image "$IMAGE"
  IMAGE="$PULLED_IMAGE"

  if $SUDO docker ps -a --format '{{.Names}}' | grep -q '^homedock$'; then
    echo "发现已有容器 homedock，正在停止并删除..."
    $SUDO docker rm -f homedock >/dev/null 2>&1 || true
  fi

  echo "启动容器..."
  $SUDO docker run -d \
    --name homedock \
    -p "${PORT}:8000" \
    -v "${DATA_DIR}:/data" \
    --restart unless-stopped \
    "$IMAGE"

  if hostname -I >/dev/null 2>&1; then
    HOST_IP=$(hostname -I | awk '{print $1}')
  else
    HOST_IP="localhost"
  fi

  if [ -z "$HOST_IP" ]; then
    HOST_IP="localhost"
  fi

  echo
  echo "部署完成。"
  echo "首页:  http://${HOST_IP}:${PORT}/index.html"
  echo "后台:  http://${HOST_IP}:${PORT}/admin.html"
  exit 0
done
