<template>
  <div class="page-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="text-secondary">Loading your collection...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center p-xl">
      <p class="text-danger mb-lg">{{ error }}</p>
      <button @click="loadCollection" class="btn btn-primary">
        <font-awesome-icon :icon="['fas', 'arrows-rotate']" />
        Try Again
      </button>
    </div>

    <!-- Music Collection -->
    <div v-else>
      <!-- Header -->
      <div class="mb-xl">
        <h1 class="text-primary mb-sm" style="font-size: 2.5rem;">
          <font-awesome-icon :icon="['fas', 'heart']" class="mr-sm" />
          My Music Collection
        </h1>
        <p class="text-secondary">
          All your saved and purchased tracks in one place
        </p>
      </div>

      <!-- Filter Tabs -->
      <div v-if="collectionItems.length > 0" class="filter-tabs mb-lg">
        <button 
          @click="filterType = 'all'"
          class="filter-tab"
          :class="{ 'active': filterType === 'all' }"
        >
          All ({{ collectionItems.length }})
        </button>
        <button 
          @click="filterType = 'purchased'"
          class="filter-tab"
          :class="{ 'active': filterType === 'purchased' }"
        >
          Purchased ({{ collectionItems.filter(i => i.isPurchased).length }})
        </button>
        <button 
          @click="filterType = 'hearted'"
          class="filter-tab"
          :class="{ 'active': filterType === 'hearted' }"
        >
          Saved ({{ collectionItems.filter(i => !i.isPurchased).length }})
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">
          <font-awesome-icon :icon="['fas', 'compact-disc']" />
        </div>
        <h3 class="text-primary mb-md">
          {{ filterType === 'purchased' ? 'No purchased tracks yet' : 
             filterType === 'hearted' ? 'No saved tracks yet' : 
             'No tracks yet' }}
        </h3>
        <p class="text-secondary mb-lg">
          {{ filterType === 'purchased' ? 'Purchase tracks from artist medleys to download them anytime' : 
             filterType === 'hearted' ? 'Save tracks you love by clicking the heart icon' : 
             'Start building your collection by saving or purchasing tracks from artist medleys' }}
        </p>
        <router-link to="/discover" class="btn btn-primary">
          Discover Music
        </router-link>
      </div>

      <!-- Collection by Artist -->
      <div v-else>
        <div 
          v-for="(artistData, artistName) in filteredItemsByArtist" 
          :key="artistName"
          class="artist-section"
        >
          <!-- Artist Header -->
          <div class="artist-header">
            <div class="artist-info">
              <img 
                v-if="artistData.artist.profileImage" 
                :src="artistData.artist.profileImage" 
                :alt="artistName"
                class="artist-avatar"
              />
              <div v-else class="artist-avatar-placeholder">
                <font-awesome-icon :icon="['fas', 'user-music']" />
              </div>
              <div>
                <h3 class="artist-name">{{ artistName }}</h3>
                <p class="artist-track-count">
                  {{ artistData.tracks.length }} track{{ artistData.tracks.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
            <button 
              v-if="artistData.artist.customSlug"
              @click="listenToTrack(artistData.tracks[0])"
              class="btn btn-sm btn-secondary"
            >
              <font-awesome-icon :icon="['fas', 'play']" />
              View Medley
            </button>
          </div>

          <!-- Track Grid -->
          <div class="tracks-grid">
            <div 
              v-for="item in artistData.tracks" 
              :key="item.id"
              class="track-card"
              :class="{ 'purchased': item.isPurchased }"
            >
              <!-- Track Artwork -->
              <div class="track-artwork">
                <img 
                  v-if="item.track.artworkUrl" 
                  :src="item.track.artworkUrl" 
                  :alt="item.track.title"
                />
                <div v-else class="artwork-placeholder">
                  <font-awesome-icon :icon="['fas', 'music']" />
                </div>
                <div v-if="item.isPurchased" class="purchased-badge">
                  <font-awesome-icon :icon="['fas', 'check']" />
                </div>
              </div>

              <!-- Track Info -->
              <div class="track-info">
                <h4 class="track-title">{{ item.track.title || 'Unknown Track' }}</h4>
                <p v-if="item.track.description" class="track-description">
                  {{ item.track.description }}
                </p>
                <div class="track-meta">
                  <span class="meta-item">
                    <font-awesome-icon :icon="['fas', 'calendar']" class="mr-xs" />
                    {{ formatDate(item.timestamp) }}
                  </span>
                  <span v-if="item.isPurchased" class="meta-item">
                    <font-awesome-icon :icon="['fas', 'dollar-sign']" class="mr-xs" />
                    {{ formatPrice(item) }}
                  </span>
                </div>
              </div>

              <!-- Track Actions -->
              <div class="track-actions">
                <!-- If purchased and downloadable, show download button -->
                <button 
                  v-if="item.isPurchased && item.track.allowDownload !== false"
                  @click="downloadTrack(item)"
                  class="btn btn-primary btn-sm"
                  :disabled="downloadingTrack === item.id"
                >
                  <font-awesome-icon 
                    :icon="downloadingTrack === item.id ? ['fas', 'spinner'] : ['fas', 'download']"
                    :class="{ 'fa-spin': downloadingTrack === item.id }"
                  />
                  {{ downloadingTrack === item.id ? 'Downloading...' : 'Download' }}
                </button>
                
                <!-- If purchased but stream-only -->
                <span v-else-if="item.isPurchased && !item.track.allowDownload" class="stream-only-badge">
                  <font-awesome-icon :icon="['fas', 'lock']" />
                  Stream Only
                </span>
                
                <!-- If not purchased, show purchase button -->
                <button 
                  v-else-if="!item.isPurchased"
                  @click="purchaseTrack(item)"
                  class="btn btn-success btn-sm"
                  :disabled="purchasingTrack === item.id"
                >
                  <font-awesome-icon 
                    :icon="purchasingTrack === item.id ? ['fas', 'spinner'] : ['fas', 'download']"
                    :class="{ 'fa-spin': purchasingTrack === item.id }"
                  />
                  {{ purchasingTrack === item.id ? 'Processing...' : 
                     (item.track.price > 0 ? `Buy $${item.track.price.toFixed(2)}` : 'Get Free') }}
                </button>
                
                <!-- Remove button (only for non-purchased) -->
                <button 
                  v-if="!item.isPurchased"
                  @click="removeFromCollection(item)"
                  class="btn btn-sm btn-danger"
                  :disabled="removingTrack === item.id"
                  title="Remove from collection"
                >
                  <font-awesome-icon 
                    :icon="removingTrack === item.id ? ['fas', 'spinner'] : ['fas', 'times']"
                    :class="{ 'fa-spin': removingTrack === item.id }"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { apiService } from '@/services/api'

const router = useRouter()
const user = ref(null)
const collectionItems = ref([])
const purchases = ref([])
const loading = ref(true)
const downloadingTrack = ref(null)
const purchasingTrack = ref(null)
const removingTrack = ref(null)
const error = ref('')

// Filter state
const filterType = ref('all') // all, purchased, hearted

// Group items by artist
const itemsByArtist = ref({})

// Computed filtered items
const filteredItems = computed(() => {
  if (filterType.value === 'all') return collectionItems.value
  if (filterType.value === 'purchased') {
    return collectionItems.value.filter(item => item.isPurchased)
  }
  if (filterType.value === 'hearted') {
    return collectionItems.value.filter(item => !item.isPurchased)
  }
  return collectionItems.value
})

// Computed grouped items
const filteredItemsByArtist = computed(() => {
  const grouped = {}
  filteredItems.value.forEach(item => {
    const artistName = item.artist.name || 'Unknown Artist'
    if (!grouped[artistName]) {
      grouped[artistName] = {
        artist: item.artist,
        tracks: []
      }
    }
    grouped[artistName].tracks.push(item)
  })
  return grouped
})

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      user.value = currentUser
      await loadCollection()
    } else {
      router.push('/login')
    }
  })
})

