import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';
import CardsPage from '@renderer/pages/cards/CardsPage.vue';
import PreFlashcardsPage from '@renderer/pages/PreFlashcardsPage.vue';
import EditorPage from '@renderer/pages/EditorPage.vue';
import SettingsPage from '@renderer/pages/SettingsPage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/cards',
    component: CardsPage,
  },
  {
    path: '/pre-flashcards',
    component: PreFlashcardsPage,
  },
  {
    path: '/graph',
    component: GraphPage,
  },
  {
    path: '/editor',
    component: EditorPage,
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

// router.afterEach((to) => {
//   const keep = ['/cards', '/graph'];
//   if (keep.includes(to.path)) {
//     useUIStore().updateSettings({ page: to.path });
//   }
// });
