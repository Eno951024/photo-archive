<template>
  <v-container class="py-0">
    <v-row class="mb-2">
      <v-col class="text-left">
        <v-btn color="success" small @click="loginAsAdmin">
          Login as Admin
        </v-btn>
        <v-btn color="grey" small @click="logout">
          Logout
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col class="text-right">
        <v-btn color="primary" v-if="isAdmin" @click="openCreateModal">
          Upload Photo
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-chip
          v-for="tag in allTags"
          :key="tag.name"
          class="ma-1"
          :color="selectedTag === tag.name ? 'primary' : undefined"
          @click="toggleTag(tag.name)"
        >
          {{ formatTag(tag.name) }} ({{ tag.count }})
        </v-chip>
      </v-col>
    </v-row>
  </v-container>
  <v-container class="py-4">
    <v-row dense>
      <v-col
        v-for="photo in filteredPhotos"
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
          <v-card-title class="text-h6">
            {{ photo.title }}
          </v-card-title>
          <v-card-subtitle class="text-subtitle-1">
            {{ photo.date }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog
      v-model="showModal"
      max-width="700"
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card v-if="selectedPhoto" class="modal-card">
        <div
          @mouseenter="hovering = true"
          @mouseleave="hovering = false"
        >
          <v-carousel
            height="400"
            hide-delimiter-background
            :show-arrows="showArrows"
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

        <v-card-title>
          {{ selectedPhoto.title }}
        </v-card-title>

        <v-card-subtitle>
          {{ selectedPhoto.date }}
        </v-card-subtitle>

        <v-card-text v-if="selectedPhoto.description">
          {{ selectedPhoto.description }}
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="closeModal">
            Close
          </v-btn>

          <v-btn variant="text" v-if="isAdmin" @click="editPhoto">
            Edit
          </v-btn>
          <v-btn
            variant="text"
            color="red"
            v-if="isAdmin"
            @click="deleteConfirm = true"
          >
            Delete
          </v-btn>
        </v-card-actions>

      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteConfirm" max-width="400">
        <v-card>
          <v-card-title class="text-h6">
            削除しますか
          </v-card-title>
          <v-card-text>
            この画像を削除しますか？
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              @click="deleteConfirm = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="red"
              variant="text"
              @click="confirmDelete"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  </v-container>
  <v-dialog v-model="formModal" max-width="600">
    <v-card>
      <v-card-title>
        {{ isEditMode ? 'Edit Photo' : 'Upload Photo' }}
      </v-card-title>
      <v-form ref="formRef" v-model="isFormValid">
        <v-card-text>
          <v-text-field
            v-model="form.title"
            label="Title"
            :rules="[requiredRule]"
          />
          <v-text-field
            v-model="form.date"
            label="Date"
            type="date"
            :rules="[requiredRule]"
          />
          <v-textarea
            v-model="form.description"
            label="Description"
          />
          <v-text-field
            v-model="form.images[0]"
            label="Image URL"
            :rules="[requiredRule]"
          />
          <v-combobox
            v-model="form.tags"
            v-model:search="tagSearch"
            :items="filteredTagOptions"
            label="Tags"
            multiple
            chips
            clearable
            attach="body"
            :menu-props="{
              location: 'bottom',
              maxHeight: 80
            }"
            :rules="[requiredRule]"
          />
        </v-card-text>
      </v-form>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancelForm">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="text"
          :disabled="!isFormValid"
          @click="savePhoto"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useAuthStore } from '@/stores/auth.js'

  const showModal = ref(false)
  const selectedPhoto = ref(null)
  const hovering = ref(false)
  const formModal = ref(false)
  const deleteConfirm = ref(false)
  const isEditMode = ref(false)

  const selectedTag = ref(null)
  const tagSearch = ref('')

  const formRef = ref(null)
  const isFormValid = ref(false)

  const { smAndUp } = useDisplay()

  // ユーザーログイン
  const auth = useAuthStore()
  const isAdmin = computed(() => auth.isAdmin)
  onMounted(() => {
    auth.loadUser()
  })

  function loginAsAdmin() {
    auth.login({ id: 1, name: 'Admin', role: 'admin' })
  }

  function logout() {
    auth.logout()
  }

  // アップロードフォーム
  const form = ref({
    id: null,
    title: '',
    date: '',
    description: '',
    images: [],
    tags: [],
  })

  // フォームリセット
  function resetForm() {
    form.value = {
      id: null,
      title: '',
      date: '',
      description: '',
      images: [],
      tags: [],
    }
  }

  const requiredRule = value => {
    if (Array.isArray(value)) {
      return value.length > 0 || 'Required field'
    }
    return !!value || 'Required field'
  }

  // タグ集計
  const allTags = computed(() => {
    const tagMap = {}

    photos.value.forEach(photo => {
      photo.tags?.forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1
      })
    })

    return Object.entries(tagMap).map(([name, count]) => ({
      name,
      count
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  })

  // タグ自動完成
  const filteredTagOptions = computed(() => {
    if (!tagSearch.value || tagSearch.value.length < 1) return []

    return allTags.value
      .map(t => t.name)
      .filter(tag =>
        tag.includes(tagSearch.value.toLowerCase())
      )
      .filter(tag => !form.value.tags.includes(tag))
      .slice(0, 3)
  })

  function toggleTag(tagName) {
    if (selectedTag.value === tagName) {
      selectedTag.value = null
    } else {
      selectedTag.value = tagName
    }
  }

  // タグフィルタリング
  const filteredPhotos = computed(() => {
    if (!selectedTag.value) return photos.value

    return photos.value.filter(photo =>
      photo.tags?.includes(selectedTag.value)
    )
  })

  // Dummy Data
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
      tags: ['travel', 'spring'],
    },
    {
      id: 2,
      title: 'Second Photo',
      date: '2025-02-09',
      description: 'description02',
      images: [
        'https://picsum.photos/600/400?2',
        'https://picsum.photos/600/400?21',
      ],
      tags: ['travel', 'summer'],
    },
    {
      id: 3,
      title: 'Third Photo',
      date: '2025-02-08',
      description: 'description03',
      images: ['https://picsum.photos/600/400?3'],
      tags: ['travel', 'Autumn'],
    },
    {
      id: 4,
      title: 'Fourth Photo',
      date: '2025-02-07',
      description: 'description04',
      images: ['https://picsum.photos/600/400?5'],
      tags: ['travel', 'winter'],
    },
  ])

  const showArrows = computed(() => {
    if (!selectedPhoto.value) return false
    return (
      hovering.value &&
      selectedPhoto.value.images.length > 1 &&
      smAndUp.value
    )
  })

  // 開く
  function openPhoto(photo) {
    selectedPhoto.value = photo
    showModal.value = true
  }

  // 閉じる
  function closeModal() {
    showModal.value = false
    selectedPhoto.value = null
  }

  // アップロード、修正保存
  function savePhoto() {

    if (!formRef.value.validate()) return

    const normalizedTags = form.value.tags.map(tag =>
      tag.trim().toLowerCase()
    )

    if (isEditMode.value) {

      // 修正
      const index = photos.value.findIndex(
        p => p.id === form.value.id
      )

      if (index !== -1) {
        photos.value[index] = {
          ...form.value,
          tags: normalizedTags
        }
      }
    } else {
      
      // アップロード
      photos.value.push({
        ...form.value,
        id: Date.now(),
        tags: normalizedTags
      })
    }

    formModal.value = false
    resetForm()
  }


  function formatTag(tag) {
    return tag.charAt(0).toUpperCase() + tag.slice(1)
  }

  // 編集
  function editPhoto() {
    isEditMode.value = true
    form.value = { ...selectedPhoto.value }
    showModal.value = false
    formModal.value = true
  }

  // 削除
  function confirmDelete() {
    photos.value = photos.value.filter(
      p => p.id !== selectedPhoto.value.id
    )

    deleteConfirm.value = false
    closeModal()
  }

  // 作成
  function openCreateModal() {
    isEditMode.value = false
    resetForm()
    formModal.value = true
  }

  // キャンセル
  function cancelForm() {
    formModal.value = false
    resetForm()
  }
</script>

<style scoped>
  .cursor-pointer {
    cursor: pointer;
  }
</style>
