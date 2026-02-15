import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';
import AboutPage from '@renderer/pages/AboutPage.vue';
import ExplorerPage from '@renderer/pages/explorer/ExplorerPage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/explorer/:view',
    name: 'explorer',
    component: ExplorerPage,
  },
  {
    path: '/graph',
    component: GraphPage,
  },
  {
    path: '/about',
    component: AboutPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
