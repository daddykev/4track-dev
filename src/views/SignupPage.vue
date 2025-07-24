<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Show verification message if email was sent -->
        <div v-if="verificationSent" class="verification-message">
          <div class="verification-icon">
            <font-awesome-icon :icon="['fas', 'envelope-circle-check']" />
          </div>
          <h1 class="auth-title">Check Your Email</h1>
          <p class="auth-subtitle mb-lg">
            We've sent a verification email to <strong>{{ email }}</strong>
          </p>
          <div class="verification-info">
            <p>Please click the link in the email to verify your account.</p>
            <p class="text-muted">Can't find the email? Check your spam folder.</p>
          </div>
          
          <div class="verification-actions">
            <button 
              @click="resendVerification" 
              class="btn btn-outline"
              :disabled="resendLoading || resendCooldown > 0"
            >
              <font-awesome-icon 
                v-if="resendLoading" 
                :icon="['fas', 'spinner']" 
                class="fa-spin mr-sm" 
              />
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email' }}
            </button>
            
            <router-link to="/login" class="btn btn-primary">
              Continue to Login
            </router-link>
          </div>
          
          <p class="auth-footer">
            Wrong email? 
            <a @click="resetForm" href="#" class="auth-link">Sign up again</a>
          </p>
        </div>

        <!-- Regular signup form -->
        <div v-else>
          <h1 class="auth-title">Create Your Account</h1>
          <p class="auth-subtitle">Start building your music collection today</p>

          <!-- Show invite code field for artists -->
          <div v-if="showInviteCode" class="invite-banner">
            <font-awesome-icon :icon="['fas', 'ticket']" class="invite-icon" />
            <p>Have an artist invite code? Enter it below to unlock artist features!</p>
          </div>

          <form @submit.prevent="handleSignup" class="auth-form">
            <div v-if="showInviteCode" class="form-group">
              <label for="inviteCode" class="form-label">Invite Code (Optional)</label>
              <input
                id="inviteCode"
                v-model="inviteCode"
                type="text"
                class="form-input"
                placeholder="Enter invite code"
                autocomplete="off"
              />
              <p class="form-hint">For early access to artist features</p>
            </div>

            <div class="form-group">
              <label for="name" class="form-label">Display Name</label>
              <input
                id="name"
                v-model="displayName"
                type="text"
                class="form-input"
                placeholder="Your name"
                required
              />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                class="form-input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                class="form-input"
                placeholder="••••••••"
                minlength="6"
                required
              />
              <p class="form-hint">At least 6 characters</p>
            </div>

            <label class="checkbox-label">
              <input v-model="agreeToTerms" type="checkbox" required />
              <span>
                I agree to the 
                <a href="/terms" target="_blank" class="auth-link">Terms of Service</a>
                and 
                <a href="/privacy" target="_blank" class="auth-link">Privacy Policy</a>
              </span>
            </label>

            <div v-if="error" class="error-message">
              {{ error }}
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading || !agreeToTerms">
              <font-awesome-icon v-if="loading" :icon="['fas', 'spinner']" class="fa-spin mr-sm" />
              {{ loading ? 'Creating account...' : 'Create Free Account' }}
            </button>
          </form>

          <div class="divider">
            <span>OR</span>
          </div>

          <button @click="handleGoogleSignup" class="btn btn-google w-full">
            <font-awesome-icon :icon="['fab', 'google']" class="mr-sm" />
            Continue with Google
          </button>

          <p class="auth-footer">
            Already have an account?
            <router-link to="/login" class="auth-link">Sign in</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth'

const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const inviteCode = ref('')
const showInviteCode = ref(true)
const agreeToTerms = ref(false)
const error = ref('')
const loading = ref(false)
const verificationSent = ref(false)
const resendLoading = ref(false)
const resendCooldown = ref(0)

let cooldownInterval = null

const handleSignup = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const result = await authService.signUp(
      email.value, 
      password.value, 
      displayName.value,
      inviteCode.value.toUpperCase()
    )
    
    if (result.emailSent) {
      verificationSent.value = true
      startResendCooldown()
    }
  } catch (err) {
    error.value = err.message || 'Failed to create account'
  } finally {
    loading.value = false
  }
}

const handleGoogleSignup = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authService.signInWithGoogle()
    router.push('/collection')
  } catch (err) {
    error.value = err.message || 'Failed to sign up with Google'
  } finally {
    loading.value = false
  }
}

const resendVerification = async () => {
  resendLoading.value = true
  error.value = ''
  
  try {
    await authService.resendVerificationEmail()
    startResendCooldown()
  } catch (err) {
    error.value = err.message || 'Failed to resend verification email'
  } finally {
    resendLoading.value = false
  }
}

const startResendCooldown = () => {
  resendCooldown.value = 60 // 60 seconds cooldown
  
  if (cooldownInterval) clearInterval(cooldownInterval)
  
  cooldownInterval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

const resetForm = () => {
  verificationSent.value = false
  email.value = ''
  password.value = ''
  displayName.value = ''
  inviteCode.value = ''
  error.value = ''
}

onMounted(() => {
  return () => {
    if (cooldownInterval) clearInterval(cooldownInterval)
  }
})
</script>

<style scoped>
/* Same styles as before, plus new verification styles */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-xl);
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: var(--bg-card);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.auth-title {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  text-align: center;
}

.auth-subtitle {
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Invite code banner */
.invite-banner {
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
  color: var(--text-inverse);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: center;
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-sm);
}

.invite-icon {
  font-size: var(--font-lg);
  flex-shrink: 0;
}

/* Verification message styles */
.verification-message {
  text-align: center;
}

.verification-icon {
  font-size: 4rem;
  color: var(--color-success);
  margin-bottom: var(--spacing-lg);
}

.verification-info {
  background: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xl);
}

.verification-info p {
  margin: var(--spacing-sm) 0;
}

.verification-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.checkbox-label input {
  margin-top: 3px;
}

.divider {
  text-align: center;
  margin: var(--spacing-xl) 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-primary);
}

.divider span {
  background: var(--bg-card);
  padding: 0 var(--spacing-md);
  position: relative;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.btn-google {
  background: white;
  color: #333;
  border: 1px solid var(--border-primary);
}

.btn-google:hover {
  background: var(--bg-secondary);
}

.auth-footer {
  text-align: center;
  margin-top: var(--spacing-xl);
  color: var(--text-secondary);
}

.auth-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}

.w-full {
  width: 100%;
}

.mr-sm {
  margin-right: var(--spacing-sm);
}

.mb-lg {
  margin-bottom: var(--spacing-lg);
}

.text-muted {
  color: var(--text-muted);
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: center;
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>