<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore'
import { authService } from '@/services/auth'
import { themeManager, THEMES } from '@/utils/themeManager'

const router = useRouter()
const user = ref(null)
const userData = ref(null)
const artistProfile = ref(null)
const hasArtistProfile = ref(false)
const loading = ref(true)
const error = ref('')
const savingTheme = ref(false)

// Theme settings
const currentTheme = ref(themeManager.getTheme())

const themeOptions = [
  { value: THEMES.LIGHT, label: 'Light Mode', icon: 'sun', description: 'Clean, bright interface' },
  { value: THEMES.DARK, label: 'Dark Mode', icon: 'moon', description: 'Easy on the eyes in low light' },
  { value: THEMES.AUTO, label: 'Auto', icon: 'rotate', description: 'Follows your system preference' }
]

const stats = ref({
  tracksOwned: 0,
  tracksSaved: 0,
  totalSpent: '0.00'
})

// Computed properties remain the same...
const displayName = computed(() => {
  if (userData.value?.displayName) return userData.value.displayName
  if (user.value?.displayName) return user.value.displayName
  if (user.value?.email) return user.value.email.split('@')[0]
  return 'Music Lover'
})

const creationDate = computed(() => {
  if (!user.value?.metadata?.creationTime) {
    return 'Unknown'
  }
  
  try {
    const creationTime = user.value.metadata.creationTime
    let date
    
    if (typeof creationTime === 'string') {
      if (creationTime.includes('T') && creationTime.includes('Z')) {
        date = new Date(creationTime)
      }
      else if (creationTime.includes('GMT')) {
        date = new Date(creationTime)
      }
      else if (!isNaN(creationTime)) {
        date = new Date(parseInt(creationTime))
      }
      else {
        date = new Date(creationTime)
      }
    } else {
      date = new Date(creationTime)
    }
    
    if (isNaN(date.getTime())) {
      return 'Unknown'
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (err) {
    console.warn('Error parsing creation date:', err)
    return 'Unknown'
  }
})

// Methods
const loadProfile = async () => {
  loading.value = true
  error.value = ''
  
  try {
    console.log('🔍 Starting profile load...')
    
    // Wait for auth state
    if (!user.value) {
      console.log('⏳ Waiting for auth state...')
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            user.value = currentUser
            console.log('✅ Auth user loaded:', {
              uid: currentUser.uid,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified
            })
            unsubscribe()
            resolve()
          }
        })
      })
    }
    
    // Load user data from auth service
    userData.value = authService.getCurrentUserData()
    console.log('📊 User data:', userData.value)
    
    // If no user data, try to load it
    if (!userData.value && user.value) {
      console.log('🔄 Loading user data from Firestore...')
      await authService.loadUserData(user.value.uid)
      userData.value = authService.getCurrentUserData()
    }
    
    // Set theme from user preferences
    if (userData.value?.theme) {
      currentTheme.value = userData.value.theme
      themeManager.setTheme(userData.value.theme)
    }
    
    if (user.value) {
      console.log('🎯 Loading artist profile and stats...')
      await Promise.all([
        checkArtistProfile(),
        loadStats()
      ])
    }
  } catch (err) {
    console.error('❌ Error loading profile:', err)
    error.value = 'Failed to load profile data'
  } finally {
    loading.value = false
  }
}

const updateTheme = async (theme) => {
  if (!user.value) return
  
  savingTheme.value = true
  currentTheme.value = theme
  themeManager.setTheme(theme)
  
  try {
    await updateDoc(doc(db, 'users', user.value.uid), {
      theme: theme,
      updatedAt: new Date()
    })
    
    userData.value = { ...userData.value, theme }
  } catch (err) {
    console.error('Error saving theme preference:', err)
    error.value = 'Failed to save theme preference'
  } finally {
    savingTheme.value = false
  }
}

const checkArtistProfile = async () => {
  if (!user.value) return
  
  try {
    console.log('🎨 Checking for artist profile...')
    const q = query(
      collection(db, 'artistProfiles'),
      where('createdBy', '==', user.value.uid)
    )
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      hasArtistProfile.value = true
      artistProfile.value = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      }
      console.log('✅ Artist profile found:', artistProfile.value)
    } else {
      console.log('ℹ️ No artist profile found')
    }
  } catch (err) {
    console.warn('⚠️ Error checking artist profile:', err)
  }
}

