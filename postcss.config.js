/**
 * PostCSS 配置文件
 * 用于 CSS 压缩和优化
 */

module.exports = {
  plugins: [
    // 使用 cssnano 进行 CSS 压缩
    require('cssnano')({
      preset: 'default',
      // 保留特定注释
      discardComments: {
        removeAll: false,
        preserve: /^!|@preserve|@license/
      }
    })
  ]
};
