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
          <v-img v-if="photo.images && photo.images.length" :src="photo.images[0]" class="gallery-image" />
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
              <v-carousel-item v-for="(img, index) in selectedPhoto.images || []" :key="index">
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
            <v-btn variant="text" color="red" v-if="isAdmin" @click="deleteConfirm = true">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="deleteConfirm" max-width="400">
        <v-card>
          <v-card-title class="text-h6">削除しますか</v-card-title>
          <v-card-text>この画像を削除しますか？</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="deleteConfirm = false">Cancel</v-btn>
            <v-btn color="red" variant="text" @click="confirmDelete">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>

    <v-dialog v-model="formModal" max-width="600">
      <v-card>
        <v-card-title>{{ isEditMode ? 'Edit Photo' : 'Upload Photo' }}</v-card-title>
        <v-form ref="formRef" v-model="isFormValid">
          <v-card-text>
            <v-text-field v-model="form.title" label="Title" :rules="[requiredRule]" />
            <v-text-field v-model="form.date" label="Date" type="date" :rules="[requiredRule]" />
            <v-textarea v-model="form.description" label="Description" />
            <v-file-input v-model="form.file" label="Upload Image" accept="image/*" :rules="[fileRequiredRule]" />
            <v-combobox
              v-model="form.tags"
              v-model:search="tagSearch"
              :items="filteredTagOptions"
              label="Tags"
              multiple
              chips
              clearable
              attach="body"
              :menu-props="{ location: 'bottom', maxHeight: 80 }"
              :rules="[requiredRule]"
            />
          </v-card-text>
        </v-form>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelForm">Cancel</v-btn>
          <v-btn color="primary" variant="text" :disabled="!isFormValid" @click="savePhoto">Save</v-btn>
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
  const deleteConfirm = ref(false)
  const isEditMode = ref(false)

  const selectedTag = ref(null)
  const tagSearch = ref('')

  const formRef = ref(null)
  const isFormValid = ref(false)

  const { smAndUp } = useDisplay()
  const auth = useAuthStore()
  const isAdmin = computed(() => auth.isAdmin)

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
    file: null,
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
      file: null,
      tags: [],
    }
  }

  const requiredRule = value => {
    if (Array.isArray(value)) {
      return value.length > 0 || 'Required field'
    }
    return !!value || 'Required field'
  }

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
        'https://picsum.photos/300/500?2',
        'https://picsum.photos/600/400?21',
      ],
      tags: ['travel', 'summer'],
    },
    {
      id: 3,
      title: 'Third Photo',
      date: '2025-02-08',
      description: 'description03',
      images: ['https://picsum.photos/300/500?8'],
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
    {
      id: 5,
      title: 'Second Photo',
      date: '2025-02-09',
      description: 'description02',
      images: [
        'https://picsum.photos/300/500?2',
        'https://picsum.photos/600/400?21',
      ],
      tags: ['travel', 'summer'],
    },
  ])

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
    if (!form.value.file) return alert('Please select a file')

    let imageUrls = [...form.value.images]

    if (form.value.file) {
      const url = await uploadPhotoFile(form.value.file)
      if (!url) return alert('Upload failed')
      imageUrls.push(url)
    }

    const photo = {
      title: form.value.title,
      date: form.value.date,
      description: form.value.description,
      images: imageUrls,
      tags: form.value.tags,
    }

    async function savePhoto() {
      if (!formRef.value.validate()) return

      let imageUrls = [...form.value.images]

      if (form.value.file) {
        const url = await uploadPhotoFile(form.value.file)
        if (!url) return alert('Upload failed')
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
        await supabase
          .from('photos')
          .update(photo)
          .eq('id', form.value.id)
      } else {
        await supabase
          .from('photos')
          .insert(photo)
      }

      photos.value = await fetchPhotos()
      formModal.value = false
      resetForm()
    }


    await savePhotoToDB(photo)
    photos.value = await fetchPhotos()
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

  async function uploadPhotoFile(file) {
    const fileName = `${Date.now()}_${encodeURIComponent(file.name)}`

    const { error } = await supabase.storage
      .from('photo_archive')
      .upload(fileName, file)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data } = supabase.storage
      .from('photo_archive')
      .getPublicUrl(fileName)

    return data.publicUrl
  }


  async function savePhotoToDB(photo) {
    const { data, error } = await supabase
      .from('photos')
      .insert([photo])

    console.log('DB insert result:', data)
    console.log('DB insert error:', error)

    if (error) throw error
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
</style>

