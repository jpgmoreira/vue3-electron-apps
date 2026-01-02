import { createMemoryHistory, createRouter } from 'vue-router';
import { useProfileStore } from '@renderer/store/profile';
import { isAuthPage } from '@common/utils/utils';
import LoginPage from '@renderer/pages/LoginPage.vue';
import SignupPage from '@renderer/pages/SignupPage.vue';
import ProblemsPage from '@renderer/pages/ProblemsPage/ProblemsPage.vue';
import HistoryPage from '@renderer/pages/HistoryPage.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';
import SettingsPage from '@renderer/pages/SettingsPage.vue';
import ContestsPage from '@renderer/pages/ContestsPage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/signup',
    component: SignupPage,
  },
  {
    path: '/problems',
    component: ProblemsPage,
  },
  {
    path: '/history',
    component: HistoryPage,
  },
  {
    path: '/graph',
    component: GraphPage,
  },
  {
    path: '/settings',
    component: SettingsPage,
  },
  {
    path: '/contests',
    component: ContestsPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

router.afterEach((to) => {
  if (isAuthPage(to.path)) {
    useProfileStore().updateCurrPage(to.path);
  }
});
