import { ref } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCurrentUser } from 'vuefire';
import { useAlbumMappings } from './useAlbumMappings';

/**
 * @typedef {'queued' | 'curious' | 'interested' | 'great' | 'excellent' | 'wonderful'} PlaylistCategory
 * @typedef {'known' | 'new'} PlaylistType
 * 
 * @typedef {Object} PlaylistHistoryEntry
 * @property {string} playlistId
 * @property {PlaylistCategory} category
 * @property {PlaylistType} type
 * @property {number} priority
 * @property {Date} addedAt
 * @property {Date|null} removedAt
 * 
 * @typedef {Object} UserAlbumData
 * @property {PlaylistHistoryEntry[]} playlistHistory
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

export function useAlbumsData() {
  const user = useCurrentUser();
  const { getPrimaryId } = useAlbumMappings();
  const albumData = ref({});
  const loading = ref(true);
  const error = ref(null);

  /**
   * Fetches album data for a specific album ID
   * @param {string} albumId - The Spotify album ID
   * @returns {Promise<UserAlbumData|null>} The album data for the current user, or null if not found
   */
  const fetchAlbumData = async (albumId) => {
    if (!user.value) return null;

    try {
      loading.value = true;
      error.value = null;
      
      // First try the direct album ID
      let albumDoc = await getDoc(doc(db, 'albums', albumId));
      
      // If not found, check if it's an alternate ID
      if (!albumDoc.exists()) {
        const primaryId = await getPrimaryId(albumId);
        if (primaryId) {
          albumDoc = await getDoc(doc(db, 'albums', primaryId));
        }
      }
      
      if (!albumDoc.exists()) {
        return null;
      }

      const data = albumDoc.data();
      console.log(`Album ${albumId} data:`, data);
      
      // Check if userEntries exists and has data for current user
      if (!data.userEntries || !data.userEntries[user.value.uid]) {
        console.log(`No user entries found for album ${albumId}`);
        return null;
      }

      const userData = data.userEntries[user.value.uid];
      console.log(`User data for album ${albumId}:`, userData);

      // Ensure playlistHistory is an array
      if (!Array.isArray(userData.playlistHistory)) {
        console.log(`Invalid playlistHistory for album ${albumId}`);
        return null;
      }

      return {
        ...userData,
        playlistHistory: userData.playlistHistory.map(entry => ({
          ...entry,
          addedAt: entry.addedAt?.toDate?.() || entry.addedAt,
          removedAt: entry.removedAt?.toDate?.() || entry.removedAt
        }))
      };
    } catch (e) {
      console.error('Error fetching album data:', e);
      error.value = 'Failed to fetch album data';
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Gets the current playlist information for an album
   * @param {string} albumId - The Spotify album ID
   * @returns {Promise<{category: PlaylistCategory, type: PlaylistType, playlistId: string, playlistName: string} | null>}
   */
  const getCurrentPlaylistInfo = async (albumId) => {
    const data = await fetchAlbumData(albumId);
    if (!data) return null;

    const currentEntry = data.playlistHistory.find(entry => entry.removedAt === null);
    if (!currentEntry) return null;

    return currentEntry;
  };

  /**
   * Fetches album data for multiple albums
   * @param {string[]} albumIds - Array of Spotify album IDs
   * @returns {Promise<Object.<string, UserAlbumData>>} Map of album IDs to their data
   */
  const fetchAlbumsData = async (albumIds) => {
    if (!user.value) return {};

    const results = {};
    for (const albumId of albumIds) {
      results[albumId] = await fetchAlbumData(albumId);
    }
    return results;
  };

  return {
    albumData,
    loading,
    error,
    fetchAlbumData,
    fetchAlbumsData,
    getCurrentPlaylistInfo
  };
} 