import tailwindcss from '@tailwindcss/vite'

const GA_MEASUREMENT_ID = 'G-3ECGZGTFZ6'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  srcDir: 'app',
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      script: [
        {
          src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
          async: true
        },
        {
          innerHTML: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${GA_MEASUREMENT_ID}');`,
          type: 'text/javascript'
        }
      ]
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
})
