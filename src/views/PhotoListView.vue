<template>
  <div class="page-background">
    <v-container class="py-1">
      <v-row class="mb-2">
        <v-col class="text-left pa-1">
          <v-btn color="success" small @click="loginAsAdmin">
            Login as Admin
          </v-btn>
          <v-btn color="grey" small @click="logout">
            Logout
          </v-btn>
        </v-col>
        <v-col class="text-right pa-1">
          <v-btn color="primary" v-if="isAdmin" @click="openCreateModal">
            Upload Photo
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-2" />

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
      <div class="gallery">
        <v-card
          v-for="photo in filteredPhotos"
          :key="photo.id"
          class="photo-card cursor-pointer"
          elevation="2"
          @click="openPhoto(photo)"
        >
          <v-img v-if="photo.images?.length" :src="photo.images[0]" class="gallery-image" />
          <v-card-title class="text-h6">{{ photo.title }}</v-card-title>
          <v-card-subtitle class="text-subtitle-1">{{ photo.date }}</v-card-subtitle>
        </v-card>
      </div>

      <v-dialog v-model="showModal" persistent scrollable width="auto">
        <v-card v-if="selectedPhoto" class="modal-card">
          <div @mouseenter="hovering = true" @mouseleave="hovering = false">
            <v-carousel
              hide-delimiters
              :show-arrows="showArrows"
              :cycle="false"
              :continuous="false"
              class="modal-carousel"
            >
              <v-carousel-item v-for="(img, index) in selectedPhoto.images" :key="index">
                <div class="modal-image-wrapper">
                  <img :src="img" class="modal-image" />
                </div>
              </v-carousel-item>
            </v-carousel>
          </div>

          <v-card-title>{{ selectedPhoto.title }}</v-card-title>
          <v-card-subtitle>{{ selectedPhoto.date }}</v-card-subtitle>

          <v-card-text v-if="selectedPhoto.description">{{ selectedPhoto.description }}</v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" variant="text" @click="closeModal">Close</v-btn>
            <v-btn variant="text" v-if="isAdmin" @click="editPhoto">Edit</v-btn>
            <v-btn variant="text" color="red" v-if="isAdmin" @click="modalClose = true">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="modalClose" max-width="400">
        <v-card>
          <v-card-title class="text-h6">削除しますか</v-card-title>
          <v-card-text>この画像を削除しますか？</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="modalClose = false">Cancel</v-btn>
            <v-btn color="red" variant="text" @click="deletePhoto">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>

    <v-dialog v-model="formModal" persistent max-width="600">
      <v-card>
        <v-card-title>{{ isEditMode ? 'Edit Photo' : 'Upload Photo' }}</v-card-title>
        <v-form ref="formRef" v-model="isFormValid">
          <v-card-text>
            <v-text-field v-model="form.title" label="Title" :rules="[requiredRule]" />
            <v-text-field v-model="form.date" label="Date" type="date" :rules="[requiredRule]" />
            <v-textarea v-model="form.description" label="Description" />
            <v-file-input
              v-model="form.files"
              label="Upload Images"
              accept="image/*"
              multiple
              :rules="[fileRule]"
            />
            <div v-if="form.images.length">
              <div
                v-for="(img, index) in form.images"
                :key="index"
                class="edit-image-wrapper"
              >
              <img :src="img" class="edit-thumbnail" />
              <v-btn
                icon
                size="x-small"
                color="red"
                class="delete-btn"
                @click="removeImage(index)"
              >
                <v-icon size="15">mdi-close</v-icon>
              </v-btn>
              </div>
            </div>
            <v-combobox
              v-model="form.tags"
              v-model:search="tagSearch"
              :items="filteredTagOptions"
              label="Tags"
              multiple
              chips
              clearable
              location-strategy="connected"
              :menu-props="{ location: 'bottom', maxHeight: 80 }"
              :rules="[requiredRule]"
            />
          </v-card-text>
        </v-form>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelForm">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="text"
            :disabled="!isFormValid|| isSaving"
            :loading="isSaving"
            @click="savePhoto"
            >
              Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useAuthStore } from '@/stores/auth.js'
  import { supabase } from '@/supabase.js'

  const showModal = ref(false)
  const selectedPhoto = ref(null)
  const hovering = ref(false)
  const formModal = ref(false)
  const modalClose = ref(false)
  const isEditMode = ref(false)

  const selectedTag = ref(null)
  const tagSearch = ref('')

  const formRef = ref(null)
  const isFormValid = ref(false)
  const isSaving = ref(false)

  const { smAndUp } = useDisplay()
  const auth = useAuthStore()
  const isAdmin = computed(() => auth.isAdmin)
  const photos = ref([])

  onMounted(async () => {
    auth.loadUser()
    photos.value = await fetchPhotos()
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
    files: [],
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
      files: [],
      tags: [],
    }
  }

  const requiredRule = value => {
    if (Array.isArray(value)) {
      return value.length > 0 || 'Required field'
    }
    return !!value || 'Required field'
  }

  const fileRule = (files) => {
    const existingCount = form.value.images.length
    const newCount = files?.length || 0

    if (existingCount + newCount > 3) {
      return '画像は最大3枚までです'
    }

    return true
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

    const imagePromises = photo.images.map(src => {
      return new Promise(resolve => {
        const img = new Image()
        img.src = src
        img.onload = resolve
      })
    })

    Promise.all(imagePromises).then(() => {
      showModal.value = true
    })
  }

  // 閉じる
  function closeModal() {
    showModal.value = false
    selectedPhoto.value = null
  }

  // アップロード、修正保存
  async function savePhoto() {
    if (!formRef.value.validate()) return

    const totalImageCount =
      form.value.images.length + form.value.files.length

    if (totalImageCount === 0) {
      alert('画像は最低1枚必要です')
      return
    }

    if (totalImageCount > 3) {
      alert('画像は最大3枚までです')
      return
    }

    isSaving.value = true

    try {
      let imageUrls = [...form.value.images]

      for (const file of form.value.files) {
        const url = await uploadPhotoFile(file)
        if (!url) throw new Error('savePhoto error')
        imageUrls.push(url)
      }

      const photo = {
        title: form.value.title,
        date: form.value.date,
        description: form.value.description,
        images: imageUrls,
        tags: form.value.tags,
      }

      if (form.value.id) {
        await supabase.from('photos').update(photo).eq('id', form.value.id)
      } else {
        await supabase.from('photos').insert(photo)
      }

      photos.value = await fetchPhotos()
      formModal.value = false
      resetForm()

    } catch (err) {
      alert(err.message)
    } finally {
      isSaving.value = false
    }
  }

  async function uploadPhotoFile(file) {
    const fileName = `${Date.now()}_${encodeURIComponent(file.name)}`

    const { error } = await supabase.storage
      .from('photo_archive')
      .upload(fileName, file)

    if (error) {
      console.error('uploadPhotoFile error:', error)
      return null
    }

    const { data } = supabase.storage
      .from('photo_archive')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  function formatTag(tag) {
    tag.replace(/\b\w/g, char => char.toUpperCase());
  }

  function removeImage(index) {
    form.value.images.splice(index, 1)
  }

  // 編集
  function editPhoto() {
    isEditMode.value = true

    form.value = {
      id: selectedPhoto.value.id,
      title: selectedPhoto.value.title,
      date: selectedPhoto.value.date,
      description: selectedPhoto.value.description,
      images: [...selectedPhoto.value.images],
      files: [],
      tags: [...(selectedPhoto.value.tags || [])],
    }

    showModal.value = false
    formModal.value = true
  }

  // 削除
  async function deletePhoto() {
    if (!selectedPhoto.value?.id) return

    try {
      const paths = selectedPhoto.value.images.map(url => {
        return url.split('/photo_archive/')[1]
      })

      if (paths.length) {
        const { error: storageError } = await supabase.storage
          .from('photo_archive')
          .remove(paths)

        if (storageError) {
          console.error(storageError)
          throw new Error('Storage削除失敗')
        }
      }

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', selectedPhoto.value.id)

      if (dbError) {
        console.error(dbError)
        throw new Error('DB削除失敗')
      }

      photos.value = await fetchPhotos()

    } catch (err) {
      alert(err.message)
      return
    }

    modalClose.value = false
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


  async function fetchPhotos() {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error)
      return []
    }

    return data
  }
</script>

<style scoped>
  .page-background {
    min-height: 100vh;
    background: linear-gradient(135deg, #e8edf5 0%, #cfd8e6 100%);
    padding: 40px 0;
  }

  .gallery {
    column-width: 280px;
    column-gap: 17px;
  }

  .photo-card {
    margin-bottom: 16px;
    break-inside: avoid;
  }

  .modal-carousel {
    height: auto !important;
  }

  .modal-image {
    max-width: 90vw;
    max-height: 85vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }

  .v-card {
    border-radius: 18px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
    transition: all 0.3s ease;
  }

  .v-card:not(.modal-card):hover {
    transform: translateY(-6px);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.12) !important;
  }

  .edit-image-wrapper {
    position: relative;
    display: inline-block;
    margin: 8px;
  }

  .edit-thumbnail {
    width: 100px;
    border-radius: 12px;
  }

  .delete-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background: white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    opacity: 0;
    transition: 0.2s;
  }

  .edit-image-wrapper:hover .delete-btn {
    opacity: 1;
  }
</style>

