import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

// 把构建产物内联成单文件 index.html。
// uTools 以本地文件方式加载插件页面，内联后无需任何本地服务器，
// 也避免 file:// 下 ES module / CORS 带来的白屏。
function inlineSingleFilePlugin() {
  return {
    name: 'utools-inline-single-file',
    apply: 'build',
    enforce: 'post',
    writeBundle(options, bundle) {
      const outDir = options.dir || resolve(process.cwd(), 'dist')
      const htmlPath = join(outDir, 'index.html')
      if (!existsSync(htmlPath)) return

      // 产物必须是可离线加载的独立插件：去掉 development 入口，
      // 否则打包后仍会指向 http://localhost:5173，服务未启动即白屏。
      const pluginJsonPath = join(outDir, 'plugin.json')
      if (existsSync(pluginJsonPath)) {
        const pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf8'))
        if (pluginJson.development) {
          delete pluginJson.development
          writeFileSync(pluginJsonPath, `${JSON.stringify(pluginJson, null, 2)}\n`)
        }
      }

      let html = readFileSync(htmlPath, 'utf8')
      const assetsDir = join(outDir, 'assets')

      // 内联 CSS
      html = html.replace(
        /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
        (tag, href) => {
          const file = join(outDir, href.replace(/^\.?\//, ''))
          if (!existsSync(file)) return tag
          return `<style>\n${readFileSync(file, 'utf8')}\n</style>`
        }
      )

      // 内联 JS（构建产物为单 chunk）
      html = html.replace(
        /<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
        (tag, src) => {
          const file = join(outDir, src.replace(/^\.?\//, ''))
          if (!existsSync(file)) return tag
          return `<script type="module">\n${readFileSync(file, 'utf8')}\n</script>`
        }
      )

      writeFileSync(htmlPath, html)
      if (existsSync(assetsDir)) rmSync(assetsDir, { recursive: true, force: true })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), inlineSingleFilePlugin()],
  base: './',
  server: {
    // uTools 内置浏览器按 127.0.0.1 访问，必须显式绑定 IPv4，
    // 否则 Vite 默认只监听 [::1]，开发模式会打开空白页
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
})
