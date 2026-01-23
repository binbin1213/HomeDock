# 构建阶段 - 使用 Node.js 镜像构建前端
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json 和构建配置
COPY package.json package-lock.json* ./
COPY esbuild.config.js ./
COPY postcss.config.js ./
COPY build.sh ./

# 安装依赖（包括所有 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 设置 PATH 并构建
ENV PATH="/app/node_modules/.bin:$PATH"
RUN chmod +x build.sh && ./build.sh all

# 生产阶段 - 使用 Python 镜像运行服务
FROM python:3.11-alpine

WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /app

# 复制必要的文件
COPY dev-server.py ./
COPY admin.html ./
COPY api/ ./api/

ENV HOMEDOCK_DATA_DIR=/data

VOLUME ["/data"]

EXPOSE 8000

CMD ["python", "dev-server.py", "--port", "8000"]
