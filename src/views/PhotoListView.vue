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
          <v-img :src="photo.images[0]" height="200" cover />
          <v-card-title class="text-h6">{{ photo.title }}</v-card-title>
          <v-card-subtitle class="text-subtitle-1">{{ photo.date }}</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog
      v-model="showModal"
      max-width="700"
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card class="modal-card">
       <div 
          @mouseenter="hovering = true"
          @mouseleave="hovering = false"
        >
          <v-carousel
            v-if="selectedPhoto"
            hide-delimiter-background
            :show-arrows="hovering && selectedPhoto.images.length > 1 && smAndUp"
            height="400"
            :cycle="false"
            :continuous="false"
          >
            <v-carousel-item
              v-for="(img, index) in selectedPhoto.images"
              :key="index"
            >
              <v-img :src="img" cover height="400" />
            </v-carousel-item>
          </v-carousel>
        </div>
        <v-card-title>{{ selectedPhoto?.title }}</v-card-title>

        <v-card-subtitle>{{ selectedPhoto?.date }}</v-card-subtitle>

        <v-card-text v-if="selectedPhoto?.description">
          {{ selectedPhoto.description }}
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" text @click="showModal = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

// Dummy data
const photos = ref([
  {
    id: 1,
    title: 'First Photo',
    date: '2025-02-10',
    description: 'description01',
    images: [
      'https://picsum.photos/600/400?1',
      'https://picsum.photos/600/400?11',
      'https://picsum.photos/600/400?12',
    ],
  },
  {
    id: 2,
    title: 'Second Photo',
    date: '2025-02-09',
    description: 'description02',
    images: ['https://picsum.photos/600/400?2', 'https://picsum.photos/600/400?21'],
  },
  {
    id: 3,
    title: 'Third Photo',
    date: '2025-02-08',
    description: 'description03',
    images: ['https://picsum.photos/600/400?3'],
  },
  {
    id: 4,
    title: 'Fourth Photo',
    date: '2025-02-07',
    description: 'description04',
    images: ['https://picsum.photos/600/400?5'],
  },
])

const showModal = ref(false)
const selectedPhoto = ref(null)
const hovering = ref(false)

function openPhoto(photo) {
  selectedPhoto.value = photo
  showModal.value = true
}

const { smAndUp } = useDisplay()
</script>

<style scoped>
  .cursor-pointer {
    cursor: pointer;
  }
</style>