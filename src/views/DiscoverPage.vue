<template>
  <div class="discover-page">
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <h1>Discover New Music</h1>
        <p>Explore medleys from independent artists</p>
      </div>

      <!-- Search & Filters -->
      <div class="search-section">
        <div class="search-box">
          <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search artists or genres..."
            class="search-input"
            @input="debouncedSearch"
          />
        </div>
        
        <div class="genre-filters">
          <button
            v-for="genre in genres"
            :key="genre"
            @click="toggleGenre(genre)"
            class="genre-chip"
            :class="{ 'active': selectedGenres.includes(genre) }"
          >
            {{ genre }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Discovering amazing music...</p>
      </div>

      <!-- Artists Grid -->
      <div v-else-if="filteredArtists.length > 0" class="artists-grid">
        <div
          v-for="artist in filteredArtists"
          :key="artist.id"
          class="artist-card"
          @click="goToMedley(artist)"
        >
          <div class="artist-image">
            <img
              v-if="artist.profileImage"
              :src="artist.profileImage"
              :alt="artist.name"
            />
            <div v-else class="artist-placeholder">
              <font-awesome-icon :icon="['fas', 'user-music']" />
            </div>
            <div class="play-overlay">
              <font-awesome-icon :icon="['fas', 'play']" />
            </div>
          </div>
          
          <div class="artist-info">
            <h3>{{ artist.name }}</h3>
            <p class="artist-genre">{{ artist.genre || 'Independent' }}</p>
            <p class="artist-tracks">{{ artist.trackCount || 0 }} tracks</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <font-awesome-icon :icon="['fas', 'music']" class="empty-icon" />
        <h3>No artists found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()

const searchQuery = ref('')
const selectedGenres = ref([])
const artists = ref([])
const loading = ref(true)

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B', 
  'Alternative', 'Jazz', 'Classical', 'Country', 'Latin'
]

const filteredArtists = computed(() => {
  return artists.value.filter(artist => {
    // Search filter
    if (searchQuery.value) {
      const search = searchQuery.value.toLowerCase()
      if (!artist.name.toLowerCase().includes(search) && 
          (!artist.genre || !artist.genre.toLowerCase().includes(search))) {
        return false
      }
    }
    
    // Genre filter
    if (selectedGenres.value.length > 0) {
      if (!artist.genre || !selectedGenres.value.includes(artist.genre)) {
        return false
      }
    }
    
    return true
  })
})

// Debounce search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Search is handled by computed property
  }, 300)
}

onMounted(async () => {
  await loadArtists()
})

const loadArtists = async () => {
  loading.value = true
  
  try {
    // Query artists with published medleys
    const artistsQuery = query(
      collection(db, 'artistProfiles'),
      where('hasPublicMedley', '==', true),
      orderBy('name'),
      limit(50)
    )
    
    const snapshot = await getDocs(artistsQuery)
    const artistsList = []
    
    // Get track counts for each artist
    for (const doc of snapshot.docs) {
      const artistData = { id: doc.id, ...doc.data() }
      
      // Count medley tracks
      const tracksQuery = query(
        collection(db, 'medleyTracks'),
        where('artistId', '==', doc.id)
      )
      const tracksSnapshot = await getDocs(tracksQuery)
      artistData.trackCount = tracksSnapshot.size
      
      artistsList.push(artistData)
    }
    
    artists.value = artistsList
  } catch (error) {
    console.error('Error loading artists:', error)
  } finally {
    loading.value = false
  }
}

const toggleGenre = (genre) => {
  const index = selectedGenres.value.indexOf(genre)
  if (index > -1) {
    selectedGenres.value.splice(index, 1)
  } else {
    selectedGenres.value.push(genre)
  }
}

const goToMedley = (artist) => {
  if (artist.customSlug) {
    router.push(`/${artist.customSlug}`)
  }
}
</script>

<style scoped>
.discover-page {
  min-height: 100vh;
  background: var(--bg-secondary);
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

.page-header p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* Search Section */
.search-section {
  margin-bottom: var(--spacing-2xl);
}

.search-box {
  position: relative;
  max-width: 600px;
  margin: 0 auto var(--spacing-lg) auto;
}

.search-icon {
  position: absolute;
  left: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-xl) + 20px);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-full);
  font-size: 1rem;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: border-color var(--transition-normal);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Genre Filters */
.genre-filters {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.genre-chip {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  border: 2px solid var(--border-primary);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.genre-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.genre-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-xl);
}

.artist-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.artist-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}

.artist-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.artist-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: var(--text-muted);
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.artist-card:hover .play-overlay {
  opacity: 1;
}

.artist-info {
  padding: var(--spacing-lg);
}

.artist-info h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.artist-genre {
  color: var(--color-primary);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-xs);
}

.artist-tracks {
  color: var(--text-muted);
  font-size: 0.85rem;
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

/* Loading */
.loading-container {
  text-align: center;
  padding: var(--spacing-2xl);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid var(--border-primary);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  margin: 0 auto var(--spacing-md);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>