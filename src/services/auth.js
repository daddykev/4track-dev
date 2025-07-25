// services/auth.js
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { auth, db } from '@/firebase'

class AuthService {
  constructor() {
    this.user = null
    this.userData = null
    this.listeners = []
  }

  // Initialize auth state listener
  init() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        this.user = user
        if (user) {
          await this.loadUserData(user.uid)
        } else {
          this.userData = null
        }
        this.notifyListeners()
        resolve(user)
      })
    })
  }

  // Add auth state change listener
  onAuthChange(callback) {
    this.listeners.push(callback)
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  // Notify all listeners of auth state change
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.user, this.userData))
  }

  // Load user data from Firestore
  async loadUserData(uid) {
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', uid)
      )
      const userSnapshot = await getDocs(userQuery)
      
      if (!userSnapshot.empty) {
        this.userData = {
          id: userSnapshot.docs[0].id,
          ...userSnapshot.docs[0].data()
        }
      }
      return this.userData
    } catch (error) {
      console.error('Error loading user data:', error)
      return null
    }
  }

  // Sign up with email and password
  async signUp(email, password, displayName = null, inviteCode = null) {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName })
      }
      
      // Send verification email
      await sendEmailVerification(user)
      
      // Determine user type based on invite code
      let userType = 'consumer'
      let validInviteCode = null
      
      if (inviteCode) {
        // Look up invite code in Firestore
        const inviteCodesQuery = query(
          collection(db, 'inviteCodes'),
          where('code', '==', inviteCode.toUpperCase()),
          where('active', '==', true)
        )
        const inviteSnapshot = await getDocs(inviteCodesQuery)
        
        if (!inviteSnapshot.empty) {
          validInviteCode = inviteSnapshot.docs[0].data()
          userType = validInviteCode.userType
          
          // Increment usage count
          const inviteDocRef = doc(db, 'inviteCodes', inviteSnapshot.docs[0].id)
          await setDoc(inviteDocRef, {
            usageCount: (validInviteCode.usageCount || 0) + 1,
            lastUsed: serverTimestamp()
          }, { merge: true })
        }
      }
      
      // Create user document in Firestore
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || email.split('@')[0],
        userType,
        platform: '4track',
        subscription: {
          tier: 'free',
          status: 'active'
        },
        features: {
          maxArtistProfiles: 1,
          maxMedleyTracks: 4,
          customPages: false,
          emailCampaigns: false,
          advancedAnalytics: false,
          teamCollaboration: false
        },
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: false,
        inviteCode: validInviteCode ? inviteCode.toUpperCase() : null
      }
      
      await setDoc(doc(db, 'users', user.uid), userData)
      
      this.userData = userData
      return { user, userData, emailSent: true }
    } catch (error) {
      console.error('Sign up error:', error)
      throw this.handleAuthError(error)
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Update last login and email verification status
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp(),
        emailVerified: user.emailVerified
      }, { merge: true })
      
      await this.loadUserData(user.uid)
      
      return { user, userData: this.userData }
    } catch (error) {
      console.error('Sign in error:', error)
      throw this.handleAuthError(error)
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const user = userCredential.user
      
      // Check if user document exists
      let userData = await this.loadUserData(user.uid)
      
      if (!userData) {
        // Create new user document for Google sign-in
        userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          userType: 'consumer',
          platform: '4track',
          subscription: {
            tier: 'free',
            status: 'active'
          },
          features: {
            maxArtistProfiles: 1,
            maxMedleyTracks: 4,
            customPages: false,
            emailCampaigns: false,
            advancedAnalytics: false,
            teamCollaboration: false
          },
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          emailVerified: true // Google accounts are pre-verified
        }
        
        await setDoc(doc(db, 'users', user.uid), userData)
        this.userData = userData
      } else {
        // Update last login for existing user
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
          emailVerified: true // Google accounts are verified
        }, { merge: true })
      }
      
      return { user, userData: this.userData }
    } catch (error) {
      console.error('Google sign in error:', error)
      throw this.handleAuthError(error)
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth)
      this.user = null
      this.userData = null
      this.notifyListeners()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Password reset error:', error)
      throw this.handleAuthError(error)
    }
  }

  // Resend verification email
  async resendVerificationEmail() {
    if (!this.user) throw new Error('User not authenticated')
    
    try {
      await sendEmailVerification(this.user)
      return true
    } catch (error) {
      console.error('Error sending verification email:', error)
      throw this.handleAuthError(error)
    }
  }

  // Update email verification status in Firestore
  async updateEmailVerificationStatus() {
    if (!this.user) return false
    
    try {
      await this.user.reload() // Refresh the user object
      
      if (this.user.emailVerified && this.userData && !this.userData.emailVerified) {
        await setDoc(doc(db, 'users', this.user.uid), {
          emailVerified: true
        }, { merge: true })
        
        // Reload user data
        await this.loadUserData(this.user.uid)
        return true
      }
      
      return this.user.emailVerified
    } catch (error) {
      console.error('Error updating verification status:', error)
      return false
    }
  }

  // Update user type to artist
  async becomeArtist() {
    if (!this.user) throw new Error('User not authenticated')
    
    // Check if email is verified
    if (!this.user.emailVerified) {
      throw new Error('Please verify your email before becoming an artist')
    }
    
    try {
      await setDoc(doc(db, 'users', this.user.uid), {
        userType: 'artist',
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      // Reload user data
      await this.loadUserData(this.user.uid)
      this.notifyListeners()
      
      return this.userData
    } catch (error) {
      console.error('Error updating user type:', error)
      throw error
    }
  }

  // Check if user is artist
  isArtist() {
    return this.userData?.userType === 'artist'
  }

  // Check if email is verified
  isEmailVerified() {
    return this.user?.emailVerified || false
  }

  // Get current user
  getCurrentUser() {
    return this.user
  }

  // Get current user data
  getCurrentUserData() {
    return this.userData
  }

  // Handle auth errors with user-friendly messages
  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email. Please sign up first.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/popup-closed-by-user': 'Sign in was cancelled.',
      'auth/cancelled-popup-request': 'Another sign in is in progress.',
      'auth/popup-blocked': 'Sign in popup was blocked. Please allow popups for this site.'
    }
    
    return new Error(errorMessages[error.code] || error.message)
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export auth functions for direct use
export {
  onAuthStateChanged,
  signOut
}