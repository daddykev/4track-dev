import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import FontAwesome component
import { FontAwesomeIcon } from './utils/fontawesome'
// Import custom icon component
import CustomIcon from './components/CustomIcon.vue'

const app = createApp(App)

// Register FontAwesome component globally
app.component('font-awesome-icon', FontAwesomeIcon)
// Register custom icon component globally
app.component('custom-icon', CustomIcon)

app.use(router)
app.mount('#app')