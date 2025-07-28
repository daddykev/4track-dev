<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, auth } from '@/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { apiService } from '@/services/api'
import { formatAudioMetadata } from '@/utils/audioMetadata'
import AudioMeters from '@/components/AudioMeters.vue'
import AudioRTA from '@/components/AudioRTA.vue'

const route = useRoute()
const router = useRouter()

// State
const medley = ref(null)
const artist = ref(null)
const loading = ref(true)
const error = ref(null)
const currentTrack = ref(null)
const currentTrackIndex = ref(0)
const isPlaying = ref(false)
const audioContext = ref(null)
const audioElement = ref(null)
const mediaElementSource = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const currentUser = ref(null)
const heartedTracks = ref(new Set())
const heartingTrack = ref(null)
const showCopyModal = ref(false)
const downloadUrls = ref({})
const purchasingTrack = ref(null)
const purchaseError = ref(null)

// Add sessionId for analytics
const sessionId = ref(null)

// Add analyser node refs
const leftMetersAnalyser = ref(null)
const rightMetersAnalyser = ref(null)
const spectroscopeAnalyser = ref(null)

// Default fallback image - using a data URL for a simple placeholder
const DEFAULT_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23333"%2F%3E%3Cpath d="M200 140c-33.137 0-60 26.863-60 60s26.863 60 60 60 60-26.863 60-60-26.863-60-60-60zm0 100c-22.091 0-40-17.909-40-40s17.909-40 40-40 40 17.909 40 40-17.909 40-40 40z" fill="%23666"%2F%3E%3Cpath d="M200 180c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z" fill="%23999"%2F%3E%3C/svg%3E'

// Generate session ID
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Auth listener
onAuthStateChanged(auth, (user) => {
  currentUser.value = user
  if (user && medley.value) {
    loadHeartedTracks()
  }
})

const currentTrackMetadata = computed(() => {
  if (!currentTrack.value?.audioMetadata) return ''
  return formatAudioMetadata(currentTrack.value.audioMetadata)
})

// Computed
const coverImage = computed(() => {
  // Try to get cover image from various sources
  const url = medley.value?.coverUrl || 
              artist.value?.profileImageUrl || 
              artist.value?.coverImageUrl ||
              artist.value?.imageUrl ||
              DEFAULT_COVER
  return url
})

const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const formattedCurrentTime = computed(() => {
  return formatTime(currentTime.value)
})

const formattedDuration = computed(() => {
  return formatTime(duration.value)
})

const artistThumbnail = computed(() => {
  // Check for primary photo thumbnail first (from ArtistPhotos feature)
  if (artist.value?.primaryPhotoThumbnail) {
    return artist.value.primaryPhotoThumbnail
  }
  // Fall back to other image sources
  return artist.value?.profileImageUrl || 
         artist.value?.coverImageUrl ||
         artist.value?.imageUrl ||
         null
})

// Add image error handler
const handleImageError = (location, event) => {
  console.error(`Image failed to load at ${location}:`, event.target.src)
  // Set the fallback image
  event.target.src = DEFAULT_COVER
}

// Initialize analyser nodes
const initializeAnalysers = () => {
  if (!audioContext.value) return

  // Initialize meters analysers
  leftMetersAnalyser.value = audioContext.value.createAnalyser()
  leftMetersAnalyser.value.fftSize = 1024
  leftMetersAnalyser.value.smoothingTimeConstant = 0.5
  leftMetersAnalyser.value.minDecibels = -45
  leftMetersAnalyser.value.maxDecibels = 6

  rightMetersAnalyser.value = audioContext.value.createAnalyser()
  rightMetersAnalyser.value.fftSize = 1024
  rightMetersAnalyser.value.smoothingTimeConstant = 0.5
  rightMetersAnalyser.value.minDecibels = -45
  rightMetersAnalyser.value.maxDecibels = 6

  // Initialize spectroscope analyser
  spectroscopeAnalyser.value = audioContext.value.createAnalyser()
  spectroscopeAnalyser.value.fftSize = 16384
  spectroscopeAnalyser.value.minDecibels = -90
  spectroscopeAnalyser.value.maxDecibels = 0
  spectroscopeAnalyser.value.smoothingTimeConstant = 0.85
  spectroscopeAnalyser.value.channelCount = 2
  spectroscopeAnalyser.value.channelCountMode = 'explicit'
  spectroscopeAnalyser.value.channelInterpretation = 'discrete'
}

