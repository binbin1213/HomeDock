FROM python:3.11-alpine

WORKDIR /app

# 先复制项目文件（包括源码和构建配置）
COPY . /app

# 安装 Node.js 和构建依赖
RUN apk add --no-cache nodejs npm

# 构建项目
RUN npm install && npm run build

# 将构建后的 dist 目录内容复制到 /app 根目录
RUN cp -r dist/* /app/ && rm -rf dist node_modules package*.json

ENV HOMEDOCK_DATA_DIR=/data

VOLUME ["/data"]

EXPOSE 8000

CMD ["python", "dev-server.py", "--port", "8000"]
