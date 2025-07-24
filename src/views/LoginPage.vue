<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Sign in to access your music collection</p>

        <form @submit.prevent="handleLogin" class="auth-form">
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
              required
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
            <font-awesome-icon v-if="loading" :icon="['fas', 'spinner']" class="fa-spin mr-sm" />
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="divider">
          <span>OR</span>
        </div>

        <button @click="handleGoogleLogin" class="btn btn-google w-full">
          <font-awesome-icon :icon="['fab', 'google']" class="mr-sm" />
          Continue with Google
        </button>

        <p class="auth-footer">
          Don't have an account?
          <router-link to="/signup" class="auth-link">Sign up free</router-link>
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services/auth'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authService.signIn(email.value, password.value)
    
    // Check for return URL
    const returnUrl = route.query.return
    if (returnUrl) {
      router.push(decodeURIComponent(returnUrl))
    } else {
      router.push('/collection')
    }
  } catch (err) {
    error.value = err.message || 'Failed to sign in'
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authService.signInWithGoogle()
    
    // Check for return URL
    const returnUrl = route.query.return
    if (returnUrl) {
      router.push(decodeURIComponent(returnUrl))
    } else {
      router.push('/collection')
    }
  } catch (err) {
    error.value = err.message || 'Failed to sign in with Google'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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