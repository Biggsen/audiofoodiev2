<script setup>
import { ref, onMounted, computed } from "vue";
import { useToken } from "../utils/auth";
import { getPlaylist } from "../utils/api";
import { setCache, getCache, clearCache } from "../utils/cache";
import PlaylistItem from "../components/PlaylistItem.vue";
import { playlistIds } from "../constants";

const { token, initializeToken } = useToken();
const loading = ref(true);
const error = ref(null);
const cacheCleared = ref(false);

const playlists = ref({
  new: {},
  known: {}
});

const playlistCategories = ['queued', 'curious', 'interested', 'great', 'excellent', 'wonderful'];

const allPlaylistsLoaded = computed(() => 
  playlistCategories.every(category => 
    playlists.value.new[category] && playlists.value.known[category]
  )
);

const cacheKey = 'playlist_summaries';

async function loadPlaylists() {
  loading.value = true;
  error.value = null;
  cacheCleared.value = false;

  const cachedPlaylists = await getCache(cacheKey);

  if (cachedPlaylists) {
    playlists.value = cachedPlaylists;
    loading.value = false;
    return;
  }

  try {
    const playlistSummaries = { new: {}, known: {} };
    for (const category of playlistCategories) {
      const [newPlaylist, knownPlaylist] = await Promise.all([
        getPlaylist(playlistIds.new[category]),
        getPlaylist(playlistIds.known[category])
      ]);
      playlistSummaries.new[category] = {
        id: newPlaylist.id,
        name: newPlaylist.name,
        images: newPlaylist.images,
        tracks: { total: newPlaylist.tracks.total }
      };
      playlistSummaries.known[category] = {
        id: knownPlaylist.id,
        name: knownPlaylist.name,
        images: knownPlaylist.images,
        tracks: { total: knownPlaylist.tracks.total }
      };
    }

    playlists.value = playlistSummaries;
    await setCache(cacheKey, playlistSummaries);
  } catch (e) {
    console.error("Error loading playlists:", e);
    error.value = "Failed to load playlists. Please try again.";
  } finally {
    loading.value = false;
  }
}

async function handleClearCache() {
  await clearCache(cacheKey);
  cacheCleared.value = true;
  playlists.value = { new: {}, known: {} };
  await loadPlaylists();
}

onMounted(async () => {
  try {
    loading.value = true;
    await initializeToken();
    await loadPlaylists();
  } catch (e) {
    console.error("Error in PlaylistView:", e);
    error.value = "An unexpected error occurred. Please try again.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main>
    <h1 class="h2 pb-4">Playlists</h1>
    <div class="mb-6">
      <a href="#" @click.prevent="handleClearCache" class="text-blue-500 hover:underline">
        Clear cache and reload playlists
      </a>
    </div>

    <p v-if="cacheCleared" class="mb-4 text-green-500">
      Cache cleared! Reloading playlists...
    </p>

    <p v-if="loading">Loading playlists...</p>
    <p v-else-if="error" class="error-message">{{ error }}</p>
    <div v-else-if="allPlaylistsLoaded" class="flex gap-40">
      <ul v-for="type in ['new', 'known']" :key="type" class="flex flex-col gap-4">
        <PlaylistItem 
          v-for="category in playlistCategories" 
          :key="`${type}-${category}`"
          :playlist="playlists[type][category]" 
        />
      </ul>
    </div>
    <p v-else>No playlists available.</p>
  </main>
</template>

<style scoped>
.error-message {
  color: red;
  font-weight: bold;
}
</style>