// Analytics helper function - simplified for medley pages
const trackAnalyticsEvent = async (eventType, eventMetadata = {}) => {
  if (!artist.value || !sessionId.value) return
  
  try {
    const analyticsData = {
      sessionId: sessionId.value,
      pageType: 'medley', // Use medley as page type
      artistId: artist.value.id,
      artistSlug: artist.value.customSlug,
      eventType: eventType,
      events: [{
        type: eventType,
        timestamp: Date.now(),
        metadata: eventMetadata
      }],
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      language: navigator.language,
      country: navigator.language.split('-')[1] || 'US'
    }
    
    // For now, just log the analytics locally
    // We'll fix the backend to handle medley page type
    console.log('Analytics event:', eventType, analyticsData)
    
    // Comment out the actual API call for now to avoid errors
    /*
    const response = await fetch('https://us-central1-fourtrack-os.cloudfunctions.net/collectAnalytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData),
      mode: 'cors'
    })
    
    if (!response.ok) {
      console.warn('Analytics response not OK:', response.status)
    }
    */
  } catch (err) {
    console.warn('Analytics error:', err)
  }
}

// Methods
const loadMedley = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Generate session ID if not already set
    if (!sessionId.value) {
      sessionId.value = generateSessionId()
    }
    
    let artistSlug = ''
    
    // Get the artist slug from route params
    artistSlug = route.params.artistSlug
    
    if (!artistSlug) {
      error.value = 'Invalid artist URL'
      return
    }
    
    // Find artist by slug
    const artistQuery = query(
      collection(db, 'artistProfiles'),
      where('customSlug', '==', artistSlug)
    )
    
    const artistSnapshot = await getDocs(artistQuery)
    
    if (artistSnapshot.empty) {
      error.value = 'Artist not found'
      return
    }
    
    artist.value = {
      id: artistSnapshot.docs[0].id,
      ...artistSnapshot.docs[0].data()
    }
    
    // Create a medley object from artist data
    medley.value = {
      id: artist.value.id,
      name: `${artist.value.name}'s Medley`,
      artistId: artist.value.id,
      coverUrl: artist.value.profileImageUrl || artist.value.coverImageUrl || artist.value.imageUrl,
      description: artist.value.bio || '',
      tracks: []
    }
    
    // Load medley tracks
    const tracksQuery = query(
      collection(db, 'medleyTracks'),
      where('artistId', '==', artist.value.id),
      orderBy('order', 'asc')
    )
    
    const tracksSnapshot = await getDocs(tracksQuery)
    medley.value.tracks = tracksSnapshot.docs.map(doc => {
      const trackData = {
        id: doc.id,
        ...doc.data()
      }
      return trackData
    })
    
    // Update page title
    document.title = `${artist.value.name} - Medley | 4track`
    
    // Track page view
    trackAnalyticsEvent('page_view', {
      pageTitle: document.title
    })
    
    // Load hearted tracks if user is logged in
    if (currentUser.value) {
      await loadHeartedTracks()
      await loadPurchasedTracks()
    }
    
    // Auto-play first track if available
    if (medley.value.tracks?.length > 0) {
      selectTrack(medley.value.tracks[0], 0)
    }
  } catch (err) {
    console.error('Error loading medley:', err)
    error.value = 'Failed to load medley'
  } finally {
    loading.value = false
  }
}

const loadHeartedTracks = async () => {
  if (!currentUser.value || !medley.value?.tracks) return
  
  try {
    // Load from userCollections
    const collectionQuery = query(
      collection(db, 'userCollections'),
      where('userEmail', '==', currentUser.value.email),
      where('artistId', '==', artist.value.id)
    )
    
    const collectionSnapshot = await getDocs(collectionQuery)
    const hearted = new Set()
    
    collectionSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.trackId) {
        hearted.add(data.trackId)
      }
    })
    
    heartedTracks.value = hearted
  } catch (err) {
    console.error('Error loading hearted tracks:', err)
  }
}

const selectTrack = (track, index) => {
  if (currentTrack.value?.id === track.id && isPlaying.value) {
    togglePlay()
  } else {
    currentTrack.value = track
    currentTrackIndex.value = index
    loadTrack(track)
  }
}