const loadCollection = async () => {
  loading.value = true
  error.value = ''
  
  console.log('🎵 Starting collection load...')
  console.log('👤 Current user:', {
    uid: user.value?.uid,
    email: user.value?.email,
    emailVerified: user.value?.emailVerified
  })
  
  try {
    // Load items from userCollections
    console.log('🔍 Querying userCollections...')
    console.log('📝 Query: userCollections where userId ==', user.value.uid)
    
    const collectionQuery = query(
      collection(db, 'userCollections'),
      where('userId', '==', user.value.uid),
      orderBy('timestamp', 'desc')
    )
    
    console.log('🚀 Executing userCollections query...')
    const collectionSnapshot = await getDocs(collectionQuery)
    console.log('✅ userCollections query successful, docs:', collectionSnapshot.size)
    
    const collectionList = []
    
    // Get unique track and artist IDs
    const trackIds = new Set()
    const artistIds = new Set()
    
    collectionSnapshot.forEach(doc => {
      const data = doc.data()
      console.log('📄 Collection document:', { id: doc.id, ...data })
      trackIds.add(data.trackId)
      artistIds.add(data.artistId)
      collectionList.push({
        id: doc.id,
        ...data
      })
    })
    
    console.log('📊 Collection summary:', {
      totalDocs: collectionList.length,
      uniqueTrackIds: trackIds.size,
      uniqueArtistIds: artistIds.size
    })
    
    // Also load direct purchases from medleyRoyalties
    console.log('🔍 Querying medleyRoyalties...')
    console.log('📝 Query: medleyRoyalties where payerEmail ==', user.value.email, 'and type in [purchase, free_download]')
    
    const purchasesQuery = query(
      collection(db, 'medleyRoyalties'),
      where('payerEmail', '==', user.value.email),
      where('type', 'in', ['purchase', 'free_download']),
      orderBy('timestamp', 'desc')
    )
    
    console.log('🚀 Executing medleyRoyalties query...')
    const purchasesSnapshot = await getDocs(purchasesQuery)
    console.log('✅ medleyRoyalties query successful, docs:', purchasesSnapshot.size)
    
    const purchasesList = []
    
    purchasesSnapshot.forEach(doc => {
      const data = doc.data()
      console.log('💰 Purchase document:', { id: doc.id, ...data })
      trackIds.add(data.trackId)
      artistIds.add(data.artistId)
      purchasesList.push({
        id: doc.id,
        ...data,
        isPurchased: true
      })
    })
    
    purchases.value = purchasesList
    
    console.log('💳 Purchases summary:', {
      totalPurchases: purchasesList.length,
      finalTrackIds: trackIds.size,
      finalArtistIds: artistIds.size
    })
    
    // Fetch track details
    console.log('🎵 Fetching track details for', trackIds.size, 'tracks...')
    const tracks = new Map()
    let tracksFetched = 0
    let tracksErrors = 0
    
    for (const trackId of trackIds) {
      try {
        console.log(`🔍 Fetching track ${trackId}...`)
        const trackDoc = await getDoc(doc(db, 'medleyTracks', trackId))
        if (trackDoc.exists()) {
          const trackData = { id: trackDoc.id, ...trackDoc.data() }
          tracks.set(trackId, trackData)
          console.log(`✅ Track ${trackId} fetched:`, trackData.title)
          tracksFetched++
        } else {
          console.warn(`⚠️ Track ${trackId} not found`)
        }
      } catch (err) {
        console.error(`❌ Error fetching track ${trackId}:`, err)
        tracksErrors++
      }
    }
    
    console.log('🎵 Track fetching summary:', {
      requested: trackIds.size,
      fetched: tracksFetched,
      errors: tracksErrors
    })
    
    // Fetch artist details
    console.log('🎨 Fetching artist details for', artistIds.size, 'artists...')
    const artists = new Map()
    let artistsFetched = 0
    let artistsErrors = 0
    
    for (const artistId of artistIds) {
      try {
        console.log(`🔍 Fetching artist ${artistId}...`)
        const artistDoc = await getDoc(doc(db, 'artistProfiles', artistId))
        if (artistDoc.exists()) {
          const artistData = { id: artistDoc.id, ...artistDoc.data() }
          artists.set(artistId, artistData)
          console.log(`✅ Artist ${artistId} fetched:`, artistData.name)
          artistsFetched++
        } else {
          console.warn(`⚠️ Artist ${artistId} not found`)
        }
      } catch (err) {
        console.error(`❌ Error fetching artist ${artistId}:`, err)
        artistsErrors++
      }
    }
    
    console.log('🎨 Artist fetching summary:', {
      requested: artistIds.size,
      fetched: artistsFetched,
      errors: artistsErrors
    })
    
    // Combine collection data with track and artist details
    console.log('🔧 Combining collection data...')
    const combinedItems = []
    
    // Add items from userCollections
    collectionList.forEach(item => {
      const track = tracks.get(item.trackId) || {}
      const artist = artists.get(item.artistId) || {}
      
      // Check if this item was also purchased
      const purchase = purchasesList.find(p => p.trackId === item.trackId)
      
      const combinedItem = {
        ...item,
        track,
        artist,
        isPurchased: item.isPurchased || !!purchase,
        purchaseData: purchase
      }
      
      console.log('📦 Combined collection item:', {
        id: item.id,
        trackTitle: track.title,
        artistName: artist.name,
        isPurchased: combinedItem.isPurchased
      })
      
      combinedItems.push(combinedItem)
    })
    
    // Add direct purchases that aren't in userCollections
    purchasesList.forEach(purchase => {
      const existingItem = combinedItems.find(item => item.trackId === purchase.trackId)
      if (!existingItem) {
        const track = tracks.get(purchase.trackId) || {}
        const artist = artists.get(purchase.artistId) || {}
        
        const purchaseItem = {
          ...purchase,
          track,
          artist,
          isPurchased: true,
          type: 'purchased',
          purchaseData: purchase
        }
        
        console.log('💰 Pure purchase item:', {
          id: purchase.id,
          trackTitle: track.title,
          artistName: artist.name
        })
        
        combinedItems.push(purchaseItem)
      }
    })
    
    console.log('🎯 Final collection:', {
      totalItems: combinedItems.length,
      purchasedItems: combinedItems.filter(i => i.isPurchased).length,
      savedItems: combinedItems.filter(i => !i.isPurchased).length
    })
    
    collectionItems.value = combinedItems
    
  } catch (err) {
    console.error('❌ Error loading collection:', err)
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    })
    error.value = 'Failed to load your music collection'
  } finally {
    loading.value = false
  }
}

