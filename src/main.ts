import { createApp } from 'vue'
import App from './app/App.vue'
import router from './app/router'
import './styles/index.css'

createApp(App).use(router).mount('#root')