const loadTrack = async (track) => {
  if (!track.audioUrl) {
    console.error('No audio URL for track:', track)
    return
  }
  
  try {
    // Stop current playback if any
    stopPlayback()
    
    // Create or reuse HTML5 audio element
    if (!audioElement.value) {
      audioElement.value = new Audio()
      audioElement.value.crossOrigin = 'anonymous' // Required for CORS
      
      // Set up event listeners once
      audioElement.value.addEventListener('loadedmetadata', () => {
        duration.value = audioElement.value.duration
      })
      
      audioElement.value.addEventListener('timeupdate', () => {
        currentTime.value = audioElement.value.currentTime
      })
      
      audioElement.value.addEventListener('ended', async () => {
        if (isPlaying.value) {
          isPlaying.value = false
          await nextTrack()
        }
      })
      
      audioElement.value.addEventListener('error', (e) => {
        console.error('Audio loading error:', e)
        error.value = 'Failed to load audio'
      })
    }
    
    // Set the new source
    audioElement.value.src = track.audioUrl
    audioElement.value.load() // Force reload
    
    // Initialize Web Audio API context if needed
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
      initializeAnalysers()
    }
    
    // Create MediaElementSource from HTML5 audio (only once per audio element)
    if (!mediaElementSource.value && audioElement.value) {
      mediaElementSource.value = audioContext.value.createMediaElementSource(audioElement.value)
      
      // Create a channel splitter for stereo analysis
      const splitter = audioContext.value.createChannelSplitter(2)
      
      // Connect source to splitter
      mediaElementSource.value.connect(splitter)
      
      // Connect left channel to left meters analyser
      splitter.connect(leftMetersAnalyser.value, 0)
      
      // Connect right channel to right meters analyser
      splitter.connect(rightMetersAnalyser.value, 1)
      
      // Connect source directly to spectroscope (for stereo analysis)
      mediaElementSource.value.connect(spectroscopeAnalyser.value)
      
      // Connect to destination for audio output
      mediaElementSource.value.connect(audioContext.value.destination)
    }
    
    // Reset time values
    currentTime.value = 0
    
  } catch (err) {
    console.error('Error loading track:', err)
    error.value = 'Failed to load track'
  }
}

const startPlayback = async () => {
  if (!audioElement.value || !currentTrack.value) return
  
  try {
    // Resume audio context if suspended (required for some browsers)
    if (audioContext.value && audioContext.value.state === 'suspended') {
      await audioContext.value.resume()
    }
    
    await audioElement.value.play()
    isPlaying.value = true
    
    // Track play event
    trackAnalyticsEvent('play', {
      trackId: currentTrack.value.id,
      trackTitle: currentTrack.value.title
    })
  } catch (error) {
    console.error('Playback error:', error)
    isPlaying.value = false
    if (error.name === 'NotAllowedError') {
      error.value = 'Please click play to start audio'
    }
  }
}

const stopPlayback = () => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
  }
  isPlaying.value = false
}

const togglePlay = () => {
  if (isPlaying.value) {
    pausePlayback()
  } else {
    startPlayback()
  }
}

const pausePlayback = () => {
  if (audioElement.value) {
    audioElement.value.pause()
  }
  isPlaying.value = false
  
  // Track pause event
  if (currentTrack.value) {
    trackAnalyticsEvent('pause', {
      trackId: currentTrack.value.id,
      currentTime: currentTime.value
    })
  }
}

const seekToPosition = (event) => {
  if (!audioElement.value || !duration.value) return
  
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))
  audioElement.value.currentTime = percentage * duration.value
}

const previousTrack = async () => {
  if (currentTrackIndex.value > 0) {
    const prevIndex = currentTrackIndex.value - 1
    await selectTrack(medley.value.tracks[prevIndex], prevIndex)
    if (isPlaying.value) {
      await startPlayback()
    }
  }
}

const nextTrack = async () => {
  if (currentTrackIndex.value < medley.value.tracks.length - 1) {
    const nextIndex = currentTrackIndex.value + 1
    await selectTrack(medley.value.tracks[nextIndex], nextIndex)
    // Auto-play next track
    await startPlayback()
  } else {
    // End of playlist
    stopPlayback()
  }
}

