<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase'
import { collection, doc, setDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore'
import { 
  canViewArtistRoster, 
  getAccessibleArtists, 
  getRoleLabel,
  extractSpotifyArtistId 
} from '@/utils/permissions'
import { validateArtistName, validateSlug } from '@/utils/validators'

const router = useRouter()

// State
const loading = ref(true)
const creating = ref(false)
const artists = ref([])
const userData = ref(null)
const showCreateModal = ref(false)
const createError = ref('')
const platformStats = ref({ total: 0 })

const newArtist = ref({
  name: '',
  spotifyUrl: ''
})

// Computed
const isAdmin = computed(() => userData.value?.userType === 'admin')

// Methods
const loadData = async () => {
  loading.value = true
  
  try {
    // Get current user data
    const user = auth.currentUser
    if (!user) {
      router.push('/login')
      return
    }
    
    // Load user data from users collection
    const userQuery = query(
      collection(db, 'users'),
      where('uid', '==', user.uid)
    )
    const userSnapshot = await getDocs(userQuery)
    
    if (userSnapshot.empty) {
      throw new Error('User data not found')
    }
    
    userData.value = {
      id: userSnapshot.docs[0].id,
      ...userSnapshot.docs[0].data()
    }
    
    // Check permissions
    if (!canViewArtistRoster(userData.value)) {
      router.push('/discover')
      return
    }
    
    // Load accessible artists
    artists.value = await getAccessibleArtists(userData.value)
    
    // Load platform stats for admins
    if (isAdmin.value) {
      const allArtistsSnapshot = await getDocs(collection(db, 'artistProfiles'))
      platformStats.value.total = allArtistsSnapshot.size
    }
    
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const formatSlug = (name) => {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const createArtist = async () => {
  creating.value = true
  createError.value = ''
  
  try {
    // Validate artist name
    const nameValidation = validateArtistName(newArtist.value.name)
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error)
    }
    
    // Generate and validate slug
    const slug = formatSlug(newArtist.value.name)
    const slugValidation = validateSlug(slug)
    if (!slugValidation.isValid) {
      throw new Error(slugValidation.error)
    }
    
    // Extract Spotify ID if URL provided
    let spotifyArtistId = null
    if (newArtist.value.spotifyUrl) {
      spotifyArtistId = extractSpotifyArtistId(newArtist.value.spotifyUrl)
      if (!spotifyArtistId) {
        throw new Error('Invalid Spotify URL')
      }
    }
    
    // Create artist profile
    const artistId = doc(collection(db, 'artistProfiles')).id
    const artistData = {
      name: newArtist.value.name.trim(),
      customSlug: slug,
      createdBy: userData.value.uid,
      createdAt: serverTimestamp(),
      platform: '4track',
      hasPublicMedley: false,
      spotifyArtistId,
      genre: null,
      bio: null,
      paypalEmail: null,
      profileImageUrl: null
    }
    
    await setDoc(doc(db, 'artistProfiles', artistId), artistData)
    
    // Add to local list
    artists.value.unshift({
      id: artistId,
      ...artistData,
      role: userData.value.userType,
      createdAt: new Date()
    })
    
    // Reset form and close modal
    newArtist.value = { name: '', spotifyUrl: '' }
    showCreateModal.value = false
    
    // Navigate to medley management
    router.push(`/artist/${artistId}/medley`)
    
  } catch (error) {
    createError.value = error.message || 'Failed to create artist'
  } finally {
    creating.value = false
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createError.value = ''
  newArtist.value = { name: '', spotifyUrl: '' }
}

const viewPublicPage = (artist) => {
  window.open(`/${artist.customSlug}`, '_blank')
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="artist-roster">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">
          <font-awesome-icon :icon="['fas', 'users']" class="mr-sm" />
          Artist Roster
        </h1>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <font-awesome-icon :icon="['fas', 'plus']" />
          Add Artist
        </button>
      </div>

      <!-- Stats Summary -->
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-value">{{ artists.length }}</div>
          <div class="stat-label">Total Artists</div>
        </div>
        <div v-if="isAdmin" class="stat-item">
          <div class="stat-value">{{ platformStats.total }}</div>
          <div class="stat-label">Platform Total</div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading artists...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="artists.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'music']" class="empty-icon" />
        <h3>No Artists Yet</h3>
        <p>{{ isAdmin ? 'No artists have been created on the platform.' : 'You don\'t have access to any artists yet.' }}</p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <font-awesome-icon :icon="['fas', 'plus']" />
          Create Your First Artist
        </button>
      </div>

      <!-- Artists Grid -->
      <div v-else class="artists-grid">
        <div v-for="artist in artists" :key="artist.id" class="artist-card card-clickable">
          <div class="artist-card-header">
            <img 
              v-if="artist.profileImageUrl" 
              :src="artist.profileImageUrl" 
              :alt="artist.name"
              class="artist-image"
            />
            <div v-else class="artist-image-placeholder">
              <font-awesome-icon :icon="['fas', 'user']" />
            </div>
            <div class="artist-info">
              <h3 class="artist-name">{{ artist.name }}</h3>
              <p class="artist-genre">{{ artist.genre || 'Independent Artist' }}</p>
            </div>
          </div>
          
          <div class="artist-meta">
            <span class="badge" :class="`badge-${artist.role}`">
              {{ getRoleLabel(artist.role) }}
            </span>
            <span v-if="artist.hasPublicMedley" class="badge badge-success">
              <font-awesome-icon :icon="['fas', 'check']" />
              Public Medley
            </span>
          </div>
          
          <div class="artist-actions">
            <router-link 
              :to="`/studio/${artist.id}`" 
              class="btn btn-sm btn-primary"
            >
              <font-awesome-icon :icon="['fas', 'music']" />
              Studio
            </router-link>
            <router-link 
              :to="`/artist/${artist.id}/medley`" 
              class="btn btn-sm btn-outline"
            >
              <font-awesome-icon :icon="['fas', 'edit']" />
              Manage
            </router-link>
            <button 
              v-if="artist.customSlug && artist.hasPublicMedley"
              @click="viewPublicPage(artist)" 
              class="btn btn-sm btn-secondary"
            >
              <font-awesome-icon :icon="['fas', 'external-link-alt']" />
              View
            </button>
          </div>
        </div>
      </div>

      <!-- Create Artist Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <div class="modal">
          <div class="modal-header">
            <h3>Create New Artist</h3>
            <button @click="closeCreateModal" class="close-btn">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
          
          <form @submit.prevent="createArtist" class="modal-content">
            <div class="form-group">
              <label class="form-label">Artist Name *</label>
              <input
                v-model="newArtist.name"
                type="text"
                class="form-input"
                placeholder="Enter artist name"
                required
              />
              <p class="form-hint">This will be their public display name</p>
            </div>

            <div class="form-group">
              <label class="form-label">Spotify Artist URL</label>
              <input
                v-model="newArtist.spotifyUrl"
                type="text"
                class="form-input"
                placeholder="https://open.spotify.com/artist/..."
              />
              <p class="form-hint">Optional: Import artist data from Spotify</p>
            </div>

            <div v-if="createError" class="error-message">
              {{ createError }}
            </div>
          </form>
          
          <div class="modal-footer">
            <button @click="closeCreateModal" class="btn btn-secondary">
              Cancel
            </button>
            <button 
              @click="createArtist" 
              class="btn btn-primary"
              :disabled="creating || !newArtist.name"
            >
              <font-awesome-icon v-if="creating" :icon="['fas', 'spinner']" class="fa-spin mr-sm" />
              {{ creating ? 'Creating...' : 'Create Artist' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.artist-roster {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 2rem;
  color: var(--text-primary);
  margin: 0;
}

/* Stats Row */
.stats-row {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-item {
  background: var(--bg-card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  text-align: center;
  min-width: 150px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.artist-card {
  background: var(--bg-card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.artist-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.artist-card-header {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.artist-image {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.artist-image-placeholder {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 1.5rem;
}

.artist-info {
  flex: 1;
}

.artist-name {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.artist-genre {
  margin: var(--spacing-xs) 0 0 0;
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.artist-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.badge-admin {
  background: var(--color-danger);
}

.badge-label {
  background: var(--color-primary);
}

.badge-manager {
  background: var(--color-warning);
  color: var(--text-primary);
}

.artist-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: var(--spacing-md);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-primary);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error Message */
.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-md);
}

/* Utilities */
.mr-sm { margin-right: var(--spacing-sm); }

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .stats-row {
    justify-content: center;
  }
  
  .artists-grid {
    grid-template-columns: 1fr;
  }
  
  .artist-actions {
    width: 100%;
  }
  
  .artist-actions .btn {
    flex: 1;
  }
}
</style>