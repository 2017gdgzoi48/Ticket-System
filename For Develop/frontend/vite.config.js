import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import styleImport, { VantResolve } from 'vite-plugin-style-import';
const { resolve } = require('path')


// https://vitejs.dev/config/
export default defineConfig({
  resolve:{
     alias: {
        'vue': 'vue/dist/vue.esm-bundler.js' // 定义vue的别名，如果使用其他的插件，可能会用到别名
    }
  },
  plugins: [
    vue(),
    Components({
      resolvers: [
        AntDesignVueResolver(),
      ]
    }),
    styleImport({
      resolves: [VantResolve()],
    })
  ],
  build:{
    rollupOptions: {
      input: [
          resolve(__dirname, './page/buyTicket.html'),
          resolve(__dirname, './page/buyTicket2.html'),
          resolve(__dirname, './page/adminLogin.html'),
          resolve(__dirname, './page/adminPage.html'),
          resolve(__dirname, './page/userIndex.html'),
          // resolve(__dirname, './page/userIndex2.html'),
          resolve(__dirname, './page/userLogin.html'),
          // resolve(__dirname, './page/userLogin2.html'),
          // resolve(__dirname, './page/userLogin3.html')
          // resolve(__dirname,'./test/scale.html')
        ]
    }
  }
})
