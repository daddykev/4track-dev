<template>
  <div class="artist-studio">
    <div class="page-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your studio...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <router-link to="/discover" class="btn btn-primary">
          Back to Discover
        </router-link>
      </div>

      <!-- No Artist Profile Yet -->
      <div v-else-if="!artist" class="no-profile">
        <div class="empty-state">
          <font-awesome-icon :icon="['fas', 'microphone-alt']" class="empty-icon" />
          <h2>Set Up Your Artist Profile</h2>
          <p>You're registered as an artist, but you haven't created your profile yet.</p>
          <p>Create your profile to start uploading music and sharing with fans!</p>
          <router-link to="/artist/create" class="btn btn-primary btn-lg">
            <font-awesome-icon :icon="['fas', 'plus']" />
            Create Artist Profile
          </router-link>
        </div>
      </div>

      <!-- Studio Content (when artist profile exists) -->
      <div v-else>
        <!-- Studio Header -->
        <div class="studio-header">
          <div class="artist-info">
            <img 
              v-if="artist.profileImageUrl" 
              :src="artist.profileImageUrl" 
              :alt="artist.name"
              class="artist-avatar"
            />
            <div v-else class="artist-avatar-placeholder">
              <font-awesome-icon :icon="['fas', 'user-music']" />
            </div>
            <div>
              <h1>{{ artist.name }}'s Studio</h1>
              <p class="artist-genre">{{ artist.genre || 'Independent Artist' }}</p>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'play']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalPlays }}</div>
              <div class="stat-label">Total Plays</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'heart']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalHearts }}</div>
              <div class="stat-label">Hearts</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'download']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalDownloads }}</div>
              <div class="stat-label">Downloads</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'dollar-sign']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">${{ stats.totalRevenue.toFixed(2) }}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
          </div>
        </div>

        <!-- Track Management Section -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">
              <font-awesome-icon :icon="['fas', 'music']" class="section-icon" />
              Medley Tracks
            </h2>
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
        </div>

        <!-- Public Link Section -->
        <div v-if="artist.customSlug && artist.hasPublicMedley" class="section-card">
          <h2>
            <font-awesome-icon :icon="['fas', 'share']" />
            Share Your Medley
          </h2>
          <div class="link-display">
            <code>{{ publicUrl }}</code>
            <button @click="copyLink" class="btn btn-secondary">
              <font-awesome-icon :icon="['fas', 'copy']" />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Getting Started Tips -->
        <div v-if="!artist.hasPublicMedley" class="tips-card">
          <h3>
            <font-awesome-icon :icon="['fas', 'lightbulb']" />
            Getting Started
          </h3>
          <ol>
            <li>Upload your first track to create your medley</li>
            <li>Add up to 4 tracks with custom artwork</li>
            <li>Share your medley link with fans</li>
            <li>Get paid directly via PayPal</li>
          </ol>
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
                  class="form-textarea"
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
              <div class="modal-footer">
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db, storage } from '@/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
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
import { apiService } from '@/services/api'
import { validateAudioFile, validateImageFile, validateTrackMetadata } from '@/utils/validators'

const router = useRouter()

// State
const loading = ref(true)
const error = ref('')
const artist = ref(null)
const tracks = ref([])
const stats = ref({
  totalPlays: 0,
  totalHearts: 0,
  totalDownloads: 0,
  totalRevenue: 0
})
const copied = ref(false)

// Modal state
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
const publicUrl = computed(() => {
  if (!artist.value?.customSlug) return ''
  return `${window.location.origin}/${artist.value.customSlug}`
})

onMounted(async () => {
  await loadArtistData()
})

const loadArtistData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const user = auth.currentUser
    if (!user) {
      router.push('/login')
      return
    }
    
    // Find artist profile for current user
    const artistQuery = query(
      collection(db, 'artistProfiles'),
      where('createdBy', '==', user.uid)
    )
    
    const artistSnapshot = await getDocs(artistQuery)
    
    if (artistSnapshot.empty) {
      // User is an artist but hasn't created a profile yet
      loading.value = false
      return
    }
    
    artist.value = {
      id: artistSnapshot.docs[0].id,
      ...artistSnapshot.docs[0].data()
    }
    
    // Load tracks
    await loadTracks()
    
    // Load analytics
    await loadAnalytics()
    
  } catch (err) {
    console.error('Error loading artist data:', err)
    error.value = 'Failed to load your studio data'
  } finally {
    loading.value = false
  }
}

const loadTracks = async () => {
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

const loadAnalytics = async () => {
  if (!artist.value) return
  
  try {
    const analyticsData = await apiService.getMedleyAnalytics(artist.value.id)
    
    stats.value = {
      totalPlays: analyticsData.totalPlays || 0,
      totalHearts: await getHeartCount(),
      totalDownloads: analyticsData.totalDownloads || 0,
      totalRevenue: analyticsData.totalRevenue || 0
    }
    
  } catch (err) {
    console.error('Error loading analytics:', err)
  }
}

const getHeartCount = async () => {
  try {
    const heartsQuery = query(
      collection(db, 'userCollections'),
      where('artistId', '==', artist.value.id),
      where('type', '==', 'hearted')
    )
    
    const heartsSnapshot = await getDocs(heartsQuery)
    return heartsSnapshot.size
  } catch (err) {
    console.error('Error getting heart count:', err)
    return 0
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
      artist.value.hasPublicMedley = false
    }
    
    // Reload tracks
    await loadTracks()
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
    if (!artist.value.hasPublicMedley) {
      await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
        hasPublicMedley: true
      })
      artist.value.hasPublicMedley = true
    }
    
    await loadTracks()
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

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.artist-studio {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* No Profile State */
.no-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  max-width: 500px;
}

.empty-icon {
  font-size: 5rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  opacity: 0.8;
}

.empty-state h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: 2rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
}

.empty-state p:last-of-type {
  margin-bottom: var(--spacing-xl);
}

/* Studio Header */
.studio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2xl);
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.artist-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.artist-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.artist-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-muted);
}

.artist-info h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 2rem;
}

.artist-genre {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: var(--bg-card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: var(--bg-hover);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: var(--spacing-xs);
}

/* Track Slots */
.track-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.track-slot {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  min-height: 300px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
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

/* Section Cards */
.section-card {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
}

.section-card h2 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: 1.5rem;
}

/* Link Display */
.link-display {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.link-display code {
  flex: 1;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
}

/* Tips Card */
.tips-card {
  background: linear-gradient(135deg, var(--color-primary), #764ba2);
  color: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.tips-card h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-lg) 0;
}

.tips-card ol {
  margin: 0 0 var(--spacing-lg) var(--spacing-lg);
  padding: 0;
}

.tips-card li {
  margin-bottom: var(--spacing-sm);
}

/* Modal Overrides */
.modal-lg {
  max-width: 600px;
}

.modal-footer {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
}

/* Checkbox Label */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

/* Loading */
.loading-container {
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error */
.error-container {
  text-align: center;
  padding: var(--spacing-2xl);
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

/* Utilities */
.mt-md { margin-top: var(--spacing-md); }
.mr-sm { margin-right: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }

/* Animations */
.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .studio-header {
    flex-direction: column;
    gap: var(--spacing-lg);
    text-align: center;
  }
  
  .artist-info {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .track-slots {
    grid-template-columns: 1fr;
  }
  
  .link-display {
    flex-direction: column;
  }
  
  .link-display code {
    word-break: break-all;
  }
  
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: var(--spacing-md);
  }
  
  .studio-header {
    padding: var(--spacing-lg);
  }
  
  .artist-info h1 {
    font-size: 1.5rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>