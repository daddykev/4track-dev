<template>
  <div class="admin-page">
    <div class="page-container">
      <h1 class="page-title">
        <font-awesome-icon :icon="['fas', 'music']" class="mr-sm" />
        Artist Applications
      </h1>

      <div class="tabs mb-xl">
        <button 
          @click="activeTab = 'pending'"
          class="tab-button"
          :class="{ active: activeTab === 'pending' }"
        >
          Pending ({{ pendingCount }})
        </button>
        <button 
          @click="activeTab = 'approved'"
          class="tab-button"
          :class="{ active: activeTab === 'approved' }"
        >
          Approved ({{ approvedCount }})
        </button>
        <button 
          @click="activeTab = 'denied'"
          class="tab-button"
          :class="{ active: activeTab === 'denied' }"
        >
          Denied ({{ deniedCount }})
        </button>
      </div>

      <div v-if="loading" class="loading-container">
        <font-awesome-icon :icon="['fas', 'spinner']" class="fa-spin loading-spinner" />
        <p>Loading applications...</p>
      </div>

      <div v-else-if="filteredApplications.length === 0" class="empty-state">
        <p>No {{ activeTab }} applications found</p>
      </div>

      <div v-else class="applications-grid">
        <div v-for="app in filteredApplications" :key="app.id" class="application-card">
          <div class="application-header">
            <h3 class="application-name">{{ app.artistName }}</h3>
            <span class="badge" :class="`badge-${app.status}`">
              {{ app.status }}
            </span>
          </div>

          <div class="application-info">
            <div class="info-row">
              <span class="info-label">User:</span>
              <span>{{ app.displayName }} ({{ app.userEmail }})</span>
            </div>
            <div class="info-row">
              <span class="info-label">Genre:</span>
              <span>{{ app.genre || 'Not specified' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Applied:</span>
              <span>{{ formatDate(app.createdAt) }}</span>
            </div>
          </div>

          <div class="application-reason">
            <h4>Why they want to join:</h4>
            <p>{{ app.applicationReason }}</p>
          </div>

          <div v-if="app.bio" class="application-bio">
            <h4>Proposed Bio:</h4>
            <p>{{ app.bio }}</p>
          </div>

          <div v-if="app.status === 'pending'" class="application-actions">
            <button 
              @click="approveApplication(app)"
              class="btn btn-success"
              :disabled="processing[app.id]"
            >
              <font-awesome-icon 
                v-if="processing[app.id]" 
                :icon="['fas', 'spinner']" 
                class="fa-spin mr-sm" 
              />
              Approve
            </button>
            <button 
              @click="denyApplication(app)"
              class="btn btn-danger"
              :disabled="processing[app.id]"
            >
              <font-awesome-icon 
                v-if="processing[app.id]" 
                :icon="['fas', 'spinner']" 
                class="fa-spin mr-sm" 
              />
              Deny
            </button>
          </div>

          <div v-else-if="app.reviewedAt" class="review-info">
            <p class="text-muted">
              {{ app.status === 'approved' ? 'Approved' : 'Denied' }} on 
              {{ formatDate(app.reviewedAt) }}
              <span v-if="app.reviewNotes"> - {{ app.reviewNotes }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { auth, db } from '@/firebase'

const applications = ref([])
const activeTab = ref('pending')
const loading = ref(true)
const processing = ref({})

const pendingCount = computed(() => applications.value.filter(a => a.status === 'pending').length)
const approvedCount = computed(() => applications.value.filter(a => a.status === 'approved').length)
const deniedCount = computed(() => applications.value.filter(a => a.status === 'denied').length)

const filteredApplications = computed(() => {
  return applications.value.filter(app => app.status === activeTab.value)
})

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString()
}

const formatSlug = (name) => {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const approveApplication = async (application) => {
  if (!confirm(`Approve ${application.artistName}?`)) return
  
  processing.value[application.id] = true
  
  try {
    const currentUser = auth.currentUser
    
    // Update user type to artist
    await updateDoc(doc(db, 'users', application.userId), {
      userType: 'artist',
      updatedAt: serverTimestamp()
    })
    
    // Create artist profile
    const artistId = doc(collection(db, 'artistProfiles')).id
    await setDoc(doc(db, 'artistProfiles', artistId), {
      name: application.artistName,
      customSlug: formatSlug(application.artistName),
      genre: application.genre || null,
      bio: application.bio || null,
      createdBy: application.userId,
      createdAt: serverTimestamp(),
      platform: '4track',
      hasPublicMedley: false
    })
    
    // Update application status
    await updateDoc(doc(db, 'artistApplications', application.id), {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: currentUser.uid,
      artistProfileId: artistId
    })
    
    // Update local state
    const index = applications.value.findIndex(a => a.id === application.id)
    if (index !== -1) {
      applications.value[index] = {
        ...applications.value[index],
        status: 'approved',
        reviewedAt: new Date()
      }
    }
    
    alert(`${application.artistName} has been approved!`)
  } catch (error) {
    console.error('Error approving application:', error)
    alert('Failed to approve application: ' + error.message)
  } finally {
    processing.value[application.id] = false
  }
}

const denyApplication = async (application) => {
  const reason = prompt('Reason for denial (optional):')
  if (reason === null) return // User cancelled
  
  processing.value[application.id] = true
  
  try {
    const currentUser = auth.currentUser
    
    // Update application status
    await updateDoc(doc(db, 'artistApplications', application.id), {
      status: 'denied',
      reviewedAt: serverTimestamp(),
      reviewedBy: currentUser.uid,
      reviewNotes: reason || null
    })
    
    // Update local state
    const index = applications.value.findIndex(a => a.id === application.id)
    if (index !== -1) {
      applications.value[index] = {
        ...applications.value[index],
        status: 'denied',
        reviewedAt: new Date(),
        reviewNotes: reason
      }
    }
    
    alert(`${application.artistName} has been denied.`)
  } catch (error) {
    console.error('Error denying application:', error)
    alert('Failed to deny application: ' + error.message)
  } finally {
    processing.value[application.id] = false
  }
}

const loadApplications = async () => {
  try {
    const appsQuery = query(
      collection(db, 'artistApplications'), 
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(appsQuery)
    
    applications.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading applications:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: var(--spacing-xl);
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xl);
}

.tabs {
  display: flex;
  gap: var(--spacing-sm);
  border-bottom: 2px solid var(--border-primary);
}

.tab-button {
  background: transparent;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all var(--transition-fast);
}

.tab-button:hover {
  color: var(--text-primary);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.applications-grid {
  display: grid;
  gap: var(--spacing-lg);
}

.application-card {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.application-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.application-name {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

.badge-pending {
  background: var(--color-warning);
  color: var(--text-primary);
}

.badge-approved {
  background: var(--color-success);
}

.badge-denied {
  background: var(--color-danger);
}

.application-info {
  margin-bottom: var(--spacing-lg);
}

.info-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
}

.application-reason,
.application-bio {
  margin-bottom: var(--spacing-lg);
}

.application-reason h4,
.application-bio h4 {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-sm);
}

.application-reason p,
.application-bio p {
  color: var(--text-primary);
  line-height: 1.6;
}

.application-actions {
  display: flex;
  gap: var(--spacing-md);
}

.review-info {
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-primary);
}

.text-muted {
  color: var(--text-muted);
  font-size: var(--font-sm);
}

.mb-xl {
  margin-bottom: var(--spacing-xl);
}

.mr-sm {
  margin-right: var(--spacing-sm);
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>