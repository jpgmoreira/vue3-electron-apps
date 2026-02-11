import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';
import ProblemsPage from '@renderer/pages/problems/ProblemsPage.vue';
import ContestsPage from '@renderer/pages/contests/ContestsPage.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';
import HistoryPage from '@renderer/pages/HistoryPage.vue';
import SettingsPage from '@renderer/pages/SettingsPage.vue';
import { useUIStore } from '@renderer/store/ui';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/problems',
    component: ProblemsPage,
  },
  {
    path: '/contests',
    component: ContestsPage,
  },
  {
    path: '/graph',
    component: GraphPage,
  },
  {
    path: '/history',
    component: HistoryPage,
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

router.afterEach((to) => {
  const save = ['/problems', '/contests'];
  if (save.includes(to.path)) {
    useUIStore().updateSettings({ page: to.path });
  }
});
