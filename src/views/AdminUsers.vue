<template>
  <div class="admin-page">
    <div class="page-container">
      <h1 class="page-title">
        <font-awesome-icon :icon="['fas', 'users']" class="mr-sm" />
        Manage Users
      </h1>
      
      <div class="stats-grid mb-xl">
        <div class="stat-card">
          <div class="stat-value">{{ totalUsers }}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ consumerCount }}</div>
          <div class="stat-label">Consumers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ artistCount }}</div>
          <div class="stat-label">Artists</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ adminCount }}</div>
          <div class="stat-label">Admins</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">All Users</h2>
          <input
            v-model="searchQuery"
            type="text"
            class="form-input search-input"
            placeholder="Search users..."
          />
        </div>

        <div v-if="loading" class="loading-container">
          <font-awesome-icon :icon="['fas', 'spinner']" class="fa-spin loading-spinner" />
          <p>Loading users...</p>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <p>No users found</p>
        </div>

        <div v-else class="users-table">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Joined</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.displayName }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" :class="`badge-${user.userType}`">
                    {{ user.userType }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>
                  <font-awesome-icon 
                    :icon="['fas', user.emailVerified ? 'check-circle' : 'times-circle']"
                    :class="user.emailVerified ? 'text-success' : 'text-muted'"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/firebase'

const users = ref([])
const searchQuery = ref('')
const loading = ref(true)

const totalUsers = computed(() => users.value.length)
const consumerCount = computed(() => users.value.filter(u => u.userType === 'consumer').length)
const artistCount = computed(() => users.value.filter(u => u.userType === 'artist').length)
const adminCount = computed(() => users.value.filter(u => u.userType === 'admin').length)

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  
  const search = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.displayName?.toLowerCase().includes(search) ||
    user.email?.toLowerCase().includes(search) ||
    user.userType?.toLowerCase().includes(search)
  )
})

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString()
}

const loadUsers = async () => {
  try {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(usersQuery)
    
    users.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  background: var(--bg-card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-input {
  max-width: 300px;
}

.users-table {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: var(--spacing-md);
  border-bottom: 2px solid var(--border-primary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-primary);
}

.badge-consumer {
  background: var(--color-info);
}

.badge-artist {
  background: var(--color-primary);
}

.badge-admin {
  background: var(--color-danger);
}

.text-success {
  color: var(--color-success);
}

.text-muted {
  color: var(--text-muted);
}

.mb-xl {
  margin-bottom: var(--spacing-xl);
}

.mr-sm {
  margin-right: var(--spacing-sm);
}
</style>