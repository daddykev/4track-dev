<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import FeedPlayer from '@/components/FeedPlayer.vue'

const router = useRouter()

// State
const loading = ref(true)
const loadingMore = ref(false)
const showSettings = ref(false)

// Add to state
const selectedTrack = ref(null)
const trackQueue = ref([])
const currentTrackIndex = ref(0)
const showPlayer = ref(false)

// Feed data
const allTracks = ref([])
const allArtists = ref([])
const feedOrder = ref([])
const displayedItems = ref([])
const itemsPerPage = 24
const isLoadingNextPage = ref(false)

// Initialize
onMounted(async () => {
  // Force dark theme for discover page
  document.documentElement.classList.add('force-dark-theme')
  
  await loadContent()
  setupInfiniteScroll()
})

onBeforeUnmount(() => {
  // Remove forced dark theme
  document.documentElement.classList.remove('force-dark-theme')
  window.removeEventListener('scroll', handleScroll)
})

// Load all tracks and artists
const loadContent = async () => {
  try {
    // Load all public tracks
    const tracksQuery = query(
      collection(db, 'medleyTracks'),
      orderBy('createdAt', 'desc')
    )
    
    const tracksSnapshot = await getDocs(tracksQuery)
    const tracks = []
    
    for (const doc of tracksSnapshot.docs) {
      const trackData = { 
        id: doc.id, 
        ...doc.data(),
        type: 'track'
      }
      
      // Get download count from userCollections
      const downloadsQuery = query(
        collection(db, 'userCollections'),
        where('trackId', '==', doc.id),
        where('isPurchased', '==', true)
      )
      const downloadsSnapshot = await getDocs(downloadsQuery)
      trackData.downloadCount = downloadsSnapshot.size
      
      tracks.push(trackData)
    }
    
    allTracks.value = tracks
    
    // Load all artists with public medleys
    const artistsQuery = query(
      collection(db, 'artistProfiles'),
      where('hasPublicMedley', '==', true),
      orderBy('name')
    )
    
    const artistsSnapshot = await getDocs(artistsQuery)
    const artists = []
    
    // Load artist photos in parallel
    const artistPhotoPromises = []
    
    for (const doc of artistsSnapshot.docs) {
      const artistData = { 
        id: doc.id, 
        ...doc.data(),
        type: 'artist'
      }
      
      artists.push(artistData)
      
      // Queue photo loading
      artistPhotoPromises.push(loadArtistPhoto(artistData))
    }
    
    // Wait for all photos to load
    await Promise.all(artistPhotoPromises)
    
    // Count tracks for each artist
    for (const artist of artists) {
      const trackCount = allTracks.value.filter(t => t.artistId === artist.id).length
      artist.trackCount = trackCount
    }
    
    // Shuffle artists for variety
    allArtists.value = shuffleArray(artists)
    
    // Create feed order
    createFeedOrder()
    
    // Load first page
    loadNextPage()
    
  } catch (error) {
    console.error('Error loading content:', error)
  } finally {
    loading.value = false
  }
}

// Load artist primary photo
const loadArtistPhoto = async (artist) => {
  // Don't return early - always check for cropped thumbnails
  
  try {
    const photosQuery = query(
      collection(db, 'artistPhotos'),
      where('artistId', '==', artist.id),
      where('isPrimary', '==', true)
    )
    
    const photosSnapshot = await getDocs(photosQuery)
    
    if (!photosSnapshot.empty) {
      const primaryPhoto = photosSnapshot.docs[0].data()
      // Use cropped thumbnail if available, otherwise use regular thumbnail
      artist.primaryPhotoThumbnail = primaryPhoto.croppedThumbnailUrl || primaryPhoto.thumbnailUrl
      console.log(`Artist ${artist.name} photo:`, {
        hasCropped: !!primaryPhoto.croppedThumbnailUrl,
        thumbnail: artist.primaryPhotoThumbnail
      })
    } else {
      // No artist photos in the collection, keep the profileImageUrl as fallback
      console.log(`Artist ${artist.name} has no photos in collection, using profileImageUrl`)
    }
  } catch (error) {
    console.error('Error loading artist photo:', error)
  }
}

// Create 2:1 track:artist pattern
const createFeedOrder = () => {
  const order = []
  let trackIndex = 0
  let artistIndex = 0
  
  // Create the pattern: 2 tracks, 1 artist, repeat
  while (trackIndex < allTracks.value.length || artistIndex < allArtists.value.length) {
    // Add 2 tracks if available
    for (let i = 0; i < 2; i++) {
      if (trackIndex < allTracks.value.length) {
        order.push(allTracks.value[trackIndex])
        trackIndex++
      }
    }
    
    // Add 1 artist if available
    if (artistIndex < allArtists.value.length) {
      order.push(allArtists.value[artistIndex])
      artistIndex++
    }
  }
  
  feedOrder.value = order
}

