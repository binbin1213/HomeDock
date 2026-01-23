/**
 * esbuild 配置文件
 * 用于 JavaScript 打包、压缩和 Tree Shaking
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// JavaScript 文件列表（按依赖顺序）
const jsFiles = [
  'js/utils/helpers.js',
  'js/utils/notification.js',
  'js/utils/module-loader.js',
  'js/modules/config-manager.js',
  'js/modules/app-renderer.js',
  'js/modules/ui-controller.js',
  'js/modules/search-engine.js',
  'js/preset-icons.js',
  'js/utils/service-worker.js',
  'js/utils/image-optimizer.js'
];

// 基础配置
const baseConfig = {
  // 不使用 bundle，直接合并文件以保留全局变量
  stdin: {
    contents: jsFiles.map(file => {
      const content = fs.readFileSync(file, 'utf8');
      return `// ===== ${file} =====\n${content}\n`;
    }).join('\n'),
    resolveDir: __dirname
  },
  bundle: false,  // ⚠️ 禁用 bundle，避免作用域隔离
  minify: true,
  sourcemap: !isProduction,
  target: 'es2015',
  outfile: 'dist/app.js',
  charset: 'utf8',
  // Tree Shaking
  treeShaking: false,  // ⚠️ 禁用 tree shaking
  // 定义全局变量
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"'
  },
  // 日志级别
  logLevel: 'info'
};

// 构建函数
async function build() {
  try {
    console.log('🚀 开始构建 JavaScript...');

    const startTime = Date.now();

    await esbuild.build(baseConfig);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ JavaScript 构建完成！用时: ${duration}秒`);
    console.log(`📦 输出文件: dist/app.js`);

    // 显示文件大小
    const fs = require('fs');
    const stats = fs.statSync('dist/app.js');
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 文件大小: ${sizeKB} KB (压缩后)`);

  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

// 监听模式
async function watch() {
  const ctx = await esbuild.context({
    ...baseConfig,
    watch: {
      onRebuild(error, result) {
        if (error) {
          console.error('❌ 监听构建失败:', error);
        } else {
          console.log('✅ 监听构建完成！');
        }
      },
    },
  });

  await ctx.watch();
  console.log('👀 监听模式已启动...');
  console.log('💡 修改 js/ 目录下的文件将自动重新构建');
}

// 开发模式构建
async function buildDev() {
  try {
    console.log('🔧 开发模式构建...');

    await esbuild.build({
      ...baseConfig,
      minify: false,
      sourcemap: true,
      outfile: 'dist/app.dev.js'
    });

    console.log('✅ 开发模式构建完成！');
    console.log('📦 输出文件: dist/app.dev.js (未压缩)');

  } catch (error) {
    console.error('❌ 开发构建失败:', error);
    process.exit(1);
  }
}

// 命令行参数
const args = process.argv.slice(2);
const command = args[0];

if (command === 'watch') {
  watch();
} else if (command === 'dev') {
  buildDev();
} else {
  build();
}

// 导出配置供其他脚本使用
module.exports = { baseConfig, build, watch, buildDev };
