import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';
import ProblemsPage from '@renderer/pages/problems/ProblemsPage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/problems',
    component: ProblemsPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
