/**
 * 首屏关键 CSS - 只包含首屏渲染必需的样式
 * 大约 1KB，而不是 5KB
 */
const fs = require('fs');

const inputFile = 'index.html';
const outputFile = 'index.html';

// 读取 HTML
let html = fs.readFileSync(inputFile, 'utf8');

// 定义首屏关键 CSS（精简版）
const criticalCSS = `
/* 基础重置 */
*{margin:0;padding:0;box-sizing:border-box}
img{border:0;vertical-align:middle}
ul{margin:0;padding:0;border:none;list-style:none;font-size:12px}
a{color:#fff;text-decoration:none}

/* Body 和背景 */
body{
  height:100%;
  font-size:100%;
  background:linear-gradient(135deg,#00C4FF,#9D1BB2) no-repeat fixed;
  overflow-x:hidden;
  overflow-y:auto;
  font-family:'Helvetica Neue','Microsoft Yahei',SimHei,sans-serif;
  position:relative
}

/* 背景蒙层 */
body::before{
  content:'';
  position:fixed;
  top:0;left:0;right:0;bottom:0;
  background:inherit;
  filter:blur(4px);
  z-index:-1
}
body::after{
  content:'';
  position:fixed;
  top:0;left:0;right:0;bottom:0;
  background:rgba(0,0,0,.15);
  z-index:-1
}

/* 主容器 */
#wrap{width:100%;height:100%;margin:0 auto;overflow:visible;position:relative;z-index:1}
#top{margin-top:15%;width:100%;height:162px}
#main{margin-top:6%}
`;

// 替换原有的内联 CSS
html = html.replace(
  /<style>[\s\S]*?<\/style>/,
  `<style>${criticalCSS}</style>`
);

// 写回文件
fs.writeFileSync(outputFile, html, 'utf8');

console.log('✅ 内联 CSS 已精简！');
console.log(`   原始大小: 4987 字节 (~5KB)`);
console.log(`   新大小: ${criticalCSS.length} 字节 (~${(criticalCSS.length/1024).toFixed(1)}KB)`);
console.log(`   节省: ${((4987 - criticalCSS.length) / 1024).toFixed(1)} KB (${((1 - criticalCSS.length/4987) * 100).toFixed(1)}%)`);
