<template>
  <div class="medley-success-page">
    <div class="success-container">
      <!-- Processing State -->
      <div v-if="processing" class="processing-state">
        <div class="loading-spinner"></div>
        <h2>Processing your purchase...</h2>
        <p>Please wait while we confirm your payment.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="success-state">
        <div class="success-icon">
          <font-awesome-icon :icon="['fas', 'circle-check']" />
        </div>
        <h2>Purchase Successful!</h2>
        
        <div v-if="allowDownload && downloadUrl" class="download-section">
          <p>Your download should start automatically. If not, click below:</p>
          <a :href="downloadUrl" download class="download-btn">
            <font-awesome-icon :icon="['fas', 'download']" />
            Download Track
          </a>
        </div>
        
        <div v-else class="stream-section">
          <p>Thank you for your purchase! You can stream this track anytime from the medley player.</p>
        </div>
        
        <button @click="returnToMedley" class="return-btn">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          Back to Medley
        </button>
      </div>

      <!-- Error State -->
      <div v-else class="error-state">
        <div class="error-icon">
          <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
        </div>
        <h2>Something went wrong</h2>
        <p>{{ error }}</p>
        <button @click="returnToMedley" class="return-btn">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          Back to Medley
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiService } from '@/services/api'

const route = useRoute()
const router = useRouter()

const processing = ref(true)
const success = ref(false)
const error = ref('')
const downloadUrl = ref('')
const streamUrl = ref('')
const allowDownload = ref(true)

onMounted(async () => {
  // Get PayPal order ID from URL params
  const token = route.query.token
  const payerId = route.query.PayerID // Also capture PayerID
  
  console.log('PayPal callback params:', { token, payerId }) // Debug log
  
  if (!token) {
    error.value = 'No payment information found'
    processing.value = false
    return
  }
  
  try {
    // Get artist slug from route params
    const artistSlug = route.params.artistSlug
    
    // Call cloud function to capture the payment
    const result = await apiService.captureMedleyPayment(token, artistSlug)
    
    console.log('Capture result:', result) // Debug log
    
    if (result.success) {
      success.value = true
      downloadUrl.value = result.downloadUrl
      streamUrl.value = result.streamUrl
      allowDownload.value = result.allowDownload
      
      // Auto-download if allowed
      if (downloadUrl.value && allowDownload.value) {
        setTimeout(() => {
          const link = document.createElement('a')
          link.href = downloadUrl.value
          link.download = true
          link.click()
        }, 1000)
      }
    } else {
      throw new Error(result.error || 'Payment processing failed')
    }
  } catch (err) {
    console.error('Error processing payment:', err)
    // Show the actual error message
    error.value = err.message || 'Failed to process payment. Please contact support.'
  } finally {
    processing.value = false
  }
})

const returnToMedley = () => {
  const artistSlug = route.params.artistSlug
  if (artistSlug) {
    router.push(`/${artistSlug}`)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.medley-success-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #16213e 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.success-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.processing-state,
.success-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.success-icon {
  font-size: 5rem;
  color: #28a745;
  animation: bounce 0.5s ease-out;
}

.error-icon {
  font-size: 5rem;
  color: #dc3545;
}

@keyframes bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

h2 {
  font-size: 2rem;
  margin: 0;
}

p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.6;
}

.download-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
}

.download-btn,
.return-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
}

.download-btn:hover,
.return-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .success-container {
    padding: var(--spacing-lg);
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  .success-icon,
  .error-icon {
    font-size: 4rem;
  }
}
</style>