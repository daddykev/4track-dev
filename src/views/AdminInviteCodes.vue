<template>
  <div class="page-container">
    <div class="section">
      <div class="section-header">
        <h1 class="section-title">
          <font-awesome-icon :icon="['fas', 'key']" class="section-icon" />
          Invite Code Management
        </h1>
      </div>

      <div class="invite-codes-grid">
        <!-- Consumer Codes -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Consumer Invite Codes</h3>
            <button @click="addCode('consumer')" class="btn btn-primary btn-sm">
              <font-awesome-icon :icon="['fas', 'plus']" />
              Add Code
            </button>
          </div>
          <div class="card-body">
            <p class="text-muted mb-lg">
              These codes allow users to sign up as consumers (regular music fans).
            </p>
            
            <div v-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>Loading invite codes...</p>
            </div>
            
            <div v-else-if="consumerCodes.length === 0" class="empty-state">
              <div class="empty-state-icon">
                <font-awesome-icon :icon="['fas', 'key']" />
              </div>
              <p>No consumer invite codes configured</p>
            </div>
            
            <div v-else class="codes-list">
              <div 
                v-for="code in consumerCodes" 
                :key="code.id"
                class="code-item"
              >
                <div class="code-info">
                  <span class="code-value">{{ code.code }}</span>
                  <span class="code-description">{{ code.description }}</span>
                </div>
                <div class="code-stats">
                  <span class="badge" :class="code.active ? 'badge-success' : 'badge-secondary'">
                    {{ code.active ? 'Active' : 'Inactive' }}
                  </span>
                  <span class="text-muted">{{ code.usageCount || 0 }} uses</span>
                </div>
                <div class="code-actions">
                  <button 
                    @click="editCode(code)" 
                    class="btn btn-outline btn-sm"
                  >
                    <font-awesome-icon :icon="['fas', 'edit']" />
                  </button>
                  <button 
                    @click="deleteCode(code.id)" 
                    class="btn btn-danger btn-sm"
                  >
                    <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Artist Codes -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Artist Invite Codes</h3>
            <button @click="addCode('artist')" class="btn btn-primary btn-sm">
              <font-awesome-icon :icon="['fas', 'plus']" />
              Add Code
            </button>
          </div>
          <div class="card-body">
            <p class="text-muted mb-lg">
              These codes allow users to sign up directly as artists (bypassing application process).
            </p>
            
            <div v-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>Loading invite codes...</p>
            </div>
            
            <div v-else-if="artistCodes.length === 0" class="empty-state">
              <div class="empty-state-icon">
                <font-awesome-icon :icon="['fas', 'music']" />
              </div>
              <p>No artist invite codes configured</p>
            </div>
            
            <div v-else class="codes-list">
              <div 
                v-for="code in artistCodes" 
                :key="code.id"
                class="code-item"
              >
                <div class="code-info">
                  <span class="code-value">{{ code.code }}</span>
                  <span class="code-description">{{ code.description }}</span>
                </div>
                <div class="code-stats">
                  <span class="badge" :class="code.active ? 'badge-success' : 'badge-secondary'">
                    {{ code.active ? 'Active' : 'Inactive' }}
                  </span>
                  <span class="text-muted">{{ code.usageCount || 0 }} uses</span>
                </div>
                <div class="code-actions">
                  <button 
                    @click="editCode(code)" 
                    class="btn btn-outline btn-sm"
                  >
                    <font-awesome-icon :icon="['fas', 'edit']" />
                  </button>
                  <button 
                    @click="deleteCode(code.id)" 
                    class="btn btn-danger btn-sm"
                  >
                    <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Code Editor Modal -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ editingCode ? 'Edit' : 'Add' }} Invite Code</h3>
            <button @click="closeModal" class="close-btn">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
          
          <div class="modal-content">
            <form @submit.prevent="saveCode">
              <div class="form-group">
                <label class="form-label">Code</label>
                <input
                  v-model="codeForm.code"
                  type="text"
                  class="form-input"
                  placeholder="INVITECODE123"
                  required
                  maxlength="50"
                  style="text-transform: uppercase;"
                />
                <p class="form-hint">Use uppercase letters, numbers, and underscores only</p>
              </div>
              
              <div class="form-group">
                <label class="form-label">Description</label>
                <input
                  v-model="codeForm.description"
                  type="text"
                  class="form-input"
                  placeholder="Early access for beta testers"
                  maxlength="100"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">User Type</label>
                <select v-model="codeForm.userType" class="form-select" required>
                  <option value="consumer">Consumer</option>
                  <option value="artist">Artist</option>
                </select>
              </div>
              
              <label class="checkbox-label">
                <input v-model="codeForm.active" type="checkbox" />
                <span>Code is active and can be used</span>
              </label>

              <div v-if="error" class="error-message mt-md">
                {{ error }}
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button @click="closeModal" type="button" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="saveCode" type="submit" class="btn btn-primary" :disabled="saving">
              <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" class="fa-spin mr-sm" />
              {{ saving ? 'Saving...' : 'Save Code' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  query 
} from 'firebase/firestore'
import { db } from '@/firebase'

// State
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingCode = ref(null)
const error = ref('')

const inviteCodes = ref([])

const codeForm = ref({
  code: '',
  description: '',
  userType: 'consumer',
  active: true
})

// Computed
const consumerCodes = computed(() => 
  inviteCodes.value.filter(code => code.userType === 'consumer')
)

const artistCodes = computed(() => 
  inviteCodes.value.filter(code => code.userType === 'artist')
)

// Methods
const loadInviteCodes = async () => {
  loading.value = true
  try {
    const q = query(collection(db, 'inviteCodes'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    
    inviteCodes.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error loading invite codes:', err)
    error.value = 'Failed to load invite codes'
  } finally {
    loading.value = false
  }
}

const addCode = (userType) => {
  editingCode.value = null
  codeForm.value = {
    code: '',
    description: '',
    userType,
    active: true
  }
  error.value = ''
  showModal.value = true
}

const editCode = (code) => {
  editingCode.value = code
  codeForm.value = {
    code: code.code,
    description: code.description || '',
    userType: code.userType,
    active: code.active
  }
  error.value = ''
  showModal.value = true
}

const saveCode = async () => {
  if (!codeForm.value.code.trim()) {
    error.value = 'Code is required'
    return
  }

  // Validate code format
  const codeRegex = /^[A-Z0-9_]+$/
  if (!codeRegex.test(codeForm.value.code)) {
    error.value = 'Code can only contain uppercase letters, numbers, and underscores'
    return
  }

  // Check for duplicate codes
  const existingCode = inviteCodes.value.find(
    code => code.code === codeForm.value.code && 
    (!editingCode.value || code.id !== editingCode.value.id)
  )
  
  if (existingCode) {
    error.value = 'This code already exists'
    return
  }

  saving.value = true
  error.value = ''

  try {
    const codeData = {
      code: codeForm.value.code.toUpperCase(),
      description: codeForm.value.description.trim(),
      userType: codeForm.value.userType,
      active: codeForm.value.active,
      usageCount: editingCode.value?.usageCount || 0
    }

    if (editingCode.value) {
      // Update existing code
      codeData.updatedAt = serverTimestamp()
      await updateDoc(doc(db, 'inviteCodes', editingCode.value.id), codeData)
    } else {
      // Create new code
      codeData.createdAt = serverTimestamp()
      await addDoc(collection(db, 'inviteCodes'), codeData)
    }

    await loadInviteCodes()
    closeModal()
  } catch (err) {
    console.error('Error saving invite code:', err)
    error.value = 'Failed to save invite code'
  } finally {
    saving.value = false
  }
}

const deleteCode = async (codeId) => {
  if (!confirm('Are you sure you want to delete this invite code?')) {
    return
  }

  try {
    await deleteDoc(doc(db, 'inviteCodes', codeId))
    await loadInviteCodes()
  } catch (err) {
    console.error('Error deleting invite code:', err)
    error.value = 'Failed to delete invite code'
  }
}

const closeModal = () => {
  showModal.value = false
  editingCode.value = null
  error.value = ''
}

// Lifecycle
onMounted(() => {
  loadInviteCodes()
})
</script>

<style scoped>
.invite-codes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
}

.codes-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.code-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.code-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.code-value {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: var(--text-primary);
  font-size: var(--font-lg);
}

.code-description {
  color: var(--text-muted);
  font-size: var(--font-sm);
}

.code-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 var(--spacing-lg);
}

.code-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-base);
  color: var(--text-secondary);
  margin-top: var(--spacing-md);
}

.checkbox-label input {
  margin: 0;
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

.mr-sm {
  margin-right: var(--spacing-sm);
}

.mt-md {
  margin-top: var(--spacing-md);
}

.mb-lg {
  margin-bottom: var(--spacing-lg);
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .invite-codes-grid {
    grid-template-columns: 1fr;
  }
  
  .code-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
  
  .code-stats {
    flex-direction: row;
    justify-content: space-between;
    margin: 0;
  }
  
  .code-actions {
    justify-content: center;
  }
}
</style>