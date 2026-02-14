import { createApp } from 'vue';
import { router } from './router/router';
import { createPinia } from 'pinia';
import FloatingVue from 'floating-vue';
import App from './App.vue';
import './md-editor-v3-config';
import './receiver/receiver';
import './events/register';

const app = createApp(App);
app.use(router);
app.use(FloatingVue);
app.use(createPinia());
app.mount('#app');