const toggleHeart = async (track) => {
  if (!currentUser.value) {
    router.push('/login')
    return
  }
  
  heartingTrack.value = track.id
  
  try {
    // Check if already in collection
    const collectionQuery = query(
      collection(db, 'userCollections'),
      where('userEmail', '==', currentUser.value.email),
      where('trackId', '==', track.id)
    )
    
    const collectionSnapshot = await getDocs(collectionQuery)
    
    if (!collectionSnapshot.empty) {
      // Remove from collection
      for (const doc of collectionSnapshot.docs) {
        await apiService.removeFromCollection(doc.id)
      }
      heartedTracks.value.delete(track.id)
    } else {
      // Add to collection
      await addDoc(collection(db, 'userCollections'), {
        userId: currentUser.value.uid,
        userEmail: currentUser.value.email,
        trackId: track.id,
        artistId: artist.value.id,
        timestamp: serverTimestamp(),
        type: 'hearted',
        isPurchased: false
      })
      heartedTracks.value.add(track.id)
    }
  } catch (err) {
    console.error('Error toggling heart:', err)
  } finally {
    heartingTrack.value = null
  }
}

const purchaseTrack = async (track) => {
  if (!currentUser.value) {
    router.push(`/login?return=${encodeURIComponent(window.location.pathname)}`)
    return
  }
  
  purchasingTrack.value = track.id
  purchaseError.value = null
  
  try {
    const result = await apiService.createMedleyPayPalOrder(
      medley.value.id,
      track.id
    )
    
    if (result.approveUrl) {
      window.location.href = result.approveUrl
    }
  } catch (err) {
    console.error('Purchase error:', err)
    purchaseError.value = err.message || 'Failed to create checkout session'
    purchasingTrack.value = null
  }
}

const downloadFreeTrack = async (track) => {
  if (!currentUser.value) {
    router.push(`/login?return=${encodeURIComponent(window.location.pathname)}`)
    return
  }
  
  purchasingTrack.value = track.id
  purchaseError.value = null
  
  try {
    const result = await apiService.processFreeDownload(
      medley.value.id,
      track.id
    )
    
    if (result.downloadUrl) {
      downloadUrls.value[track.id] = result.downloadUrl
      window.open(result.downloadUrl, '_blank')
    }
  } catch (err) {
    console.error('Download error:', err)
    purchaseError.value = err.message || 'Failed to process download'
  } finally {
    purchasingTrack.value = null
  }
}

// Helper functions
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Load purchased tracks on mount
const loadPurchasedTracks = async () => {
  // Add guards to ensure both values exist
  if (!currentUser.value || !medley.value || !medley.value.id) return
  
  try {
    // Check purchases collection for this user's purchases
    const purchasesQuery = query(
      collection(db, 'medleyRoyalties'),
      where('payerEmail', '==', currentUser.value.email),
      where('artistId', '==', medley.value.id),
      where('type', 'in', ['purchase', 'free_download'])
    )
    
    const purchasesSnapshot = await getDocs(purchasesQuery)
    purchasesSnapshot.forEach(doc => {
      const purchase = doc.data()
      if (purchase.trackId && purchase.downloadUrl) {
        downloadUrls.value[purchase.trackId] = purchase.downloadUrl
      }
    })
  } catch (err) {
    console.error('Error loading purchased tracks:', err)
  }
}

// Lifecycle
onMounted(() => {
  loadMedley()
})

onUnmounted(() => {
  // Clean up audio element
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
  }
  
  // Clean up audio context
  if (audioContext.value && audioContext.value.state !== 'closed') {
    audioContext.value.close()
  }
})

// Watch for auth changes
watch(() => currentUser.value, async (newUser) => {
  if (newUser && medley.value && medley.value.id) {
    await loadHeartedTracks()
    await loadPurchasedTracks()
  }
})
</script>

