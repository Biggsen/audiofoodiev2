import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import HomeView from '@views/HomeView.vue';
import PlaylistView from '@views/playlists/PlaylistView.vue';
import PlaylistSingle from '@views/playlists/PlaylistSingle.vue';
import AccountView from '@views/auth/AccountView.vue';
import LoginView from '@views/auth/LoginView.vue';
import AddPlaylistView from '@views/playlists/AddPlaylistView.vue';
import ArtistView from '@views/music/ArtistView.vue';
import AlbumView from '@views/music/AlbumView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/playlists',
    name: 'playlists',
    component: PlaylistView,
    meta: { requiresAuth: true }
  },
  {
    path: '/playlist/add',
    name: 'addPlaylist',
    component: AddPlaylistView,
    meta: { requiresAuth: true }
  },
  {
    path: '/playlist/:id',
    name: 'playlistSingle',
    component: PlaylistSingle,
    meta: { requiresAuth: true }
  },
  {
    path: '/account',
    name: 'account',
    component: AccountView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/artist/:id',
    name: 'artist',
    component: ArtistView,
    meta: { requiresAuth: true }
  },
  {
    path: '/album/:id',
    name: 'album',
    component: AlbumView,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener();
        resolve(user);
      },
      reject
    );
  });
}

router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (await getCurrentUser()) {
      next();
    } else {
      alert('You must be logged in to access this page');
      next('/login');
    }
  } else {
    next();
  }
});

export default router;
