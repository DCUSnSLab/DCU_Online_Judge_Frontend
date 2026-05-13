import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://127.0.0.1:8000'

  // Django 4+ checks Origin against Host for state-changing requests.
  // Vite's `changeOrigin: true` rewrites Host but not Origin — so we
  // override Origin (and Referer) on the proxied request to match the
  // backend, preventing CSRF "Forbidden" rejections in development.
  const overrideHeaders = (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.setHeader('Origin', apiTarget)
      proxyReq.setHeader('Referer', apiTarget)
    })
  }

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true, styles: { configFile: 'src/styles/vuetify-settings.scss' } })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@oj': fileURLToPath(new URL('./src/pages/oj', import.meta.url)),
        '@admin': fileURLToPath(new URL('./src/pages/admin', import.meta.url)),
        '~': fileURLToPath(new URL('./src/shared', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin']
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        input: {
          oj: fileURLToPath(new URL('./index.html', import.meta.url)),
          admin: fileURLToPath(new URL('./admin.html', import.meta.url))
        }
      }
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure: overrideHeaders
        },
        '/public': {
          target: apiTarget,
          changeOrigin: true,
          configure: overrideHeaders
        }
      }
    }
  }
})