const purchaseTrack = async (item) => {
  purchasingTrack.value = item.id
  
  try {
    // Call cloud function to create PayPal order
    const result = await apiService.createMedleyPayPalOrder(
      item.artistId,
      item.trackId
    )
    
    if (result.isFree) {
      // Free download - reload collection to update status
      await loadCollection()
      
      // Auto-download
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = `${item.track.title}.mp3`
      link.click()
    } else {
      // Redirect to PayPal
      window.location.href = result.approveUrl
    }
    
  } catch (error) {
    console.error('Purchase error:', error)
    alert('Failed to process purchase. Please try again.')
  } finally {
    purchasingTrack.value = null
  }
}

const downloadTrack = async (item) => {
  if (!item.track.allowDownload) {
    alert('This track is stream-only and cannot be downloaded.')
    return
  }
  
  downloadingTrack.value = item.id
  
  try {
    // Download directly using the audio URL
    const link = document.createElement('a')
    link.href = item.track.audioUrl
    link.download = `${item.track.title}.mp3`
    link.click()
  } catch (err) {
    console.error('Error downloading track:', err)
    alert('Failed to download track. Please try again.')
  } finally {
    downloadingTrack.value = null
  }
}

const removeFromCollection = async (item) => {
  if (!confirm(`Remove "${item.track.title}" from your collection?`)) return
  
  removingTrack.value = item.id
  
  try {
    // Only remove from userCollections, not purchases
    if (item.id && !item.isPurchased) {
      await deleteDoc(doc(db, 'userCollections', item.id))
      await loadCollection()
    } else {
      alert('Purchased tracks cannot be removed from your collection.')
    }
  } catch (err) {
    console.error('Error removing track:', err)
    alert('Failed to remove track. Please try again.')
  } finally {
    removingTrack.value = null
  }
}

