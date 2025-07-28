<template>
  <div class="feed-player" :class="{ 'visible': isVisible }">
    <div class="player-container">
      <!-- Close button -->
      <button @click="$emit('close')" class="close-player-btn">
        <font-awesome-icon :icon="['fas', 'times']" />
      </button>

      <!-- Main player content -->
      <div class="player-content">
        <!-- Track Info Section -->
        <div class="track-info-section">
          <img 
            v-if="currentTrack?.artworkUrl" 
            :src="currentTrack.artworkUrl" 
            :alt="currentTrack.title"
            class="track-artwork"
            @error="handleImageError"
          />
          <div v-else class="track-artwork-placeholder">
            <font-awesome-icon :icon="['fas', 'music']" />
          </div>
          
          <div class="track-details">
            <h4 class="track-title">{{ currentTrack?.title || 'No track selected' }}</h4>
            <router-link 
              v-if="currentTrack?.artistId && currentTrack?.customSlug" 
              :to="`/${currentTrack.customSlug}`"
              class="track-artist-link"
            >
              {{ currentTrack?.artistName }}
            </router-link>
            <span v-else class="track-artist">{{ currentTrack?.artistName || '' }}</span>
          </div>
          
          <!-- Price/Action buttons -->
          <div class="track-actions">
            <button 
              @click="toggleHeart"
              :disabled="heartingTrack"
              class="action-btn heart-btn"
              :class="{ 'hearted': isHearted }"
            >
              <font-awesome-icon 
                :icon="heartingTrack ? ['fas', 'spinner'] : ['fas', 'heart']"
                :class="{ 'fa-spin': heartingTrack }"
              />
            </button>
            
            <button 
              v-if="currentTrack?.price > 0"
              @click="purchaseTrack"
              :disabled="purchasingTrack"
              class="action-btn purchase-btn"
            >
              <font-awesome-icon 
                :icon="purchasingTrack ? ['fas', 'spinner'] : ['fas', 'download']"
                :class="{ 'fa-spin': purchasingTrack }"
              />
              ${{ currentTrack.price.toFixed(2) }}
            </button>
            
            <button 
              v-else-if="currentTrack?.price === 0"
              @click="downloadFreeTrack"
              :disabled="purchasingTrack"
              class="action-btn free-btn"
            >
              <font-awesome-icon 
                :icon="purchasingTrack ? ['fas', 'spinner'] : ['fas', 'download']"
                :class="{ 'fa-spin': purchasingTrack }"
              />
              FREE
            </button>
          </div>
        </div>

        <!-- Playback Controls Section (tape machine, progress, transport all in one row) -->
        <div class="playback-controls-section">
          <!-- Tape Machine Animation -->
          <div class="tape-machine-animation" :class="{ 'playing': isPlaying }">
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

          <!-- Progress Bar -->
          <div class="progress-section">
            <span class="time-label">{{ formattedCurrentTime }}</span>
            <div class="progress-bar" @click="seekToPosition">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
            <span class="time-label">{{ formattedDuration }}</span>
          </div>

          <!-- Transport Controls -->
          <div class="transport-controls">
            <button 
              @click="previousTrack" 
              class="control-btn"
              :disabled="!hasPrevious"
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
              :disabled="!hasNext"
            >
              <font-awesome-icon :icon="['fas', 'forward']" />
            </button>
          </div>
        </div>

        <!-- Queue Info -->
        <div class="queue-info">
          <span class="queue-position">
            {{ currentIndex + 1 }} / {{ queue.length }}
          </span>
          <span class="queue-label">in queue</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { apiService } from '@/services/api'

// Props
const props = defineProps({
  currentTrack: Object,
  queue: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'track-change', 'update:currentIndex'])

// Router
const router = useRouter()

// Audio state
const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// User state
const currentUser = ref(null)
const isHearted = ref(false)
const heartingTrack = ref(false)
const purchasingTrack = ref(false)

// Initialize audio element
const initAudio = () => {
  if (!audioElement.value) {
    audioElement.value = new Audio()
    audioElement.value.crossOrigin = 'anonymous'
    
    // Event listeners
    audioElement.value.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.value.duration
    })
    
    audioElement.value.addEventListener('timeupdate', () => {
      currentTime.value = audioElement.value.currentTime
    })
    
    audioElement.value.addEventListener('ended', () => {
      if (hasNext.value) {
        nextTrack()
      } else {
        isPlaying.value = false
      }
    })
    
    audioElement.value.addEventListener('error', (e) => {
      console.error('Audio loading error:', e)
      isPlaying.value = false
    })
  }
}

// Auth listener
onAuthStateChanged(auth, (user) => {
  currentUser.value = user
  if (user && props.currentTrack) {
    checkIfHearted()
  }
})

// Computed
const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

const hasPrevious = computed(() => props.currentIndex > 0)
const hasNext = computed(() => props.currentIndex < props.queue.length - 1)

// Watch for track changes
watch(() => props.currentTrack, (newTrack) => {
  if (newTrack) {
    loadTrack(newTrack)
    checkIfHearted()
  }
})

// Methods
const loadTrack = async (track) => {
  if (!track?.audioUrl) return
  
  initAudio()
  
  // Stop current playback
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
  }
  
  // Load new track
  audioElement.value.src = track.audioUrl
  audioElement.value.load()
  currentTime.value = 0
  
  // Auto-play
  startPlayback()
  
  // Track analytics
  apiService.trackEvent('play', 'track', track.id, {
    trackTitle: track.title,
    source: 'discover_feed'
  })
}

const startPlayback = async () => {
  if (!audioElement.value || !props.currentTrack) return
  
  try {
    await audioElement.value.play()
    isPlaying.value = true
  } catch (error) {
    console.error('Playback error:', error)
    isPlaying.value = false
  }
}

