import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';
import CardsPage from '@renderer/pages/cards/CardsPage.vue';
import FlashcardsPage from '@renderer/pages/FlashcardsPage.vue';
import EditorPage from '@renderer/pages/EditorPage.vue';
import SettingsPage from '@renderer/pages/SettingsPage.vue';
import { useUIStore } from '@renderer/store/ui';

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
    path: '/flashcards',
    component: FlashcardsPage,
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

router.afterEach((to) => {
  const skip = ['/', '/login'];
  if (!skip.includes(to.path)) {
    useUIStore().updateSettings({ page: to.path });
  }
});
