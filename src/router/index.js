import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

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

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  isAuthenticated = !!user
  authStateResolved = true
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
      // Wait a bit for auth state to resolve
      await new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, () => {
          unsubscribe()
          resolve()
        })
      })
    }
    
    if (!isAuthenticated) {
      next({ name: 'login', query: { return: to.fullPath } })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router