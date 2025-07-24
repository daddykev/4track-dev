<template>
  <div v-if="showBanner" class="verification-banner">
    <div class="verification-content">
      <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="verification-warning-icon" />
      <div class="verification-text">
        <p class="verification-title">Email Verification Required</p>
        <p class="verification-message">
          Please verify your email address to access all features.
        </p>
      </div>
      <button 
        @click="resendEmail" 
        class="btn btn-sm btn-primary"
        :disabled="loading || cooldown > 0"
      >
        <font-awesome-icon 
          v-if="loading" 
          :icon="['fas', 'spinner']" 
          class="fa-spin mr-xs" 
        />
        {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { authService } from '@/services/auth'

const props = defineProps({
  user: Object
})

const loading = ref(false)
const cooldown = ref(0)
let cooldownInterval = null

const showBanner = computed(() => {
  return props.user && !props.user.emailVerified
})

const resendEmail = async () => {
  loading.value = true
  
  try {
    await authService.resendVerificationEmail()
    startCooldown()
  } catch (error) {
    console.error('Failed to resend email:', error)
  } finally {
    loading.value = false
  }
}

const startCooldown = () => {
  cooldown.value = 60
  
  if (cooldownInterval) clearInterval(cooldownInterval)
  
  cooldownInterval = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})
</script>

<style scoped>
.verification-banner {
  background: var(--color-warning);
  color: var(--text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.verification-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.verification-warning-icon {
  font-size: var(--font-xl);
  flex-shrink: 0;
  opacity: 0.8;
}

.verification-text {
  flex: 1;
}

.verification-title {
  font-weight: 600;
  margin: 0;
  font-size: var(--font-base);
}

.verification-message {
  margin: 0;
  font-size: var(--font-sm);
  opacity: 0.9;
}

.mr-xs {
  margin-right: var(--spacing-xs);
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .verification-content {
    flex-direction: column;
    text-align: center;
  }
  
  .btn {
    width: 100%;
  }
}
</style>