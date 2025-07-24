<template>
  <div class="medley-manager">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="text-secondary">Loading medley manager...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">{{ error }}</div>
      <router-link to="/studio" class="btn btn-secondary">
        Back to Studio
      </router-link>
    </div>

    <!-- Medley Manager -->
    <div v-else>
      <div class="page-header">
        <h1>
          <font-awesome-icon :icon="['fas', 'music']" />
          Medley Manager
        </h1>
        <p class="subtitle">Add up to 4 tracks for fans to discover</p>
      </div>

      <!-- Track Slots -->
      <div class="track-slots">
        <div 
          v-for="(slot, index) in 4" 
          :key="index"
          class="track-slot"
          :class="{ 'filled': tracks[index], 'empty': !tracks[index] }"
        >
          <!-- Filled Slot -->
          <div v-if="tracks[index]" class="track-content">
            <img 
              v-if="tracks[index].artworkUrl" 
              :src="tracks[index].artworkUrl" 
              :alt="tracks[index].title"
              class="track-artwork"
            />
            <div v-else class="artwork-placeholder">
              <font-awesome-icon :icon="['fas', 'music']" />
            </div>
            <div class="track-details">
              <h3>{{ tracks[index].title }}</h3>
              <p>${{ tracks[index].price.toFixed(2) }}</p>
            </div>
            <button 
              @click="editTrack(tracks[index])"
              class="btn-edit"
            >
              <font-awesome-icon :icon="['fas', 'edit']" />
            </button>
            <button 
              @click="deleteTrack(tracks[index])"
              class="btn-delete"
            >
              <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
          </div>
          
          <!-- Empty Slot -->
          <button 
            v-else 
            @click="addTrack(index)"
            class="empty-slot-btn"
          >
            <font-awesome-icon :icon="['fas', 'plus']" />
            <span>Add Track</span>
          </button>
        </div>
      </div>

      <!-- Public Link -->
      <div v-if="artist?.customSlug && tracks.length > 0" class="public-link-section">
        <h2>Share Your Medley</h2>
        <div class="link-display">
          <code>{{ publicUrl }}</code>
          <button @click="copyLink" class="btn btn-primary">
            <font-awesome-icon :icon="['fas', 'copy']" />
            Copy
          </button>
        </div>
      </div>

      <!-- Add/Edit Track Modal -->
      <div v-if="showTrackModal" class="modal-overlay" @click="closeModal">
        <div class="modal modal-lg" @click.stop>
          <div class="modal-header">
            <h3>
              <font-awesome-icon :icon="editingTrack ? ['fas', 'edit'] : ['fas', 'plus']" />
              {{ editingTrack ? 'Edit Track' : 'Add Track' }}
            </h3>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          
          <div class="modal-content">
            <form @submit.prevent="saveTrack">
              <!-- Track Title -->
              <div class="form-group">
                <label class="form-label">Track Title *</label>
                <input
                  v-model="trackForm.title"
                  type="text"
                  class="form-input"
                  placeholder="Enter track title"
                  required
                />
              </div>

              <!-- Track Description -->
              <div class="form-group">
                <label class="form-label">Description (Optional)</label>
                <textarea
                  v-model="trackForm.description"
                  class="form-input"
                  rows="3"
                  placeholder="Brief description"
                ></textarea>
              </div>

              <!-- Price and Download Settings -->
              <div class="grid grid-2 gap-md">
                <div class="form-group">
                  <label class="form-label">Price ($)</label>
                  <input
                    v-model.number="trackForm.price"
                    type="number"
                    step="0.50"
                    min="0"
                    max="10"
                    class="form-input"
                  />
                  <p class="form-hint">$0 = Free download, max $10</p>
                </div>

                <div class="form-group">
                  <label class="form-label">Download Option</label>
                  <label class="checkbox-label">
                    <input
                      v-model="trackForm.allowDownload"
                      type="checkbox"
                    />
                    <span>Allow download after purchase</span>
                  </label>
                  <p class="form-hint">Unchecked = Stream only</p>
                </div>
              </div>

              <!-- Audio File -->
              <div class="form-group">
                <label class="form-label">
                  Audio File {{ editingTrack ? '(Leave empty to keep current)' : '*' }}
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  @change="handleAudioFileSelect"
                  class="form-input"
                  ref="audioFileInput"
                />
                <p class="form-hint">Maximum file size: 200MB</p>
              </div>

              <!-- Artwork File -->
              <div class="form-group">
                <label class="form-label">
                  Artwork {{ editingTrack ? '(Leave empty to keep current)' : '*' }}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleArtworkFileSelect"
                  class="form-input"
                  ref="artworkFileInput"
                />
                <p class="form-hint">Maximum file size: 20MB</p>
              </div>

              <!-- Error Message -->
              <div v-if="modalError" class="error-message">
                {{ modalError }}
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button type="button" @click="closeModal" class="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" class="fa-spin mr-sm" />
                  {{ saving ? 'Saving...' : (editingTrack ? 'Save Changes' : 'Add Track') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth, db, storage } from '@/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc as firestoreDeleteDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage'
import { validateAudioFile, validateImageFile, validateTrackMetadata } from '@/utils/validators'
import { formatFileSize } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const error = ref('')
const artist = ref(null)
const tracks = ref([])
const showTrackModal = ref(false)
const editingTrack = ref(null)
const saving = ref(false)
const modalError = ref('')

// Refs
const audioFileInput = ref(null)
const artworkFileInput = ref(null)

// Form state
const trackForm = ref({
  title: '',
  description: '',
  price: 0,
  allowDownload: true,
  audioFile: null,
  artworkFile: null,
  order: 0
})

// Computed
const publicUrl = ref('')

// Constants
const MAX_AUDIO_SIZE = 200 * 1024 * 1024 // 200MB
const MAX_ARTWORK_SIZE = 20 * 1024 * 1024 // 20MB

onMounted(async () => {
  await loadArtistAndTracks()
})

const loadArtistAndTracks = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const user = auth.currentUser
    if (!user) {
      router.push('/login')
      return
    }
    
    const artistId = route.params.artistId
    
    // Load artist
    const artistDoc = await getDoc(doc(db, 'artistProfiles', artistId))
    
    if (!artistDoc.exists()) {
      throw new Error('Artist not found')
    }
    
    const artistData = artistDoc.data()
    
    // Check if user has access
    if (artistData.createdBy !== user.uid) {
      throw new Error('You do not have permission to manage this artist')
    }
    
    artist.value = { id: artistDoc.id, ...artistData }
    
    // Set public URL
    if (artist.value.customSlug) {
      publicUrl.value = `${window.location.origin}/${artist.value.customSlug}`
    }
    
    // Load tracks
    await loadArtistTracks()
    
  } catch (err) {
    console.error('Error loading data:', err)
    error.value = err.message || 'Failed to load medley data'
  } finally {
    loading.value = false
  }
}

