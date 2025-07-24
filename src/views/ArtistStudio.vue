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
          
          <router-link 
            :to="`/artist/${artist.id}/medley`" 
            class="btn btn-primary"
          >
            <font-awesome-icon :icon="['fas', 'music']" />
            Manage Medley
          </router-link>
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
          <router-link :to="`/artist/${artist.id}/medley`" class="btn btn-primary mt-md">
            Create Your First Medley
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { apiService } from '@/services/api'

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
      // This is handled by the template showing the "Set Up Your Artist Profile" section
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
  
  .link-display {
    flex-direction: column;
  }
  
  .link-display code {
    word-break: break-all;
  }
}
</style>