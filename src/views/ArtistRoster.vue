<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase'
import { collection, doc, setDoc, getDocs, serverTimestamp, query, where, updateDoc } from 'firebase/firestore'
import { 
  canViewArtistRoster, 
  getAccessibleArtists, 
  getRoleLabel,
  extractSpotifyArtistId 
} from '@/utils/permissions'
import { validateArtistName, validateSlug, validatePayPalEmail } from '@/utils/validators'

const router = useRouter()

// State
const loading = ref(true)
const creating = ref(false)
const artists = ref([])
const userData = ref(null)
const showCreateModal = ref(false)
const createError = ref('')
const platformStats = ref({ total: 0 })
const editingPayPal = ref(null)
const payPalEmail = ref('')
const payPalError = ref('')
const savingPayPal = ref(false)

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
    
    // Navigate to studio
    router.push(`/studio/${artistId}`)
    
  } catch (error) {
    createError.value = error.message || 'Failed to create artist'
  } finally {
    creating.value = false
  }
}

const startEditPayPal = (artist) => {
  editingPayPal.value = artist.id
  payPalEmail.value = artist.paypalEmail || ''
  payPalError.value = ''
}

const cancelEditPayPal = () => {
  editingPayPal.value = null
  payPalEmail.value = ''
  payPalError.value = ''
}

const savePayPalEmail = async (artist) => {
  savingPayPal.value = true
  payPalError.value = ''
  
  try {
    // Validate PayPal email if provided
    if (payPalEmail.value) {
      const validation = validatePayPalEmail(payPalEmail.value)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }
    
    // Update artist profile
    await updateDoc(doc(db, 'artistProfiles', artist.id), {
      paypalEmail: payPalEmail.value || null,
      updatedAt: serverTimestamp()
    })
    
    // Update local data
    const artistIndex = artists.value.findIndex(a => a.id === artist.id)
    if (artistIndex !== -1) {
      artists.value[artistIndex].paypalEmail = payPalEmail.value || null
    }
    
    // Close edit mode
    cancelEditPayPal()
    
  } catch (error) {
    payPalError.value = error.message || 'Failed to update PayPal email'
  } finally {
    savingPayPal.value = false
  }
}