// Load next page of items
const loadNextPage = () => {
  if (isLoadingNextPage.value || feedOrder.value.length === 0) return
  
  isLoadingNextPage.value = true
  
  // Only show "Loading more..." spinner if we already have items displayed
  // This prevents showing it during initial load
  if (displayedItems.value.length > 0) {
    loadingMore.value = true
  }
  
  setTimeout(() => {
    const start = displayedItems.value.length
    const itemsToAdd = []
    
    // If we've shown all items, loop back to the beginning
    for (let i = 0; i < itemsPerPage; i++) {
      const index = (start + i) % feedOrder.value.length
      itemsToAdd.push(feedOrder.value[index])
    }
    
    displayedItems.value.push(...itemsToAdd)
    
    loadingMore.value = false
    isLoadingNextPage.value = false
  }, 300)
}

// Infinite scroll setup
const setupInfiniteScroll = () => {
  window.addEventListener('scroll', handleScroll, { passive: true })
}

const handleScroll = () => {
  if (loadingMore.value || loading.value || feedOrder.value.length === 0) return
  
  const scrollPosition = window.innerHeight + window.scrollY
  const threshold = document.documentElement.offsetHeight - 200
  
  if (scrollPosition >= threshold) {
    loadNextPage()
  }
}

// Handle card clicks
const handleCardClick = (item) => {
  if (item.type === 'artist' && item.customSlug) {
    router.push(`/${item.customSlug}`)
  } else if (item.type === 'track') {
    // Build queue of all tracks currently in feed
    trackQueue.value = displayedItems.value.filter(i => i.type === 'track')
    const index = trackQueue.value.findIndex(t => t.id === item.id)
    
    selectedTrack.value = item
    currentTrackIndex.value = index >= 0 ? index : 0
    showPlayer.value = true
  }
}

// Add player control methods
const closePlayer = () => {
  showPlayer.value = false
  // Keep selectedTrack so user can reopen
}

const changeTrack = (track) => {
  selectedTrack.value = track
}

// Utility functions
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="discover-page">
    <!-- Header -->
    <div class="page-header">
      <h1>Discover</h1>
      <p>Explore tracks and artists on 4track</p>
      
      <!-- Settings Button -->
      <button 
        v-if="false" 
        @click="showSettings = true" 
        class="btn btn-secondary settings-btn"
      >
        <font-awesome-icon :icon="['fas', 'sliders']" />
        Feed Settings
      </button>
    </div>

    <!-- Feed Wrapper -->
    <div class="feed-wrapper">
      <!-- Loading State -->
      <div v-if="loading && displayedItems.length === 0" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="text-secondary">Loading amazing music...</p>
      </div>

      <!-- Feed Grid -->
      <div v-else-if="feedOrder.length > 0" class="feed-grid">
        <div 
          v-for="(item, index) in displayedItems" 
          :key="`${item.type}-${item.id}-${Math.floor(index / feedOrder.length)}`"
          class="feed-item"
          @click="handleCardClick(item)"
        >
          <!-- Track Card -->
          <div v-if="item.type === 'track'" class="card feed-card track-feed-card">
            <div class="card-image-container">
              <img 
                v-if="item.artworkUrl" 
                :src="item.artworkUrl" 
                :alt="item.title"
                class="card-image"
                loading="lazy"
              />
              <div v-else class="no-image">
                <font-awesome-icon :icon="['fas', 'music']" />
              </div>
              
              <!-- Price Badge -->
              <div class="price-badge" :class="{ 'free': item.price === 0 }">
                {{ item.price === 0 ? 'FREE' : `$${item.price}` }}
              </div>
            </div>
            
            <div class="card-content">
              <h3 class="track-title">{{ item.title }}</h3>
              <p class="track-artist">{{ item.artistName }}</p>
              
              <div class="track-meta">
                <span v-if="item.duration" class="meta-duration">
                  <font-awesome-icon :icon="['fas', 'clock']" />
                  {{ formatDuration(item.duration) }}
                </span>
                <span v-if="item.downloadCount" class="meta-downloads">
                  <font-awesome-icon :icon="['fas', 'download']" />
                  {{ item.downloadCount }}
                </span>
              </div>
            </div>
          </div>

          <!-- Artist Card -->
          <div v-else-if="item.type === 'artist'" class="card feed-card artist-feed-card">
            <div class="card-image-container">
              <img 
                v-if="item.profileImageUrl || item.primaryPhotoThumbnail" 
                :src="item.primaryPhotoThumbnail || item.profileImageUrl" 
                :alt="item.name"
                class="card-image artist-image"
                loading="lazy"
              />
              <div v-else class="no-image">
                <font-awesome-icon :icon="['fas', 'user-music']" />
              </div>
              
              <div class="artist-badge">ARTIST</div>
            </div>
            
            <div class="card-content">
              <h3 class="artist-name">{{ item.name }}</h3>
              <p class="artist-genre">{{ item.genre || 'Independent' }}</p>
              <p class="artist-track-count">{{ item.trackCount || 0 }} tracks</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" class="empty-state">
        <font-awesome-icon :icon="['fas', 'folder-open']" class="empty-icon" />
        <h3>No music discovered yet</h3>
        <p>Be the first to share your tracks!</p>
      </div>

      <!-- Loading More Indicator -->
      <div v-if="loadingMore" class="loading-more">
        <div class="loading-spinner"></div>
        <p class="text-secondary">Loading more...</p>
      </div>
    </div>

    <!-- Add to DiscoverPage.vue template after the feed wrapper -->
    <FeedPlayer
      v-if="selectedTrack"
      :current-track="selectedTrack"
      :queue="trackQueue"
      :current-index="currentTrackIndex"
      :is-visible="showPlayer"
      @close="closePlayer"
      @track-change="changeTrack"
      @update:currentIndex="currentTrackIndex = $event"
    />

    <!-- Settings Modal (placeholder for future) -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Feed Settings</h3>
          <button @click="showSettings = false" class="close-btn">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>
        </div>
        <div class="modal-content">
          <p class="text-muted">Feed customization coming soon!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Container */
