<template>
  <v-container class="py-4">
    <v-row dense>
      <v-col
        v-for="photo in photos"
        :key="photo.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          class="cursor-pointer"
          elevation="2"
          @click="openPhoto(photo)"
        >
          <v-img
            :src="photo.image"
            height="200"
            cover
          />

          <v-card-title class="text-h6">{{ photo.title }}</v-card-title>
          <v-card-subtitle class="text-subtitle-1">{{ photo.date }}</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

// Dummy data
const photos = ref([
  {
    id: 1,
    title: 'First Photo',
    date: '2025-02-10',
    image: 'https://picsum.photos/600/400?1'
  },
  {
    id: 2,
    title: 'Second Photo',
    date: '2025-02-09',
    image: 'https://picsum.photos/600/400?2'
  },
  {
    id: 3,
    title: 'Third Photo',
    date: '2025-02-08',
    image: 'https://picsum.photos/600/400?3'
  },
  {
    id: 4,
    title: 'Fourth Photo',
    date: '2025-02-07',
    image: 'https://picsum.photos/600/400?4'
  }
])

function openPhoto(photo) {
  alert(`Clicked: ${photo.title}`)
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
