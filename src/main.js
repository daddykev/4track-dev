import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import FontAwesome component
import { FontAwesomeIcon } from './utils/fontawesome'

const app = createApp(App)

// Register FontAwesome component globally
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(router)
app.mount('#app')