const loadStats = async () => {
  if (!user.value) {
    console.log('❌ No user for stats loading')
    return
  }
  
  console.log('📈 Loading stats for user:', {
    uid: user.value.uid,
    email: user.value.email,
    emailVerified: user.value.emailVerified
  })
  
  try {
    // Load collection stats
    console.log('🔍 Querying userCollections...')
    const collectionQuery = query(
      collection(db, 'userCollections'),
      where('userId', '==', user.value.uid)
    )
    
    console.log('📝 Collection query created, executing...')
    const collectionSnapshot = await getDocs(collectionQuery)
    console.log('✅ Collection query successful, docs:', collectionSnapshot.size)
    
    let owned = 0
    let saved = 0
    
    collectionSnapshot.forEach(doc => {
      const data = doc.data()
      console.log('📄 Collection doc:', data)
      if (data.isPurchased || data.type === 'purchased') {
        owned++
      } else {
        saved++
      }
    })
    
    console.log('📊 Collection stats:', { owned, saved })
    
    // Load purchase total from royalties
    console.log('🔍 Querying medleyRoyalties...')
    const purchasesQuery = query(
      collection(db, 'medleyRoyalties'),
      where('payerEmail', '==', user.value.email),
      where('type', '==', 'purchase')
    )
    
    console.log('📝 Royalties query created, executing...')
    const purchasesSnapshot = await getDocs(purchasesQuery)
    console.log('✅ Royalties query successful, docs:', purchasesSnapshot.size)
    
    let total = 0
    purchasesSnapshot.forEach(doc => {
      const data = doc.data()
      console.log('💰 Royalty doc:', data)
      const amount = data.amount || 0
      total += amount
    })
    
    console.log('💵 Total spent:', total)
    
    stats.value = {
      tracksOwned: owned,
      tracksSaved: saved,
      totalSpent: total.toFixed(2)
    }
    
    console.log('✅ Final stats:', stats.value)
    
  } catch (err) {
    console.error('❌ Error loading stats:', err)
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    })
    
    // Set default stats if queries fail
    stats.value = {
      tracksOwned: 0,
      tracksSaved: 0,
      totalSpent: '0.00'
    }
  }
}

const formatUserType = (type) => {
  if (!type) return 'Music Lover'
  const types = {
    'consumer': 'Music Lover',
    'artist': 'Artist',
    'admin': 'Administrator'
  }
  return types[type] || type
}

const formatPlatform = (platform) => {
  if (!platform) return '4track'
  const platforms = {
    '4track': '4track',
    'musicdrop': 'MusicDrop',
    'legacy': 'Legacy User'
  }
  return platforms[platform] || platform
}

const logout = async () => {
  if (!confirm('Are you sure you want to sign out?')) return
  
  try {
    await authService.signOut()
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
    error.value = 'Failed to sign out'
  }
}

// Lifecycle
onMounted(async () => {
  await loadProfile()
})
</script>