.discover-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Page Header */
.page-header {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-lg);
  max-width: 800px;
  margin: 0 auto;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.page-header p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.settings-btn {
  margin-top: var(--spacing-md);
}

/* Feed Wrapper */
.feed-wrapper {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  width: 100%;
}

/* Add padding when player is active */
.feed-wrapper.player-active {
  padding-bottom: 140px;
}

/* Feed Grid - Same as LabelFeed */
.feed-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

/* Feed Item */
.feed-item {
  cursor: pointer;
}

/* Feed Cards */
.feed-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all var(--transition-normal);
  background: var(--bg-card);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  padding: 0;
  box-shadow: var(--shadow-sm);
}

.feed-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

/* Card Image Container */
.card-image-container {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 aspect ratio */
  overflow: hidden;
  background: var(--bg-tertiary);
  flex-shrink: 0;
}

.card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-image {
  object-fit: cover;
  object-position: center;
}

.no-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  font-size: 3rem;
}

/* Price Badge */
.price-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.9rem;
}

.price-badge.free {
  background: var(--color-success);
}

/* Artist Badge */
.artist-badge {
  position: absolute;
  bottom: var(--spacing-sm);
  left: var(--spacing-sm);
  background: var(--color-secondary);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

/* Card Content */
.card-content {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

/* Track Card Styles */
.track-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-meta {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.meta-duration,
.meta-downloads {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* Artist Card Styles */
.artist-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-genre {
  font-size: 0.9rem;
  color: var(--color-primary);
  margin: 0;
}

.artist-track-count {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

/* Loading States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 128px - 200px); /* Navbar (64px) + additional offset (200px) */
  padding: var(--spacing-xl);
  gap: var(--spacing-md);
}

.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-md);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-primary);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-lg);
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--text-secondary);
}

/* Responsive Grid */
/* Ultra-wide screens - 5 columns */
@media (min-width: 1600px) {
  .feed-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Tablet - 2 columns */
@media (max-width: 1024px) {
  .feed-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .feed-wrapper {
    padding: 0 var(--spacing-md);
  }
}

/* Mobile - 1 column */
@media (max-width: 768px) {
  .page-header {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .feed-wrapper {
    padding: 0 var(--spacing-sm);
  }
  
  .feed-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .card-content {
    padding: var(--spacing-sm);
  }
  
  .track-title {
    font-size: 1rem;
  }
  
  .artist-name {
    font-size: 1.1rem;
  }
}

/* Very small screens */
@media (max-width: 480px) {
  .feed-wrapper {
    padding: 0 6px;
  }
  
  .feed-grid {
    gap: 12px;
  }
}
</style>