const loadArtistTracks = async () => {
  if (!artist.value) return
  
  try {
    const tracksQuery = query(
      collection(db, 'medleyTracks'),
      where('artistId', '==', artist.value.id),
      orderBy('order', 'asc')
    )
    
    const tracksSnapshot = await getDocs(tracksQuery)
    tracks.value = tracksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error loading tracks:', err)
  }
}

const addTrack = (index) => {
  trackForm.value = {
    title: '',
    description: '',
    price: 0,
    allowDownload: true,
    audioFile: null,
    artworkFile: null,
    order: index
  }
  editingTrack.value = null
  showTrackModal.value = true
}

const editTrack = (track) => {
  trackForm.value = {
    title: track.title,
    description: track.description || '',
    price: track.price || 0,
    allowDownload: track.allowDownload !== false,
    audioFile: null,
    artworkFile: null,
    order: track.order
  }
  editingTrack.value = track
  showTrackModal.value = true
}

const deleteTrack = async (track) => {
  if (!confirm(`Delete "${track.title}"?`)) return
  
  try {
    // Delete from Firestore
    await firestoreDeleteDoc(doc(db, 'medleyTracks', track.id))
    
    // Delete files from storage
    if (track.audioPath) {
      try {
        await deleteObject(storageRef(storage, track.audioPath))
      } catch (err) {
        console.warn('Could not delete audio file:', err)
      }
    }
    
    if (track.artworkPath) {
      try {
        await deleteObject(storageRef(storage, track.artworkPath))
      } catch (err) {
        console.warn('Could not delete artwork:', err)
      }
    }
    
    // Update artist if no tracks remain
    if (tracks.value.length === 1) {
      await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
        hasPublicMedley: false
      })
    }
    
    // Reload tracks
    await loadArtistTracks()
  } catch (err) {
    console.error('Error deleting track:', err)
    alert('Failed to delete track')
  }
}

const handleAudioFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const validation = validateAudioFile(file)
  if (!validation.isValid) {
    modalError.value = validation.error
    event.target.value = ''
    return
  }
  
  trackForm.value.audioFile = file
  modalError.value = ''
}

const handleArtworkFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const validation = validateImageFile(file)
  if (!validation.isValid) {
    modalError.value = validation.error
    event.target.value = ''
    return
  }
  
  trackForm.value.artworkFile = file
  modalError.value = ''
}

const uploadFile = async (file, path) => {
  const fileRef = storageRef(storage, path)
  const uploadTask = uploadBytesResumable(fileRef, file)
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      null,
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadURL)
      }
    )
  })
}

