<template>
  <div class="create-artist-page">
    <div class="page-container">
      <h1 class="page-title">Apply to Become an Artist</h1>
      <p class="page-subtitle">Submit your application to start sharing your music</p>

      <div class="form-card">
        <form @submit.prevent="submitApplication">
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
            <label class="form-label">Why do you want to join 4track?</label>
            <textarea
              v-model="applicationReason"
              class="form-input"
              rows="4"
              placeholder="Tell us about your music and why you'd like to join..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">About Your Music (Optional)</label>
            <textarea
              v-model="bio"
              class="form-input"
              rows="4"
              placeholder="This will be your artist bio if approved..."
            ></textarea>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-if="success" class="success-message">
            <font-awesome-icon :icon="['fas', 'check-circle']" class="mr-sm" />
            Application submitted! We'll review it and get back to you soon.
          </div>

          <div class="form-actions">
            <router-link to="/" class="btn btn-secondary">
              Cancel
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="loading || success">
              <font-awesome-icon v-if="loading" :icon="['fas', 'spinner']" class="fa-spin mr-sm" />
              {{ loading ? 'Submitting...' : 'Submit Application' }}
            </button>
          </div>
        </form>
      </div>

      <div class="info-section">
        <h3>What happens next?</h3>
        <ul class="feature-list">
          <li>
            <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            We'll review your application within 24-48 hours
          </li>
          <li>
            <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            You'll receive an email when your application is approved
          </li>
          <li>
            <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            Once approved, you can set up your artist profile
          </li>
          <li>
            <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            Start uploading tracks and earning 100% of sales
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
import { validateArtistName } from '@/utils/validators'

const router = useRouter()

const artistName = ref('')
const genre = ref('')
const applicationReason = ref('')
const bio = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B', 
  'Alternative', 'Jazz', 'Classical', 'Country', 'Latin',
  'Metal', 'Folk', 'Reggae', 'Blues', 'Soul'
]

const submitApplication = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('You must be logged in to apply')
    }
    
    // Validate inputs
    const nameValidation = validateArtistName(artistName.value)
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error)
    }
    
    // Check if user already has an application
    const existingQuery = query(
      collection(db, 'artistApplications'),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'approved'])
    )
    const existingSnapshot = await getDocs(existingQuery)
    
    if (!existingSnapshot.empty) {
      throw new Error('You already have an active application')
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
    
    // Create application
    const applicationId = doc(collection(db, 'artistApplications')).id
    await setDoc(doc(db, 'artistApplications', applicationId), {
      userId: user.uid,
      userEmail: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      artistName: artistName.value,
      genre: genre.value || null,
      applicationReason: applicationReason.value,
      bio: bio.value || null,
      status: 'pending',
      createdAt: serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null
    })
    
    success.value = true
    
    // Redirect after 3 seconds
    setTimeout(() => {
      router.push('/profile')
    }, 3000)
  } catch (err) {
    error.value = err.message || 'Failed to submit application'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Previous styles remain the same, just add: */

.success-message {
  background: rgba(40, 167, 69, 0.1);
  color: var(--color-success);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: center;
  margin-top: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}
</style>