const toggleMedleyVisibility = async (artist) => {
  try {
    const newStatus = !artist.hasPublicMedley
    
    // Update Firestore
    await updateDoc(doc(db, 'artistProfiles', artist.id), {
      hasPublicMedley: newStatus,
      updatedAt: serverTimestamp()
    })
    
    // Update local state
    const artistIndex = artists.value.findIndex(a => a.id === artist.id)
    if (artistIndex !== -1) {
      artists.value[artistIndex].hasPublicMedley = newStatus
    }
    
  } catch (error) {
    console.error('Error toggling medley visibility:', error)
    alert('Failed to update medley visibility')
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

// Helper to get badge class based on role
const getBadgeClass = (role) => {
  const roleClasses = {
    'admin': 'badge-danger',
    'label': 'badge-primary', 
    'manager': 'badge-warning'
  }
  return roleClasses[role] || 'badge-secondary'
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
          <font-awesome-icon :icon="['fas', 'users']" />
          Artist Roster
        </h1>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <font-awesome-icon :icon="['fas', 'plus']" />
          Add Artist
        </button>
      </div>

      <!-- Stats Summary -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ artists.length }}</div>
          <div class="stat-label">Total Artists</div>
        </div>
        <div v-if="isAdmin" class="stat-card">
          <div class="stat-value">{{ platformStats.total }}</div>
          <div class="stat-label">Platform Total</div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="text-secondary">Loading artists...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="artists.length === 0" class="empty-state card">
        <font-awesome-icon :icon="['fas', 'music']" class="empty-icon" />
        <h3>No Artists Yet</h3>
        <p class="text-secondary mb-lg">
          {{ isAdmin ? 'No artists have been created on the platform.' : 'You don\'t have access to any artists yet.' }}
        </p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <font-awesome-icon :icon="['fas', 'plus']" />
          Create Your First Artist
        </button>
      </div>

      <!-- Artists Grid -->
      <div v-else class="artists-grid">
        <div v-for="artist in artists" :key="artist.id" class="card">
          <div class="artist-header">
            <img 
              v-if="artist.profileImageUrl" 
              :src="artist.profileImageUrl" 
              :alt="artist.name"
              class="artist-avatar"
            />
            <div v-else class="artist-avatar-placeholder">
              <font-awesome-icon :icon="['fas', 'user']" />
            </div>
            <div class="artist-info">
              <h3 class="artist-name">{{ artist.name }}</h3>
              <p class="artist-genre text-secondary">{{ artist.genre || 'Independent Artist' }}</p>
            </div>
          </div>
          
          <!-- Add toggle switch here -->
          <div class="medley-toggle-row">
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                :checked="artist.hasPublicMedley"
                @change="toggleMedleyVisibility(artist)"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                {{ artist.hasPublicMedley ? 'Public Medley' : 'Hidden Medley' }}
              </span>
            </label>
          </div>
          
          <div class="badges-row">
            <span class="badge" :class="getBadgeClass(artist.role)">
              {{ getRoleLabel(artist.role) }}
            </span>
          </div>

          <!-- PayPal Section -->
          <div class="paypal-section">
            <div class="paypal-header">
              <label class="form-label">PayPal Email</label>
              <button 
                v-if="editingPayPal !== artist.id"
                @click="startEditPayPal(artist)"
                class="btn-icon-sm"
              >
                <font-awesome-icon :icon="['fas', 'edit']" />
                Edit
              </button>
            </div>
            
            <div v-if="editingPayPal === artist.id">
              <input
                v-model="payPalEmail"
                type="email"
                class="form-input"
                :class="{ 'error': payPalError }"
                placeholder="artist@example.com"
                :disabled="savingPayPal"
              />
              <p v-if="payPalError" class="error-text">{{ payPalError }}</p>
              <p class="help-text">PayPal email for receiving payments</p>
              
              <div class="edit-actions">
                <button 
                  @click="savePayPalEmail(artist)"
                  class="btn btn-sm btn-primary"
                  :disabled="savingPayPal"
                >
                  <font-awesome-icon v-if="savingPayPal" :icon="['fas', 'spinner']" class="fa-spin" />
                  {{ savingPayPal ? 'Saving...' : 'Save' }}
                </button>
                <button 
                  @click="cancelEditPayPal"
                  class="btn btn-sm btn-secondary"
                  :disabled="savingPayPal"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <div v-else>
              <p v-if="artist.paypalEmail" class="paypal-email">
                {{ artist.paypalEmail }}
              </p>
              <p v-else class="text-muted">
                <font-awesome-icon :icon="['fas', 'exclamation-circle']" />
                Not configured
              </p>
            </div>
          </div>
          
          <div class="artist-actions">
            <router-link 
              :to="`/studio/${artist.id}`" 
              class="btn btn-primary"
            >
              <font-awesome-icon :icon="['fas', 'music']" />
              Studio
            </router-link>
            <button 
              v-if="artist.customSlug && artist.hasPublicMedley"
              @click="viewPublicPage(artist)" 
              class="btn btn-secondary"
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
              <p class="help-text">This will be their public display name</p>
            </div>

            <div class="form-group">
              <label class="form-label">Spotify Artist URL</label>
              <input
                v-model="newArtist.spotifyUrl"
                type="text"
                class="form-input"
                placeholder="https://open.spotify.com/artist/..."
              />
              <p class="help-text">Optional: Import artist data from Spotify</p>
            </div>

            <div v-if="createError" class="error-message">
              {{ createError }}
            </div>

            <div class="modal-footer">
              <button type="button" @click="closeCreateModal" class="btn btn-secondary">
                Cancel
              </button>
              <button 
                type="submit"
                class="btn btn-primary"
                :disabled="creating || !newArtist.name"
              >
                <font-awesome-icon v-if="creating" :icon="['fas', 'spinner']" class="fa-spin" />
                {{ creating ? 'Creating...' : 'Create Artist' }}
              </button>
            </div>
          </form>
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
  gap: var(--spacing-sm);
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

.stat-card {
  background: var(--bg-card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
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
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: var(--spacing-xs);
}

/* Artists Grid - with proper gap */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

/* Artist Card Styling */
.artist-header {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.artist-avatar {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.artist-avatar-placeholder {
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
  font-weight: 600;
}

.artist-genre {
  margin: var(--spacing-xs) 0 0 0;
  font-size: 0.875rem;
}

/* Medley Toggle Row */
.medley-toggle-row {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-primary);
}

/* Badges Row */
.badges-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  min-height: 24px;
}

/* PayPal Section */
.paypal-section {
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
  margin-bottom: var(--spacing-md);
}

.paypal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.paypal-header .form-label {
  margin: 0;
}

.btn-icon-sm {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: color var(--transition-fast);
}

.btn-icon-sm:hover {
  color: var(--color-primary);
}

.paypal-email {
  color: var(--text-secondary);
  margin: 0;
}

.help-text {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.error-text {
  font-size: 0.875rem;
  color: var(--color-danger);
  margin-top: var(--spacing-xs);
}

.edit-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.artist-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.artist-actions .btn {
  flex: 1;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  max-width: 500px;
  margin: 0 auto;
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

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
}

/* Animation */
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
    flex-wrap: wrap;
  }
  
  .artists-grid {
    grid-template-columns: 1fr;
  }
}
</style>