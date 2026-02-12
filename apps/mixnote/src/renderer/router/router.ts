import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/login/LoginPage.vue';
import PreFlashcardsPage from '@renderer/pages/PreFlashcardsPage.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';
import SettingsPage from '@renderer/pages/SettingsPage.vue';
import NotesPage from '@renderer/pages/notes/NotesPage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/notes',
    component: NotesPage,
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
    path: '/settings',
    component: SettingsPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
