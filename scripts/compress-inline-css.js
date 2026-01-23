#!/usr/bin/env node

/**
 * 压缩 HTML 中的内联 CSS
 */

const fs = require('fs');
const postcss = require('postcss');
const cssnano = require('cssnano');

const INPUT_HTML = 'dist/index.html';
const OUTPUT_HTML = 'dist/index.html';

async function compressInlineCSS() {
  console.log('🔧 压缩内联 CSS...');

  try {
    // 读取 HTML 文件
    let html = fs.readFileSync(INPUT_HTML, 'utf8');

    // 查找所有 <style> 标签
    const styleRegex = /<style>([\s\S]*?)<\/style>/g;
    const matches = [...html.matchAll(styleRegex)];

    console.log(`   找到 ${matches.length} 个 <style> 标签`);

    // 逐个压缩
    for (const match of matches) {
      const fullTag = match[0];
      const cssContent = match[1];

      // 使用 PostCSS + cssnano 压缩 CSS
      const result = await postcss([cssnano()]).process(cssContent, { from: undefined });
      const minifiedCSS = result.css;

      // 替换原始标签
      html = html.replace(fullTag, `<style>${minifiedCSS}</style>`);
    }

    // 写入文件
    fs.writeFileSync(OUTPUT_HTML, html, 'utf8');

    // 显示统计
    const originalSize = fs.statSync(INPUT_HTML).size;
    const newSize = fs.statSync(OUTPUT_HTML).size;
    const saved = originalSize - newSize;
    const percentage = ((saved / originalSize) * 100).toFixed(1);

    console.log(`✅ 内联 CSS 压缩完成！`);
    console.log(`   原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   压缩后: ${(newSize / 1024).toFixed(2)} KB`);
    console.log(`   节省: ${(saved / 1024).toFixed(2)} KB (${percentage}%)`);

    return newSize;
  } catch (err) {
    console.error('❌ CSS 压缩失败:', err);
    process.exit(1);
  }
}

// 执行压缩
compressInlineCSS();