<template>
  <div class="medley-page">
    <!-- Simplified Header Section -->
    <div v-if="artist" class="artist-header-bar">
      <div class="artist-info-compact">
        <div class="artist-identity">
          <img 
            v-if="artistThumbnail"
            :src="artistThumbnail" 
            :alt="artist.name"
            class="artist-avatar"
            @error="handleImageError('artist-avatar', $event)"
          />
          <div v-else class="artist-avatar-placeholder">
            <font-awesome-icon :icon="['fas', 'user']" />
          </div>
          <h2 class="artist-name">{{ artist.name }}</h2>
        </div>
      </div>
    </div>

    <!-- Main Content - Now Playing Centered -->
    <div v-if="medley" class="main-content-centered">
      <!-- Now Playing - Primary Focus -->
      <div v-if="currentTrack" class="now-playing-primary">
        <div class="now-playing-container">
          <div class="cover-and-info">
            <img 
              :src="currentTrack.artworkUrl || coverImage" 
              :alt="currentTrack.title || currentTrack.name"
              class="now-playing-cover"
              @error="handleImageError(`now-playing-${currentTrack.id}`, $event)"
            />
            
            <div class="track-details">
              <h1 class="now-playing-title">{{ currentTrack.title || currentTrack.name }}</h1>
              <p class="now-playing-artist">{{ currentTrack.artistName || artist?.name }}</p>
              
              <!-- Purchase/Download Section -->
              <div v-if="currentTrack.allowDownload" class="download-section">
                <button
                  v-if="!downloadUrls[currentTrack.id] && currentTrack.price > 0"
                  @click="purchaseTrack(currentTrack)"
                  :disabled="purchasingTrack === currentTrack.id"
                  class="download-btn"
                >
                  <font-awesome-icon 
                    :icon="purchasingTrack === currentTrack.id ? ['fas', 'spinner'] : ['fas', 'download']" 
                    :class="{ 'fa-spin': purchasingTrack === currentTrack.id }"
                  />
                  {{ purchasingTrack === currentTrack.id ? 'Processing...' : 
                     `Download $${currentTrack.price.toFixed(2)}` }}
                </button>
                
                <button
                  v-else-if="!downloadUrls[currentTrack.id] && currentTrack.price === 0"
                  @click="downloadFreeTrack(currentTrack)"
                  :disabled="purchasingTrack === currentTrack.id"
                  class="download-btn"
                >
                  <font-awesome-icon 
                    :icon="purchasingTrack === currentTrack.id ? ['fas', 'spinner'] : ['fas', 'download']" 
                    :class="{ 'fa-spin': purchasingTrack === currentTrack.id }"
                  />
                  {{ purchasingTrack === currentTrack.id ? 'Processing...' : 'Free Download' }}
                </button>
                
                <button
                  v-else
                  @click="window.open(downloadUrls[currentTrack.id], '_blank')"
                  class="download-btn"
                >
                  <font-awesome-icon :icon="['fas', 'download']" />
                  Download Again
                </button>
              </div>
              
              <span v-if="!currentTrack.allowDownload" class="stream-only-badge">
                <font-awesome-icon :icon="['fas', 'lock']" />
                Stream Only
              </span>
              
              <div v-if="purchaseError" class="error-message mt-md">
                {{ purchaseError }}
              </div>
            </div>
          </div>

          <!-- Audio Visualizations Row -->
          <div class="audio-visualizations-row">
            <AudioRTA 
              :analyser-node="spectroscopeAnalyser"
              :is-playing="isPlaying"
            />
            
            <!-- Tape Machine Animation -->
            <div class="tape-machine-animation" :class="{ 
              'playing': isPlaying 
            }">
              <div class="tape-reels">
                <div class="reel supply-reel">
                  <div class="wedge wedge-1"></div>
                  <div class="wedge wedge-2"></div>
                  <div class="wedge wedge-3"></div>
                  <div class="reel-ring"></div>
                  <div class="center-hole"></div>
                </div>
                <div class="reel take-up-reel">
                  <div class="wedge wedge-1"></div>
                  <div class="wedge wedge-2"></div>
                  <div class="wedge wedge-3"></div>
                  <div class="reel-ring"></div>
                  <div class="center-hole"></div>
                </div>
                <div class="tape-path"></div>
              </div>
            </div>
            
            <AudioMeters
              :left-analyser-node="leftMetersAnalyser"
              :right-analyser-node="rightMetersAnalyser"
              :is-playing="isPlaying"
            />
          </div>

          <!-- Audio Format Info - NEW -->
          <div v-if="currentTrackMetadata" class="audio-format-info">
            {{ currentTrackMetadata }}
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-container">
            <span class="time-label">{{ formattedCurrentTime }}</span>
            <div class="progress-bar" @click="seekToPosition">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
            <span class="time-label">{{ formattedDuration }}</span>
          </div>

          <!-- Control Buttons -->
          <div class="control-buttons">
            <button 
              @click="previousTrack" 
              class="control-btn"
              :disabled="currentTrackIndex === 0"
            >
              <font-awesome-icon :icon="['fas', 'backward']" />
            </button>
            
            <button 
              @click="togglePlay" 
              class="control-btn play-btn"
              :disabled="!currentTrack"
            >
              <font-awesome-icon :icon="isPlaying ? ['fas', 'pause'] : ['fas', 'play']" />
            </button>
            
            <button 
              @click="nextTrack" 
              class="control-btn"
              :disabled="currentTrackIndex >= medley.tracks.length - 1"
            >
              <font-awesome-icon :icon="['fas', 'forward']" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty Now Playing State -->
      <div v-else class="now-playing-empty">
        <div class="empty-player-message">
          <font-awesome-icon :icon="['fas', 'music']" class="empty-icon" />
          <p>Select a track to start playing</p>
        </div>
      </div>

      <!-- Track List - Below Now Playing -->
      <div class="track-list-section">
        <h3 class="section-title">
          <font-awesome-icon :icon="['fas', 'list']" />
          Tracks
        </h3>
        
        <div v-if="medley.tracks?.length" class="track-list">
          <div 
            v-for="(track, index) in medley.tracks" 
            :key="track.id"
            class="track-item"
            :class="{ 'active': currentTrack?.id === track.id, 'playing': currentTrack?.id === track.id && isPlaying }"
            @click="selectTrack(track, index)"
          >
            <div class="track-number">
              <span v-if="currentTrack?.id !== track.id || !isPlaying">{{ index + 1 }}</span>
              <font-awesome-icon v-else :icon="['fas', 'volume-up']" class="playing-icon" />
            </div>
            
            <img 
              :src="track.artworkUrl || coverImage" 
              :alt="track.title || track.name"
              class="track-cover"
              @error="handleImageError(`track-${track.id}`, $event)"
            />
            
            <div class="track-info">
              <h4 class="track-name">{{ track.title || track.name }}</h4>
              <div class="track-meta">
                <span class="track-artist">{{ track.artistName || artist?.name }}</span>
                <span class="track-duration">{{ formatDuration(track.duration) }}</span>
              </div>
              <div v-if="track.collaborators && track.collaborators.length > 1" class="track-collaborators">
                <span class="collab-label">feat.</span>
                <span class="collab-names">
                  {{ track.collaborators
                      .filter(c => !c.isPrimary)
                      .map(c => c.name)
                      .join(', ') }}
                </span>
              </div>
            </div>
            
            <div class="track-item-actions">
              <button
                @click.stop="toggleHeart(track)"
                :disabled="heartingTrack === track.id"
                class="heart-btn-small"
                :class="{ 'hearted': heartedTracks.has(track.id) }"
              >
                <font-awesome-icon 
                  :icon="heartingTrack === track.id ? ['fas', 'spinner'] : ['fas', 'heart']"
                  :class="{ 'fa-spin': heartingTrack === track.id }"
                />
              </button>
              
              <span v-if="track.price > 0" class="price-tag">
                ${{ track.price.toFixed(2) }}
              </span>
              <span v-else-if="track.allowDownload" class="free-tag">
                Free
              </span>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-tracks">
          <p>No tracks in this medley yet.</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-container">
      <div class="loading-spinner">
        <font-awesome-icon :icon="['fas', 'spinner']" class="fa-spin" />
      </div>
      <p>Loading medley...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <h2>Error Loading Medley</h2>
        <p>{{ error }}</p>
        <router-link to="/discover" class="btn btn-primary mt-md">
          Discover Music
        </router-link>
      </div>
    </div>

    <!-- Copy success modal -->
    <div v-if="showCopyModal" class="modal-overlay" @click="showCopyModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Link Copied!</h3>
          <button @click="showCopyModal = false" class="close-btn">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>
        </div>
        <div class="modal-content">
          <p>The medley URL has been copied to your clipboard.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base Styles */
