import { createRouter, createWebHistory } from 'vue-router'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'

// 4track.io specific views
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import SignupPage from '../views/SignupPage.vue'
import DiscoverPage from '../views/DiscoverPage.vue'
import CreateArtist from '../views/CreateArtist.vue'
import UserProfile from '../views/UserProfile.vue'
import MusicCollection from '../views/MusicCollection.vue'
import MedleyPage from '../views/MedleyPage.vue'
import MedleySuccess from '../views/MedleySuccess.vue'
import ArtistStudio from '../views/ArtistStudio.vue'
import AdminUsers from '../views/AdminUsers.vue'
import AdminArtists from '../views/AdminArtists.vue'
import ArtistRoster from '../views/ArtistRoster.vue'
import AdminInviteCodes from '../views/AdminInviteCodes.vue'
import PrivacyPolicy from '../views/PrivacyPolicy.vue'
import TermsOfService from '../views/TermsOfService.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { title: '4track - Next-gen indie music platform' }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { title: 'Sign In - 4track' }
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupPage,
      meta: { title: 'Sign Up Free - 4track' }
    },
    {
      path: '/discover',
      name: 'discover',
      component: DiscoverPage,
      meta: { title: 'Discover Music - 4track' }
    },
    {
      path: '/collection',
      name: 'collection',
      component: MusicCollection,
      meta: { title: 'My Collection - 4track', requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: UserProfile,
      meta: { title: 'Profile - 4track', requiresAuth: true }
    },
    {
      path: '/artist/create',
      name: 'create-artist',
      component: CreateArtist,
      meta: { title: 'Become an Artist - 4track', requiresAuth: true }
    },
    {
      path: '/studio/:artistId?',
      name: 'studio',
      component: ArtistStudio,
      meta: { title: 'Artist Studio - 4track', requiresAuth: true }
    },
    {
      path: '/roster',
      name: 'artist-roster',
      component: ArtistRoster,
      meta: { 
        title: 'Artist Roster - 4track', 
        requiresAuth: true,
        requiresRosterAccess: true 
      }
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: PrivacyPolicy,
      meta: { title: 'Privacy Policy - 4track' }
    },
    {
      path: '/terms',
      name: 'terms',
      component: TermsOfService,
      meta: { title: 'Terms of Service - 4track' }
    },
    {
      path: '/:artistSlug',
      name: 'artist-medley',
      component: MedleyPage,
      meta: { title: 'Artist Medley - 4track' }
    },
    {
      path: '/:artistSlug/success',
      name: 'medley-success',
      component: MedleySuccess,
      meta: { title: 'Purchase Complete - 4track' }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsers,
      meta: { title: 'Manage Users - 4track Admin', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/artists',
      name: 'admin-artists',
      component: AdminArtists,
      meta: { title: 'Artist Applications - 4track Admin', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/invite-codes',
      name: 'admin-invite-codes',
      component: AdminInviteCodes,
      meta: { title: 'Invite Codes - 4track Admin', requiresAuth: true, requiresAdmin: true }
    },
    // Catch-all route for 404s
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Track current auth state
let isAuthenticated = false
let authStateResolved = false
let userData = null
let userDataLoaded = false

// Function to load user data
const loadUserData = async (user) => {
  if (!user) {
    userData = null
    userDataLoaded = true
    return
  }

  try {
    const userQuery = query(
      collection(db, 'users'),
      where('uid', '==', user.uid)
    )
    const userSnapshot = await getDocs(userQuery)
    
    if (!userSnapshot.empty) {
      userData = userSnapshot.docs[0].data()
    }
  } catch (error) {
    console.error('Error loading user data in router:', error)
  } finally {
    userDataLoaded = true
  }
}

// Set up auth state listener
onAuthStateChanged(auth, async (user) => {
  isAuthenticated = !!user
  authStateResolved = true
  
  // Load user data
  await loadUserData(user)
})

// Navigation guard for auth-required routes
router.beforeEach(async (to, from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // Check auth requirements
  if (to.meta.requiresAuth) {
    // Wait for auth state to be resolved if it hasn't been yet
    if (!authStateResolved) {
      await new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, () => {
          unsubscribe()
          resolve()
        })
      })
    }
    
    if (!isAuthenticated) {
      next({ name: 'login', query: { return: to.fullPath } })
      return
    }
    
    // Wait for user data to be loaded if we need to check permissions
    if ((to.meta.requiresArtist || to.meta.requiresRosterAccess || to.meta.requiresAdmin) && !userDataLoaded) {
      // Re-load user data if needed
      const user = auth.currentUser
      if (user && !userData) {
        await loadUserData(user)
      }
    }
    
    // Now check specific permissions
    if (to.meta.requiresArtist && userData?.userType !== 'artist') {
      next({ name: 'create-artist' })
    } else if (to.meta.requiresRosterAccess && !['admin', 'label', 'manager'].includes(userData?.userType)) {
      // Redirect non-authorized users
      next({ name: 'discover' })
    } else if (to.meta.requiresAdmin && userData?.userType !== 'admin') {
      // Redirect non-admin users
      next({ name: 'discover' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router