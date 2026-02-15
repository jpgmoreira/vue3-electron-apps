import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';
import CardsPage from '@renderer/pages/cards/CardsPage.vue';
import PreFlashcardsPage from '@renderer/pages/preFlashcards/PreFlashcardsPage.vue';
import EditorPage from '@renderer/pages/EditorPage.vue';
import AboutPage from '@renderer/pages/AboutPage.vue';
import FlashcardsPage from '@renderer/pages/flashcards/FlashcardsPage.vue';

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
    path: '/about',
    component: AboutPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

// - I decided to always start on the cards page.
// router.afterEach((to) => {
//   const save = ['/cards', '/graph'];
//   if (save.includes(to.path)) {
//     useUIStore().updateSettings({ page: to.path });
//   }
// });
