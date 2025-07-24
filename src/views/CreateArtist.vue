<template>
  <div class="create-artist-page">
    <div class="page-container">
      <h1 class="page-title">Become an Artist</h1>
      <p class="page-subtitle">Start sharing your music with the world</p>

      <div class="form-card">
        <form @submit.prevent="createArtistProfile">
          <div class="form-group">
            <label class="form-label">Artist Name *</label>
            <input
              v-model="artistName"
              type="text"
              class="form-input"
              placeholder="Your artist name"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Genre</label>
            <select v-model="genre" class="form-input">
              <option value="">Select a genre</option>
              <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">PayPal Email *</label>
            <input
              v-model="paypalEmail"
              type="email"
              class="form-input"
              placeholder="your-paypal@email.com"
              required
            />
            <p class="form-hint">This is where you'll receive payments for track sales</p>
          </div>

          <div class="form-group">
            <label class="form-label">About You (Optional)</label>
            <textarea
              v-model="bio"
              class="form-input"
              rows="4"
              placeholder="Tell fans about your music..."
            ></textarea>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="form-actions">
            <router-link to="/studio" class="btn btn-secondary">
              Cancel
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <font-awesome-icon v-if="loading" :icon="['fas', 'spinner']" class="fa-spin mr-sm" />
              {{ loading ? 'Creating...' : 'Create Artist Profile' }}
            </button>
          </div>
        </form>
      </div>

      <div class="info-section">
        <h3>What you get with 4track:</h3>
        <ul class="feature-list">
          <li>
            <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            Upload up to 4 tracks to your medley
          </li>
          <li>
            <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            100% of sales go directly to your PayPal
          </li>
          <li>
            <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            Basic analytics (plays, hearts, revenue)
          </li>
          <li>
            <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            Share your medley with a simple link
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase'
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { authService } from '@/services/auth'
import { validateArtistName, validatePayPalEmail, formatSlug } from '@/utils/validators'

const router = useRouter()

const artistName = ref('')
const genre = ref('')
const paypalEmail = ref('')
const bio = ref('')
const error = ref('')
const loading = ref(false)

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B', 
  'Alternative', 'Jazz', 'Classical', 'Country', 'Latin',
  'Metal', 'Folk', 'Reggae', 'Blues', 'Soul'
]

const createArtistProfile = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('You must be logged in to create an artist profile')
    }
    
    // Validate inputs
    const nameValidation = validateArtistName(artistName.value)
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error)
    }
    
    const emailValidation = validatePayPalEmail(paypalEmail.value)
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error)
    }
    
    // Check if artist name is taken
    const nameQuery = query(
      collection(db, 'artistProfiles'),
      where('name', '==', artistName.value)
    )
    const nameSnapshot = await getDocs(nameQuery)
    
    if (!nameSnapshot.empty) {
      throw new Error('This artist name is already taken')
    }
    
    // Generate slug
    const customSlug = formatSlug(artistName.value)
    
    // Check if slug is taken
    const slugQuery = query(
      collection(db, 'artistProfiles'),
      where('customSlug', '==', customSlug)
    )
    const slugSnapshot = await getDocs(slugQuery)
    
    if (!slugSnapshot.empty) {
      throw new Error('This artist name generates a URL that is already in use')
    }
    
    // Create artist profile
    const artistId = doc(collection(db, 'artistProfiles')).id
    await setDoc(doc(db, 'artistProfiles', artistId), {
      name: artistName.value,
      genre: genre.value || null,
      paypalEmail: paypalEmail.value,
      bio: bio.value || null,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      platform: '4track',
      hasPublicMedley: false,
      customSlug: customSlug
    })
    
    // Update user to artist
    await authService.becomeArtist()
    
    // Redirect to medley manager
    router.push(`/artist/${artistId}/medley`)
  } catch (err) {
    error.value = err.message || 'Failed to create artist profile'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-artist-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: var(--spacing-xl);
}

.page-title {
  font-size: 2.5rem;
  text-align: center;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: var(--spacing-2xl);
}

.form-card {
  background: var(--bg-card);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
}

.info-section {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.info-section h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
}

.check-icon {
  color: var(--color-success);
  margin-top: 2px;
}

.mr-sm {
  margin-right: var(--spacing-sm);
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: center;
  margin-top: var(--spacing-md);
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>