const saveTrack = async () => {
  // Validate
  const validation = validateTrackMetadata(trackForm.value)
  if (!validation.isValid) {
    modalError.value = validation.errors.join('. ')
    return
  }
  
  if (!editingTrack.value && (!trackForm.value.audioFile || !trackForm.value.artworkFile)) {
    modalError.value = 'Audio and artwork files are required'
    return
  }
  
  saving.value = true
  modalError.value = ''
  
  try {
    const user = auth.currentUser
    const trackData = {
      title: trackForm.value.title.trim(),
      description: trackForm.value.description.trim(),
      price: parseFloat(trackForm.value.price) || 0,
      allowDownload: trackForm.value.allowDownload,
      order: trackForm.value.order,
      artistId: artist.value.id,
      artistName: artist.value.name,
      updatedAt: serverTimestamp()
    }
    
    // Upload files if provided
    if (trackForm.value.audioFile) {
      const audioPath = `${user.uid}/medley/${artist.value.id}/audio/${Date.now()}_${trackForm.value.audioFile.name}`
      trackData.audioUrl = await uploadFile(trackForm.value.audioFile, audioPath)
      trackData.audioPath = audioPath
      trackData.audioFilename = trackForm.value.audioFile.name
      trackData.audioSize = trackForm.value.audioFile.size
    }
    
    if (trackForm.value.artworkFile) {
      const artworkPath = `${user.uid}/medley/${artist.value.id}/artwork/${Date.now()}_${trackForm.value.artworkFile.name}`
      trackData.artworkUrl = await uploadFile(trackForm.value.artworkFile, artworkPath)
      trackData.artworkPath = artworkPath
    }
    
    if (editingTrack.value) {
      // Update existing
      await updateDoc(doc(db, 'medleyTracks', editingTrack.value.id), trackData)
    } else {
      // Create new
      trackData.createdAt = serverTimestamp()
      trackData.createdBy = user.uid
      await addDoc(collection(db, 'medleyTracks'), trackData)
    }
    
    // Mark artist as having public medley
    if (tracks.value.length === 0 || (!editingTrack.value && tracks.value.length === 0)) {
      await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
        hasPublicMedley: true
      })
    }
    
    await loadArtistTracks()
    closeModal()
  } catch (err) {
    console.error('Error saving track:', err)
    modalError.value = 'Failed to save track. Please try again.'
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showTrackModal.value = false
  editingTrack.value = null
  modalError.value = ''
  trackForm.value = {
    title: '',
    description: '',
    price: 0,
    allowDownload: true,
    audioFile: null,
    artworkFile: null,
    order: 0
  }
  // Clear file inputs
  if (audioFileInput.value) audioFileInput.value.value = ''
  if (artworkFileInput.value) artworkFileInput.value.value = ''
}

const copyLink = () => {
  navigator.clipboard.writeText(publicUrl.value)
  // You could add a toast notification here
  alert('Link copied to clipboard!')
}
</script>

<style scoped>
.medley-manager {
  min-height: 100vh;
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
}

/* Loading and Error States */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--spacing-md);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid var(--border-primary);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* Track Slots */
.track-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.track-slot {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  min-height: 300px;
  box-shadow: var(--shadow-sm);
  position: relative;
}

.track-slot.filled {
  padding: 0;
}

.empty-slot-btn {
  width: 100%;
  height: 100%;
  background: transparent;
  border: 3px dashed var(--border-primary);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  color: var(--text-secondary);
}

.empty-slot-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--bg-hover);
}

.empty-slot-btn svg {
  font-size: 3rem;
}

/* Track Content */
.track-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.track-artwork,
.artwork-placeholder {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.artwork-placeholder {
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--text-muted);
}

.track-details {
  padding: var(--spacing-md);
  flex: 1;
}

.track-details h3 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.track-details p {
  color: var(--color-primary);
  font-weight: 600;
  margin: 0;
}

.btn-edit,
.btn-delete {
  position: absolute;
  top: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-edit {
  right: calc(var(--spacing-sm) + 44px);
}

.btn-delete {
  right: var(--spacing-sm);
}

.btn-edit:hover,
.btn-delete:hover {
  transform: scale(1.1);
}

.btn-delete:hover {
  background: var(--color-danger);
}

/* Public Link Section */
.public-link-section {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.public-link-section h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

.link-display {
  display: flex;
  gap: var(--spacing-md);
  max-width: 600px;
  margin: 0 auto;
}

.link-display code {
  flex: 1;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  overflow-x: auto;
}

/* Modal */
.modal-lg {
  max-width: 600px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-xl);
}

.modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

.modal-content {
  padding: var(--spacing-lg);
  overflow-y: auto;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

/* Form */
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.grid {
  display: grid;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.gap-md {
  gap: var(--spacing-md);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.mr-sm {
  margin-right: var(--spacing-sm);
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .track-slots {
    grid-template-columns: 1fr;
  }
  
  .link-display {
    flex-direction: column;
  }
  
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>