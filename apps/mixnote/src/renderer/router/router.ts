import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';
import SettingsPage from '@renderer/pages/SettingsPage.vue';
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
    path: '/settings',
    component: SettingsPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