.medley-page {
  min-height: 100vh;
  background: #0f0f1e;
  color: #ffffff;
}

/* Enhanced Artist Header with reduced vertical spacing */
.artist-header-bar {
  background: transparent;
  padding: var(--spacing-xl) 0;
  margin-bottom: var(--spacing-2xl);
  display: flex;
  align-items: center;
}

.artist-info-compact {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  display: flex;
  justify-content: center;
  width: 100%;
}

.artist-identity {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.artist-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.artist-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 2rem;
}

.artist-name {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Main Content Centered Layout */
.main-content-centered {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--spacing-2xl) var(--spacing-2xl);
}

/* Now Playing Primary */
.now-playing-primary {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: var(--spacing-2xl);
}

.now-playing-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.cover-and-info {
  display: flex;
  gap: var(--spacing-2xl);
  align-items: flex-start;
}

.now-playing-cover {
  width: 300px;
  height: 300px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  background-color: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.track-details {
  flex: 1;
  min-width: 0;
}

.now-playing-title {
  color: #ffffff;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.2;
}

.now-playing-artist {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.25rem;
  margin: 0 0 var(--spacing-xl) 0;
}

/* Empty Now Playing */
.now-playing-empty {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: var(--spacing-2xl);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-player-message {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

/* Download Section */
.download-section {
  margin-top: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.download-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.download-btn:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
}

.download-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.stream-only-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin-top: var(--spacing-md);
}

/* Audio Visualizations Row */
.audio-visualizations-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin: var(--spacing-xl) 0;
  padding: 0;
}

/* Tape Machine Animation */
.tape-machine-animation {
  width: auto;
  height: 100px;
  margin: 0;
  position: relative;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.tape-machine-animation .supply-reel,
.tape-machine-animation .take-up-reel {
  animation-play-state: paused;
}

.tape-machine-animation.playing .supply-reel,
.tape-machine-animation.playing .take-up-reel {
  animation-play-state: running;
}

.tape-reels {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  gap: 4px;
}

.reel {
  width: 98px;
  height: 98px;
  background-color: #667eea;
  border-radius: 50%;
  position: relative;
  overflow: visible;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
  transition: animation-play-state 0.3s ease;
}

.supply-reel {
  animation: rotate-ccw 4.2s linear infinite;
  animation-play-state: paused;
}

.take-up-reel {
  animation: rotate-ccw 4s linear infinite;
  animation-play-state: paused;
}

.reel-ring {
  position: absolute;
  width: 32px;
  height: 32px;
  background-color: #667eea;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}

.center-hole {
  position: absolute;
  width: 24px;
  height: 24px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
}

.wedge {
  position: absolute;
  background-color: #2a1e17;
  width: 25px;
  height: 38px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  transform-origin: bottom center;
  clip-path: polygon(0% 0%, 100% 0%, 65% 100%, 35% 100%);
  z-index: 2;
}

.wedge-1 {
  transform: translate(-50%, -100%);
}

.wedge-2 {
  transform: translate(-50%, -100%) rotate(120deg);
}

.wedge-3 {
  transform: translate(-50%, -100%) rotate(240deg);
}

.tape-path {
  height: 4px;
  background-color: #222;
  position: absolute;
  width: calc(100% - 82px);
  top: 92%;
  left: 41px;
  z-index: 0;
  background-image: repeating-linear-gradient(
    to right,
    transparent 0px,
    transparent 15px,
    #ffe066 15px,
    #ffe066 17px,
    transparent 17px,
    transparent 35px,
    rgba(255, 224, 102, 0.5) 35px,
    rgba(255, 224, 102, 0.5) 36px,
    transparent 36px,
    transparent 50px
  );
  background-size: 52px 100%;
  animation: tape-movement 4.2s linear infinite;
  animation-play-state: paused;
  border-top: 1px solid rgba(255,255,255,0.2);
  border-bottom: 1px solid rgba(0,0,0,0.3);
}

.tape-machine-animation.playing .tape-path {
  animation-play-state: running;
}

@keyframes tape-movement {
  from { background-position: -52px 0; }
  to { background-position: 0 0; }
}

@keyframes rotate-ccw {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

/* Progress Bar */
.progress-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm); /* Changed from var(--spacing-lg) */
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  border-radius: 3px;
  transition: width 0.1s linear;
}

.time-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  min-width: 40px;
}

/* Control Buttons */
.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  color: #ffffff;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-btn {
  width: 56px;
  height: 56px;
  background: #667eea;
}

