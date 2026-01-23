#!/usr/bin/env node

/**
 * 图片优化脚本
 * - 转换 PNG/JPEG 为 WebP 格式
 * - 保留原始文件作为回退
 * - 生成优化的 HTML 代码
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  imgDir: './img',
  outputDir: './dist/img',
  quality: 80, // WebP 质量 (0-100)
  // 支持的图片格式
  formats: ['.png', '.jpg', '.jpeg'],
  // 不需要转换的文件
  skip: ['Screenshot.png', 'Screenshot1.png']
};

/**
 * 检查系统是否安装了 cwebp
 */
function checkCwebp() {
  try {
    execSync('which cwebp', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 转换单个图片为 WebP
 */
function convertToWebP(inputPath, outputPath) {
  try {
    const command = `cwebp -q ${CONFIG.quality} "${inputPath}" -o "${outputPath}"`;
    execSync(command, { stdio: 'ignore' });

    // 获取文件大小
    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(outputPath).size;
    const reduction = ((1 - webpSize / originalSize) * 100).toFixed(1);

    console.log(`✅ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${reduction}% 减少)`);

    return {
      original: inputPath,
      webp: outputPath,
      originalSize,
      webpSize,
      reduction
    };
  } catch (error) {
    console.error(`❌ 转换失败: ${inputPath}`, error.message);
    return null;
  }
}

/**
 * 处理所有图片
 */
function processImages() {
  console.log('🖼️  开始优化图片...\n');

  // 检查 cwebp 是否安装
  if (!checkCwebp()) {
    console.error('❌ 未找到 cwebp 工具');
    console.log('📦 请先安装 cwebp:');
    console.log('   macOS:   brew install webp');
    console.log('   Ubuntu:  sudo apt-get install webp');
    console.log('   Windows: choco install webp');
    process.exit(1);
  }

  // 确保输出目录存在
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // 读取 img 目录
  const files = fs.readdirSync(CONFIG.imgDir);
  const results = [];

  // 处理每个文件
  files.forEach(file => {
    const ext = path.extname(file);
    const fullPath = path.join(CONFIG.imgDir, file);

    // 跳过不需要转换的文件
    if (CONFIG.skip.includes(file)) {
      console.log(`⏭️  跳过: ${file}`);
      return;
    }

    // 转换支持的格式
    if (CONFIG.formats.includes(ext)) {
      const baseName = path.basename(file, ext);
      const webpPath = path.join(CONFIG.outputDir, `${baseName}.webp`);

      // 复制原始文件到 dist 目录
      const distOriginalPath = path.join(CONFIG.outputDir, file);
      fs.copyFileSync(fullPath, distOriginalPath);

      // 转换为 WebP
      const result = convertToWebP(fullPath, webpPath);
      if (result) {
        results.push(result);
      }
    } else {
      // 直接复制其他文件（如 SVG）
      const distPath = path.join(CONFIG.outputDir, file);
      fs.copyFileSync(fullPath, distPath);
      console.log(`📋 复制: ${file}`);
    }
  });

  // 打印统计
  console.log('\n📊 优化统计:');
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalWebp = results.reduce((sum, r) => sum + r.webpSize, 0);
  const totalReduction = ((1 - totalWebp / totalOriginal) * 100).toFixed(1);

  console.log(`   原始大小: ${(totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`   优化后: ${(totalWebp / 1024).toFixed(2)} KB`);
  console.log(`   总减少: ${totalReduction}%`);
  console.log(`   文件数: ${results.length}`);

  // 生成 HTML 代码示例
  generateHTMLExamples(results);
}

/**
 * 生成 HTML 代码示例
 */
function generateHTMLExamples(results) {
  console.log('\n📝 HTML 代码示例:\n');

  results.forEach(result => {
    const baseName = path.basename(result.original, path.extname(result.original));
    const originalRelative = result.original.replace(/^.\//, '');
    const webpRelative = result.webp.replace(/^.\//, '');

    console.log(`<!-- ${baseName} -->`);
    console.log(`<picture>`);
    console.log(`  <source srcset="${webpRelative}" type="image/webp">`);
    console.log(`  <img src="${originalRelative}"`);
    console.log(`       alt="${baseName}"`);
    console.log(`       width="128" height="128"`);
    console.log(`       loading="lazy"`);
    console.log(`       decoding="async">`);
    console.log(`</picture>\n`);
  });

  console.log('💡 提示: 在 index.html 中替换现有的 <img> 标签\n');
}

/**
 * 生成更新后的 HTML（可选）
 */
function updateHTML() {
  console.log('⚠️  HTML 更新功能开发中...');
  console.log('   请手动复制上面的 HTML 代码到 index.html\n');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--dry-run') {
    console.log('🔍 预览模式：将处理的文件\n');
    const files = fs.readdirSync(CONFIG.imgDir);
    files.forEach(file => {
      const ext = path.extname(file);
      if (CONFIG.formats.includes(ext) && !CONFIG.skip.includes(file)) {
        console.log(`  ✓ ${file}`);
      }
    });
  } else if (command === '--update-html') {
    updateHTML();
  } else {
    processImages();
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { processImages, CONFIG };
