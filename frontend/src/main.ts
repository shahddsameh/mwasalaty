import { createApp } from 'vue'
import App from './app/App.vue'
import router from './app/router'
import './styles/index.css'
import { applyTheme, getSavedTheme } from './services/theme'

applyTheme(getSavedTheme())
createApp(App).use(router).mount('#root')
