#!/bin/bash

###############################################################################
# HomeDock 构建脚本
# 用途: 自动化 CSS 压缩、JS 打包、图片优化
###############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

###############################################################################
# 清理函数
###############################################################################

clean_dist() {
    print_info "清理旧的构建文件..."
    rm -rf dist/
    mkdir -p dist/css
    mkdir -p dist/js
    mkdir -p dist/img
    mkdir -p dist/fonts
    print_success "清理完成"
}

###############################################################################
# CSS 压缩
###############################################################################

build_css() {
    print_header "CSS 压缩"

    if ! command -v postcss &> /dev/null; then
        print_error "PostCSS 未安装"
        print_info "请运行: npm install"
        exit 1
    fi

    print_info "压缩 CSS 文件..."

    # 压缩所有 CSS 文件
    postcss css/*.css --dir dist/css --use cssnano --config postcss.config.js

    # 计算文件大小
    original_size=$(du -sh css/ | cut -f1)
    compressed_size=$(du -sh dist/css/ | cut -f1)

    print_success "CSS 压缩完成"
    echo "   原始大小: $original_size"
    echo "   压缩后: $compressed_size"
}

###############################################################################
# JavaScript 打包
###############################################################################

build_js() {
    print_header "JavaScript 打包压缩"

    if ! command -v esbuild &> /dev/null; then
        print_error "esbuild 未安装"
        print_info "请运行: npm install"
        exit 1
    fi

    print_info "打包 JavaScript 文件..."

    # 运行 esbuild
    node esbuild.config.js

    print_success "JavaScript 打包完成"
}

###############################################################################
# 图片优化
###############################################################################

optimize_images() {
    print_header "图片优化"

    if ! command -v cwebp &> /dev/null; then
        print_warning "cwebp 未安装，跳过图片优化"
        print_info "安装方法:"
        echo "   macOS:   brew install webp"
        echo "   Ubuntu:  sudo apt-get install webp"
        echo "   Windows: choco install webp"
        return
    fi

    print_info "转换图片为 WebP 格式..."

    # 运行图片优化脚本
    node scripts/optimize-images.js

    print_success "图片优化完成"
}

###############################################################################
# 字体优化
###############################################################################

optimize_fonts() {
    print_header "字体优化"

    print_info "复制字体文件到 dist 目录..."

    # 创建字体目录 - 保持与源目录相同的结构
    mkdir -p dist/css/font
    mkdir -p dist/fonts

    # 复制字体文件到 dist/css/font/（保持 CSS 引用路径）
    if [ -d "css/font" ]; then
        cp -r css/font/* dist/css/font/
        print_success "字体文件已复制到 dist/css/font/"
    else
        print_warning "未找到字体目录 css/font/"
    fi

    # 同时也复制一份到 dist/fonts/（作为备份）
    if [ -d "css/font" ]; then
        cp -r css/font/* dist/fonts/
        print_info "字体文件已复制到 dist/fonts/（备份）"
    fi
}

###############################################################################
# 复制静态资源
###############################################################################

copy_static() {
    print_header "复制静态资源"

    print_info "复制 HTML、图片等静态文件..."

    # 复制 HTML
    cp index.html dist/
    cp admin.html dist/

    # 复制 Service Worker
    if [ -f "sw.js" ]; then
        cp sw.js dist/
        print_info "已复制 sw.js"
    fi

    # 复制 favicon
    if [ -f "favicon.ico" ]; then
        cp favicon.ico dist/
        print_info "已复制 favicon.ico"
    fi

    # 复制图片（如果有非优化的）
    if [ -d "img" ]; then
        cp -r img/* dist/img/ 2>/dev/null || true
    fi

    # 复制 API 文件
    if [ -d "api" ]; then
        cp -r api dist/
    fi

    # 复制配置文件
    if [ -f "apps-config.json" ]; then
        cp apps-config.json dist/
        print_info "已复制 apps-config.json"
    fi

    # 复制其他 JSON 配置文件
    for json_file in *.json; do
        if [ -f "$json_file" ] && [ "$json_file" != "package.json" ] && [ "$json_file" != "package-lock.json" ]; then
            cp "$json_file" dist/ 2>/dev/null || true
        fi
    done

    # 复制独立的 JavaScript 文件（不是由 esbuild 打包的）
    mkdir -p dist/js
    if [ -f "js/preset-icons.js" ]; then
        cp js/preset-icons.js dist/js/
        print_info "已复制 js/preset-icons.js"
    fi

    print_success "静态资源已复制"
}

###############################################################################
# 压缩内联 CSS
###############################################################################

compress_inline_css() {
    print_header "压缩内联 CSS"

    if ! command -v node &> /dev/null; then
        print_warning "Node.js 未安装，跳过内联 CSS 压缩"
        return
    fi

    if [ ! -f "scripts/compress-inline-css.js" ]; then
        print_warning "压缩脚本不存在，跳过"
        return
    fi

    print_info "压缩 dist/index.html 中的内联 CSS..."

    node scripts/compress-inline-css.js

    print_success "内联 CSS 压缩完成"
}

###############################################################################
# 生成构建报告
###############################################################################

generate_report() {
    print_header "生成构建报告"

    print_info "构建统计:"

    # 统计文件数量
    css_count=$(find dist/css -name "*.css" 2>/dev/null | wc -l)
    js_count=$(find dist/js -name "*.js" 2>/dev/null | wc -l)
    img_count=$(find dist/img -type f 2>/dev/null | wc -l)

    echo "   CSS 文件: $css_count"
    echo "   JavaScript 文件: $js_count"
    echo "   图片文件: $img_count"

    # 计算总大小
    if [ -d "dist" ]; then
        total_size=$(du -sh dist/ | cut -f1)
        echo "   总大小: $total_size"
    fi
}

###############################################################################
# 主函数
###############################################################################

show_usage() {
    echo "用法: ./build.sh [选项]"
    echo ""
    echo "选项:"
    echo "  all       完整构建（默认）"
    echo "  css       仅压缩 CSS"
    echo "  js        仅打包 JavaScript"
    echo "  images    仅优化图片"
    echo "  fonts     仅优化字体"
    echo "  static    仅复制静态文件"
    echo "  clean     清理构建目录"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./build.sh          # 完整构建"
    echo "  ./build.sh css      # 仅压缩 CSS"
    echo "  ./build.sh js       # 仅打包 JS"
}

###############################################################################
# 脚本入口
###############################################################################

main() {
    local command=${1:-all}

    case $command in
        all)
            print_header "🚀 HomeDock 完整构建"
            clean_dist
            build_css
            build_js
            optimize_fonts
            copy_static
            compress_inline_css
            generate_report
            print_success "\n🎉 构建完成！"
            print_info "输出目录: dist/"
            print_info "测试构建: cd dist && python3 -m http.server 8080"
            ;;
        css)
            clean_dist
            mkdir -p dist/css
            build_css
            ;;
        js)
            clean_dist
            mkdir -p dist
            build_js
            ;;
        images)
            mkdir -p dist/img
            optimize_images
            ;;
        fonts)
            mkdir -p dist/fonts
            optimize_fonts
            ;;
        static)
            clean_dist
            mkdir -p dist
            copy_static
            ;;
        clean)
            clean_dist
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "未知选项: $command"
            show_usage
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
