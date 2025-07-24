<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import CustomIcon from '@/components/CustomIcon.vue'

const router = useRouter()

// State
const user = ref(null)
const userData = ref(null)
const artistProfile = ref(null)
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const userDropdown = ref(null)

// Computed
const displayName = computed(() => {
  if (userData.value?.displayName) return userData.value.displayName
  if (user.value?.email) return user.value.email.split('@')[0]
  return 'User'
})

// Check if user is an artist (by user type, not profile)
const isArtistUser = computed(() => {
  return userData.value?.userType === 'artist'
})

// Check if user has created an artist profile
const hasArtistProfile = computed(() => {
  return !!artistProfile.value
})

// Methods
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    userMenuOpen.value = false
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

const handleLogout = async () => {
  try {
    await signOut(auth)
    closeUserMenu()
    closeMobileMenu()
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Load user data
const loadUserData = async (firebaseUser) => {
  if (!firebaseUser) {
    userData.value = null
    artistProfile.value = null
    return
  }

  try {
    // Get user document
    const usersQuery = query(
      collection(db, 'users'),
      where('uid', '==', firebaseUser.uid)
    )
    const userSnapshot = await getDocs(usersQuery)
    
    if (!userSnapshot.empty) {
      userData.value = {
        id: userSnapshot.docs[0].id,
        ...userSnapshot.docs[0].data()
      }
      
      // If user is an artist, check for artist profile
      if (userData.value.userType === 'artist') {
        const artistQuery = query(
          collection(db, 'artistProfiles'),
          where('createdBy', '==', firebaseUser.uid)
        )
        const artistSnapshot = await getDocs(artistQuery)
        
        if (!artistSnapshot.empty) {
          artistProfile.value = {
            id: artistSnapshot.docs[0].id,
            ...artistSnapshot.docs[0].data()
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error)
  }
}

// Click outside handler
const handleClickOutside = (event) => {
  if (userDropdown.value && !userDropdown.value.contains(event.target)) {
    userMenuOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Auth state listener
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    await loadUserData(firebaseUser)
  })

  // Click outside listener
  document.addEventListener('click', handleClickOutside)

  // Cleanup
  onUnmounted(() => {
    unsubscribe()
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo/Brand -->
      <router-link to="/" class="navbar-brand">
        <span class="brand-text">4track</span>
        <CustomIcon name="cassetteTape" class="brand-cassette-icon" />
      </router-link>

      <!-- Desktop Navigation -->
      <div class="navbar-menu" :class="{ 'active': mobileMenuOpen }">
        <div class="navbar-start">
          <router-link 
            v-if="user"
            to="/discover" 
            class="navbar-item" 
            @click="closeMobileMenu"
          >
            <font-awesome-icon :icon="['fas', 'search']" class="navbar-icon" />
            <span>Discover</span>
          </router-link>
          
          <router-link 
            v-if="user" 
            to="/collection" 
            class="navbar-item" 
            @click="closeMobileMenu"
          >
            <font-awesome-icon :icon="['fas', 'heart']" class="navbar-icon" />
            <span>Collection</span>
          </router-link>
          
          <router-link 
            v-if="isArtistUser" 
            to="/studio" 
            class="navbar-item" 
            @click="closeMobileMenu"
          >
            <font-awesome-icon :icon="['fas', 'music']" class="navbar-icon" />
            <span>Studio</span>
          </router-link>
        </div>

        <div class="navbar-end">
          <template v-if="!user">
            <router-link to="/login" class="navbar-item" @click="closeMobileMenu">
              Log In
            </router-link>
            <router-link to="/signup" class="btn btn-primary btn-sm" @click="closeMobileMenu">
              Sign Up Free
            </router-link>
          </template>
          
          <template v-else>
            <!-- User Menu -->
            <div class="navbar-dropdown" ref="userDropdown">
              <button @click="toggleUserMenu" class="navbar-user-button">
                <div class="user-avatar">
                  <font-awesome-icon :icon="['fas', 'user']" />
                </div>
                <span class="user-name">{{ displayName }}</span>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="dropdown-icon" />
              </button>
              
              <div v-if="userMenuOpen" class="dropdown-menu">
                <router-link 
                  to="/profile" 
                  class="dropdown-item"
                  @click="closeUserMenu"
                >
                  <font-awesome-icon :icon="['fas', 'user']" class="dropdown-icon" />
                  Profile
                </router-link>
                
                <router-link 
                  v-if="!isArtistUser"
                  to="/artist/create" 
                  class="dropdown-item"
                  @click="closeUserMenu"
                >
                  <font-awesome-icon :icon="['fas', 'music']" class="dropdown-icon" />
                  Become an Artist
                </router-link>
                
                <router-link 
                  v-if="isArtistUser && !hasArtistProfile"
                  to="/artist/create" 
                  class="dropdown-item"
                  @click="closeUserMenu"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" class="dropdown-icon" />
                  Create Artist Profile
                </router-link>
                
                <router-link 
                  v-if="isArtistUser && hasArtistProfile"
                  :to="`/artist/${artistProfile.id}/medley`" 
                  class="dropdown-item"
                  @click="closeUserMenu"
                >
                  <font-awesome-icon :icon="['fas', 'list']" class="dropdown-icon" />
                  Manage Medley
                </router-link>
                
                <div class="dropdown-divider"></div>
                
                <button @click="handleLogout" class="dropdown-item text-danger">
                  <font-awesome-icon :icon="['fas', 'sign-out-alt']" class="dropdown-icon" />
                  Log Out
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Mobile Menu Toggle -->
      <button 
        @click="toggleMobileMenu" 
        class="navbar-toggle"
        :aria-expanded="mobileMenuOpen"
      >
        <font-awesome-icon :icon="mobileMenuOpen ? ['fas', 'times'] : ['fas', 'bars']" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

/* Brand */
.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: var(--font-xl);
}

.brand-icon {
  color: var(--color-primary);
  font-size: var(--font-2xl);
}

.brand-text {
  background: linear-gradient(135deg, var(--color-primary), #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-cassette-icon {
  color: var(--color-primary);
  font-size: 1.4em;
  opacity: 0.8;
  transition: opacity var(--transition-normal);
  margin-left: -0.15em;
}

.navbar-brand:hover .brand-cassette-icon {
  opacity: 1;
}

/* Navigation Menu */
.navbar-menu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  margin-left: var(--spacing-2xl);
}

.navbar-start,
.navbar-end {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.navbar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-weight: 500;
}

.navbar-item:hover {
  color: var(--color-primary);
  background: var(--bg-hover);
}

.navbar-item.router-link-active {
  color: var(--color-primary);
  background: var(--bg-hover);
}

.navbar-icon {
  font-size: var(--font-sm);
}

/* User Menu */
.navbar-dropdown {
  position: relative;
}

.navbar-user-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-primary);
  font-weight: 500;
}

.navbar-user-button:hover {
  border-color: var(--color-primary);
  background: var(--bg-hover);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--font-sm);
}

.user-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: var(--font-xs);
  color: var(--text-muted);
  transition: transform var(--transition-fast);
}

.navbar-user-button:hover .dropdown-icon {
  transform: translateY(1px);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: 0;
  min-width: 200px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-sm);
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: var(--font-base);
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-item .dropdown-icon {
  font-size: var(--font-sm);
  width: 20px;
  text-align: center;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-primary);
  margin: var(--spacing-sm) 0;
}

.text-danger {
  color: var(--color-danger);
}

.text-danger:hover {
  background: rgba(220, 53, 69, 0.1);
}

/* Mobile Toggle */
.navbar-toggle {
  display: none;
  background: transparent;
  border: none;
  font-size: var(--font-xl);
  color: var(--text-primary);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.navbar-toggle:hover {
  background: var(--bg-hover);
}

/* Mobile Styles */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 var(--spacing-md);
  }

  .navbar-toggle {
    display: block;
  }

  .navbar-menu {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
    flex-direction: column;
    padding: var(--spacing-lg);
    transform: translateX(100%);
    transition: transform var(--transition-normal);
    border-top: 1px solid var(--border-primary);
    overflow-y: auto;
  }

  .navbar-menu.active {
    transform: translateX(0);
  }

  .navbar-start,
  .navbar-end {
    flex-direction: column;
    width: 100%;
    gap: var(--spacing-sm);
  }

  .navbar-start {
    margin-bottom: var(--spacing-xl);
  }

  .navbar-item,
  .navbar-user-button {
    width: 100%;
    justify-content: flex-start;
    padding: var(--spacing-md);
  }

  .dropdown-menu {
    position: static;
    box-shadow: none;
    border: none;
    background: var(--bg-secondary);
    margin-top: var(--spacing-sm);
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>