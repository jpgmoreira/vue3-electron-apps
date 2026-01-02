import { createApp } from 'vue';
import { router } from './router/router';
import { createPinia } from 'pinia';
import App from './App.vue';
import './receiver/receiver';

const app = createApp(App);
app.use(router);
app.use(createPinia());
app.mount('#app');