const togglePlay = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
    isPlaying.value = false
  } else {
    startPlayback()
  }
}

const seekToPosition = (event) => {
  if (!audioElement.value || !duration.value) return
  
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))
  audioElement.value.currentTime = percentage * duration.value
}

const previousTrack = () => {
  if (!hasPrevious.value) return
  const newIndex = props.currentIndex - 1
  emit('update:currentIndex', newIndex)
  emit('track-change', props.queue[newIndex])
}

const nextTrack = () => {
  if (!hasNext.value) return
  const newIndex = props.currentIndex + 1
  emit('update:currentIndex', newIndex)
  emit('track-change', props.queue[newIndex])
}

const checkIfHearted = async () => {
  if (!currentUser.value || !props.currentTrack) return
  
  try {
    const collectionQuery = query(
      collection(db, 'userCollections'),
      where('userEmail', '==', currentUser.value.email),
      where('trackId', '==', props.currentTrack.id)
    )
    
    const snapshot = await getDocs(collectionQuery)
    isHearted.value = !snapshot.empty
  } catch (error) {
    console.error('Error checking heart status:', error)
  }
}

const toggleHeart = async () => {
  if (!currentUser.value) {
    router.push('/login')
    return
  }
  
  heartingTrack.value = true
  
  try {
    if (isHearted.value) {
      // Remove from collection
      const collectionQuery = query(
        collection(db, 'userCollections'),
        where('userEmail', '==', currentUser.value.email),
        where('trackId', '==', props.currentTrack.id)
      )
      
      const snapshot = await getDocs(collectionQuery)
      for (const doc of snapshot.docs) {
        await apiService.removeFromCollection(doc.id)
      }
      
      isHearted.value = false
    } else {
      // Add to collection
      await addDoc(collection(db, 'userCollections'), {
        userId: currentUser.value.uid,
        userEmail: currentUser.value.email,
        trackId: props.currentTrack.id,
        artistId: props.currentTrack.artistId,
        timestamp: serverTimestamp(),
        type: 'hearted',
        isPurchased: false
      })
      
      isHearted.value = true
    }
  } catch (error) {
    console.error('Error toggling heart:', error)
  } finally {
    heartingTrack.value = false
  }
}

const purchaseTrack = async () => {
  if (!currentUser.value) {
    router.push(`/login?return=${encodeURIComponent(window.location.pathname)}`)
    return
  }
  
  // Navigate to artist medley page for purchase
  if (props.currentTrack.customSlug) {
    router.push(`/${props.currentTrack.customSlug}`)
  }
}

const downloadFreeTrack = async () => {
  if (!currentUser.value) {
    router.push(`/login?return=${encodeURIComponent(window.location.pathname)}`)
    return
  }
  
  purchasingTrack.value = true
  
  try {
    const result = await apiService.processFreeDownload(
      props.currentTrack.artistId,
      props.currentTrack.id
    )
    
    if (result.downloadUrl) {
      window.open(result.downloadUrl, '_blank')
    }
  } catch (error) {
    console.error('Download error:', error)
  } finally {
    purchasingTrack.value = false
  }
}

// Utility functions
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23333"%2F%3E%3C/svg%3E'
}

// Cleanup
onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
  }
})
</script>

<style scoped>
/* Feed Player Container */
.feed-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 100;
}

.feed-player.visible {
  transform: translateY(0);
}

.player-container {
  position: relative;
  max-width: 1800px;
  margin: 0 auto;
  padding: var(--spacing-lg) var(--spacing-xl);
}

/* Close Button */
.close-player-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-player-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Player Content Layout */
.player-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  height: 100px;
}

/* Track Info Section */
.track-info-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 300px;
  flex-shrink: 0;
}

.track-artwork {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.track-artwork-placeholder {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 1.5rem;
}

.track-details {
  flex: 1;
  min-width: 0;
}

.track-title {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--spacing-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist-link,
.track-artist {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s;
}

.track-artist-link:hover {
  color: #667eea;
}

/* Track Actions */
.track-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  font-size: 0.875rem;
}

.heart-btn:hover {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.heart-btn.hearted {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.purchase-btn {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.purchase-btn:hover {
  background: rgba(102, 126, 234, 0.3);
}

.free-btn {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.free-btn:hover {
  background: rgba(40, 167, 69, 0.3);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Playback Controls Section - All in one row */
.playback-controls-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  justify-content: center;
}

/* Tape Machine Animation - Original size from MedleyPage */
.tape-machine-animation {
  width: auto;
  height: 100px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
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

/* Progress Section */
.progress-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  max-width: 400px;
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
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  min-width: 35px;
}

/* Transport Controls */
.transport-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
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

/* Queue Info */
.queue-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  flex-shrink: 0;
}

.queue-position {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.queue-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .track-info-section {
    min-width: 250px;
  }
  
  .playback-controls-section {
    gap: var(--spacing-md);
  }
}

@media (max-width: 1024px) {
  .player-content {
    gap: var(--spacing-md);
  }
  
  .tape-machine-animation {
    display: none;
  }
}

@media (max-width: 768px) {
  .player-container {
    padding: var(--spacing-md);
  }
  
  .player-content {
    flex-wrap: wrap;
    height: auto;
    gap: var(--spacing-md);
  }
  
  .track-info-section {
    width: 100%;
    min-width: unset;
  }
  
  .playback-controls-section {
    width: 100%;
    justify-content: space-between;
  }
  
  .progress-section {
    max-width: none;
  }
  
  .queue-info {
    display: none;
  }
}

@media (max-width: 480px) {
  .track-actions {
    margin-left: auto;
  }
}
</style>