<template>
  <div class="profile-page">
    <div class="page-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="text-secondary">Loading your profile...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center p-xl">
        <p class="text-danger mb-lg">{{ error }}</p>
        <button @click="loadProfile" class="btn btn-primary">
          <font-awesome-icon :icon="['fas', 'arrows-rotate']" />
          Try Again
        </button>
      </div>

      <!-- Profile Content -->
      <div v-else>
        <h1 class="page-title">
          <font-awesome-icon :icon="['fas', 'user']" class="mr-sm" />
          My Profile
        </h1>

        <div class="profile-sections">
          <!-- User Info Section -->
          <section class="profile-section">
            <h2>Account Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <label>Name</label>
                <p>{{ displayName }}</p>
              </div>
              <div class="info-item">
                <label>Email</label>
                <p>{{ user?.email || 'Not available' }}</p>
              </div>
              <div class="info-item">
                <label>Account Type</label>
                <p>{{ formatUserType(userData?.userType) }}</p>
              </div>
              <div class="info-item">
                <label>Platform</label>
                <p>{{ formatPlatform(userData?.platform) }}</p>
              </div>
              <div class="info-item">
                <label>Member Since</label>
                <p>{{ creationDate }}</p>
              </div>
            </div>
          </section>

          <!-- Appearance Section -->
          <section class="profile-section">
            <h2>
              <font-awesome-icon :icon="['fas', 'palette']" class="mr-sm" />
              Appearance
            </h2>
            <p class="text-secondary mb-lg">Choose how 4track looks and feels</p>
            
            <div class="theme-options">
              <div 
                v-for="option in themeOptions" 
                :key="option.value"
                class="theme-option"
                :class="{ 'active': currentTheme === option.value }"
                @click="updateTheme(option.value)"
              >
                <font-awesome-icon :icon="['fas', option.icon]" class="theme-icon" />
                <div class="theme-content">
                  <h4 class="theme-label">{{ option.label }}</h4>
                  <p class="theme-description">{{ option.description }}</p>
                </div>
                <font-awesome-icon 
                  v-if="currentTheme === option.value" 
                  :icon="['fas', 'check']" 
                  class="theme-check" 
                />
              </div>
            </div>
          </section>

          <!-- Collection Stats -->
          <section class="profile-section">
            <h2>
              <font-awesome-icon :icon="['fas', 'chart-bar']" class="mr-sm" />
              Collection Stats
            </h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ stats.tracksOwned }}</div>
                <div class="stat-label">Tracks Owned</div>
                <div class="stat-icon">
                  <font-awesome-icon :icon="['fas', 'download']" />
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.tracksSaved }}</div>
                <div class="stat-label">Tracks Saved</div>
                <div class="stat-icon">
                  <font-awesome-icon :icon="['fas', 'heart']" />
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${{ stats.totalSpent }}</div>
                <div class="stat-label">Total Spent</div>
                <div class="stat-icon">
                  <font-awesome-icon :icon="['fas', 'dollar-sign']" />
                </div>
              </div>
            </div>
          </section>

          <!-- Quick Actions -->
          <section class="profile-section">
            <h2>
              <font-awesome-icon :icon="['fas', 'bolt']" class="mr-sm" />
              Quick Actions
            </h2>
            <div class="actions-grid">
              <router-link to="/collection" class="action-card">
                <font-awesome-icon :icon="['fas', 'music']" class="action-icon" />
                <h3>My Collection</h3>
                <p>View your saved and purchased tracks</p>
              </router-link>

              <router-link to="/discover" class="action-card">
                <font-awesome-icon :icon="['fas', 'search']" class="action-icon" />
                <h3>Discover Music</h3>
                <p>Find new artists and tracks</p>
              </router-link>
              
              <router-link 
                v-if="!hasArtistProfile" 
                to="/artist/create" 
                class="action-card action-primary"
              >
                <font-awesome-icon :icon="['fas', 'microphone']" class="action-icon" />
                <h3>Become an Artist</h3>
                <p>Start sharing your music with the world</p>
              </router-link>

              <router-link 
                v-if="hasArtistProfile && artistProfile" 
                to="/studio" 
                class="action-card action-primary"
              >
                <font-awesome-icon :icon="['fas', 'cog']" class="action-icon" />
                <h3>Artist Studio</h3>
                <p>Manage your medley and view analytics</p>
              </router-link>
            </div>
          </section>

          <!-- Account Actions -->
          <section class="profile-section">
            <h2>
              <font-awesome-icon :icon="['fas', 'cog']" class="mr-sm" />
              Account Settings
            </h2>
            <div class="settings-grid">
              <button @click="logout" class="action-card danger">
                <font-awesome-icon :icon="['fas', 'sign-out-alt']" class="action-icon" />
                <h3>Sign Out</h3>
                <p>Logout from your account</p>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.page-title {
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: var(--spacing-2xl);
  display: flex;
  align-items: center;
}

.profile-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.profile-section {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
}

.profile-section h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  font-size: var(--font-xl);
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.info-item {
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.info-item label {
  font-size: var(--font-sm);
  color: var(--text-muted);
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item p {
  color: var(--text-primary);
  font-weight: 500;
  margin: 0;
  font-size: var(--font-base);
}

/* Theme Options */
.theme-options {
  display: grid;
  gap: var(--spacing-md);
}

.theme-option {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--bg-card);
}

.theme-option:hover {
  border-color: var(--color-primary);
  background-color: var(--bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.theme-option.active {
  border-color: var(--color-primary);
  background-color: var(--bg-hover);
  box-shadow: var(--shadow-sm);
}

.theme-icon {
  font-size: 2rem;
  margin-right: var(--spacing-lg);
  color: var(--text-secondary);
}

.theme-content {
  flex: 1;
}

.theme-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.theme-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.theme-check {
  color: var(--color-primary);
  font-weight: bold;
  font-size: 1.5rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  background: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  text-align: center;
  position: relative;
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
  display: block;
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  font-weight: 600;
}

.stat-icon {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  color: var(--color-primary);
  opacity: 0.3;
  font-size: var(--font-lg);
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-md);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.action-card {
  background: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-decoration: none;
  color: inherit;
  border: 2px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.action-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.action-card.action-primary {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
  color: var(--text-inverse);
}

.action-card.action-primary:hover {
  transform: translateY(-2px) scale(1.02);
}

.action-card.danger {
  border: none;
  background: var(--bg-secondary);
}

.action-card.danger:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-primary);
}

.action-card.action-primary .action-icon {
  color: var(--text-inverse);
}

.action-card.danger:hover .action-icon {
  color: var(--color-danger);
}

.action-card h3 {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 600;
}

.action-card p {
  margin: 0;
  font-size: var(--font-sm);
  opacity: 0.8;
  line-height: 1.4;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--spacing-md);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-primary);
  border-top: 4px solid var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Utilities */
.mr-sm {
  margin-right: var(--spacing-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-section {
    padding: var(--spacing-lg);
  }
  
  .theme-option {
    padding: var(--spacing-md);
  }
  
  .theme-icon {
    font-size: 1.5rem;
    margin-right: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: var(--spacing-md);
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>