const listenToTrack = (item) => {
  // Navigate to the artist's medley page
  if (item.artist.customSlug) {
    router.push(`/${item.artist.customSlug}`)
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatPrice = (item) => {
  if (item.purchaseData?.type === 'free_download') return 'Free'
  if (!item.track.price) return '$0.00'
  return `$${item.track.price.toFixed(2)}`
}
</script>

<!-- Keep all the existing styles -->
<style scoped>
/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: var(--spacing-sm);
  background: var(--bg-secondary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
  width: fit-content;
}

.filter-tab {
  background: transparent;
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.filter-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.filter-tab.active {
  background: var(--color-primary);
  color: var(--text-inverse);
}

/* Artist Sections */
.artist-section {
  margin-bottom: var(--spacing-2xl);
}

.artist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border-primary);
}

.artist-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.artist-avatar {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.artist-avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--text-muted);
}

.artist-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.artist-track-count {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

/* Tracks Grid */
.tracks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.track-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--border-primary);
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  position: relative;
}

.track-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.track-card.purchased {
  border-color: var(--color-success);
}

/* Track Artwork */
.track-artwork {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-md);
  position: relative;
}

.track-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--text-muted);
}

.purchased-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: var(--color-success);
  color: var(--text-inverse);
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

/* Track Info */
.track-info {
  flex: 1;
}

.track-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.track-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 var(--spacing-sm) 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.track-meta {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

/* Track Actions */
.track-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.stream-only-badge {
  color: var(--text-muted);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 5rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

/* Utilities */
.mr-xs {
  margin-right: var(--spacing-xs);
}

.mr-sm {
  margin-right: var(--spacing-sm);
}

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
  .artist-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
  
  .tracks-grid {
    grid-template-columns: 1fr;
  }
  
  .track-card {
    padding: var(--spacing-md);
  }
  
  .filter-tabs {
    width: 100%;
    justify-content: center;
  }
  
  .filter-tab {
    flex: 1;
    text-align: center;
  }
}
</style>