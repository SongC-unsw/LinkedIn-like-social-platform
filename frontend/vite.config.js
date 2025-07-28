import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  // 项目根目录
  root: ".",

  // 插件配置
  plugins: [
    // 可视化插件 - 只有设置ANALYZE=true时才启用
    process.env.ANALYZE &&
      visualizer({
        filename: "dist/stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: "treemap", // 使用树状图显示
        title: "Bundle Analysis Report",
      }),
  ].filter(Boolean),

  // 构建配置
  build: {
    // 输出目录
    outDir: "dist",

    // 是否生成source map (生产环境关闭以减小文件大小)
    sourcemap: false,

    // 确保文件名包含哈希以利用长期缓存
    assetsInlineLimit: 4096, // 小于 4kb 的资源会被内联

    // 压缩配置
    minify: "terser",

    // Terser压缩选项
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log
        drop_debugger: true, // 移除debugger
        pure_funcs: ["console.log"], // 移除指定的纯函数调用
        passes: 2, // 多次压缩以获得更好效果
      },
      mangle: {
        toplevel: true, // 压缩顶级变量名
      },
      format: {
        comments: false, // 移除注释
      },
    },

    // 文件大小警告限制 (kb)
    chunkSizeWarningLimit: 1000,

    // Rollup选项
    rollupOptions: {
      output: {
        // 静态资源文件名格式
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          let extType = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)) {
            extType = "media";
          } else if (/\.(png|jpe?g|gif|svg)$/.test(assetInfo.name)) {
            extType = "img";
          } else if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            extType = "fonts";
          }
          return `${extType}/[name]-[hash][extname]`;
        },

        // JS文件分块
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",

        // 代码分割配置
        manualChunks: {
          vendor: ["bootstrap", "@popperjs/core"],
          // 可以继续添加其他vendor库
        },
      },
    },
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    host: true,
  },

  // CSS配置
  css: {
    devSourcemap: true,
  },

  // 静态资源处理
  assetsInclude: ["**/*.svg"],

  // 公共基础路径
  base: "./",
});
