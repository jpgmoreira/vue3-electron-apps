import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

// router.afterEach((to) => {
//   const save = [];
//   if (save.includes(to.path)) {
//     useUIStore().updateSettings({ page: to.path });
//   }
// });
