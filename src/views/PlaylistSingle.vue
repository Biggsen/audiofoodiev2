<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getPlaylist } from "../utils/api";
import { getAuth } from "../utils/auth";
import AlbumItem from "../components/AlbumItem.vue";

const loading = ref(false);
const token = ref(localStorage.getItem("token"));
if (!token.value) {
  getAuth().then((response) => {
    console.log(response);
    token.value = response;
  });
}

const route = useRoute();
const id = ref(route.params.id);
console.log(id.value);

async function getTrackInfo(access_token) {
  const response = await fetch(
    "https://api.spotify.com/v1/tracks/4cOdK2wGLETKBW3PvgPWqT",
    {
      method: "GET",
      headers: { Authorization: "Bearer " + access_token },
    }
  );

  return await response.json();
}

async function getPlaylistItems(access_token) {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${route.params.id}/tracks`,
    {
      method: "GET",
      headers: { Authorization: "Bearer " + access_token },
    }
  );

  return await response.json();
}

async function getAlbum(access_token, album_id) {
  const response = await fetch(
    `https://api.spotify.com/v1/albums/${album_id}`,
    {
      method: "GET",
      headers: { Authorization: "Bearer " + access_token },
    }
  );

  return await response.json();
}

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

const albumsCuriousIds = ref();
const album = ref();
const albumData = ref({});
const playlistName = ref();

// getTrackInfo(token.value).then(profile => { console.log(profile) })
getPlaylist(id.value).then((response) => {
  playlistName.value = response.name;
});
getPlaylistItems(token.value).then((profile) => {
  console.log(profile);
  const albumIdArray = profile.items.map((elem) => {
    return elem.track.album.id;
  });
  //console.log(albumIdArray);
  albumsCuriousIds.value = albumIdArray.filter(onlyUnique);
  //console.log(albumsCuriousIds.value);
  const albumsCurios = [];
  albumsCuriousIds.value.forEach((album) => {
    //console.log(album);
    albumsCurios.push(
      getAlbum(token.value, album).then((data) => {
        return data;
      })
    );
  });
  Promise.all(albumsCurios).then((result) => {
    //console.log(typeof result);
    albumData.value = result;
    //console.log(albumData.value);
  });

  //console.log(albumData.value);
});
// getAlbum(token.value,"1x55Z0fYARLdeJVjG2UESs").then(data => {
//   album.value = data;
//   //console.log(album.href);
// })
</script>

<template>
  <p v-if="loading">Loading...</p>
  <main v-else>
    <h1 class="h2 pb-10">{{ playlistName }}</h1>
    <ul class="flex flex-wrap gap-4">
      <template v-for="album in albumData">
        <AlbumItem :album="album" />
      </template>
    </ul>
  </main>
</template>