.play-btn:hover:not(:disabled) {
  background: #5568d3;
}

/* Track List Section */
.track-list-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  color: #ffffff;
  font-size: 1.25rem;
  margin: 0 0 var(--spacing-lg) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.track-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid transparent;
}

.track-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}

.track-item.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.track-item.playing {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.5);
}

.playing-icon {
  color: #667eea;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.track-number {
  width: 30px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.track-cover {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background-color: rgba(255, 255, 255, 0.1);
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-name {
  color: #ffffff;
  font-weight: 500;
  margin: 0 0 var(--spacing-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.track-artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-duration {
  flex-shrink: 0;
}

.empty-tracks {
  text-align: center;
  padding: var(--spacing-2xl);
  color: rgba(255, 255, 255, 0.5);
}

/* Track Item Actions */
.track-item-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.heart-btn-small {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-normal);
}

.heart-btn-small:hover {
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.heart-btn-small.hearted {
  color: #dc3545;
}

.heart-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.price-tag {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
}

.free-tag {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
}

/* Error Message */
.error-message {
  background: rgba(220, 53, 69, 0.2);
  color: #ff6b6b;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1a1a2e;
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: #ffffff;
  margin: 0;
}

.modal-content {
  padding: var(--spacing-lg);
  color: rgba(255, 255, 255, 0.8);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: color var(--transition-normal);
}

.close-btn:hover {
  color: #ffffff;
}

.track-collaborators {
  margin-top: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  gap: var(--spacing-xs);
}

.collab-label {
  opacity: 0.7;
  font-style: italic;
}

.collab-names {
  color: var(--text-primary);
}

.audio-format-info {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin-bottom: var(--spacing-sm); /* Changed from var(--spacing-lg) */
  /* Removed font-family to use default */
  letter-spacing: 0.5px;
}

/* Loading & Error States */
.loading-container,
.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.loading-container {
  flex-direction: column;
  gap: var(--spacing-md);
  color: #ffffff;
}

.loading-spinner {
  font-size: 2rem;
  color: #667eea;
}

.error-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 500px;
}

.error-content h2 {
  color: #ffffff;
  font-size: 1.5rem;
  margin: 0 0 var(--spacing-md) 0;
}

.error-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 var(--spacing-lg) 0;
}

/* Utility Classes */
.mt-md {
  margin-top: var(--spacing-md);
}

/* Responsive Design */
@media (max-width: 768px) {
  .artist-header-bar {
    padding: var(--spacing-lg) 0;
    margin-bottom: var(--spacing-xl);
  }
  
  .artist-info-compact {
    padding: 0 var(--spacing-lg);
  }
  
  .artist-avatar {
    width: 60px;
    height: 60px;
  }
  
  .artist-avatar-placeholder {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .artist-name {
    font-size: 1.75rem;
  }
  
  .main-content-centered {
    padding: var(--spacing-lg);
  }
  
  .cover-and-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .now-playing-cover {
    width: 250px;
    height: 250px;
  }
  
  .now-playing-title {
    font-size: 1.5rem;
  }
  
  .now-playing-artist {
    font-size: 1rem;
  }
  
  .download-section {
    align-items: center;
    width: 100%;
  }
  
  .download-btn {
    width: 100%;
    justify-content: center;
  }
  
  /* Stack visualizations on mobile */
  .audio-visualizations-row {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  /* Make tape machine full width on mobile */
  .tape-machine-animation {
    width: 100%;
  }
  
  .track-item {
    padding: var(--spacing-sm);
  }
  
  .track-cover {
    width: 40px;
    height: 40px;
  }
  
  .control-buttons {
    gap: var(--spacing-md);
  }
  
  .control-btn {
    width: 40px;
    height: 40px;
  }
  
  .play-btn {
    width: 48px;
    height: 48px;
  }
}

@media (max-width: 480px) {
  .artist-header-bar {
    padding: var(--spacing-md) 0;
    margin-bottom: var(--spacing-lg);
  }
  
  .artist-info-compact {
    padding: 0 var(--spacing-md);
  }
  
  .artist-avatar {
    width: 50px;
    height: 50px;
    border-width: 2px;
  }
  
  .artist-avatar-placeholder {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
  
  .artist-name {
    font-size: 1.5rem;
  }
  
  .main-content-centered {
    padding: var(--spacing-md);
  }
  
  .now-playing-primary,
  .track-list-section {
    padding: var(--spacing-md);
  }
  
  .now-playing-cover {
    width: 200px;
    height: 200px;
  }
  
  .now-playing-title {
    font-size: 1.25rem;
  }
  
  .track-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style>