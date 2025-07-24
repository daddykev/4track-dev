// utils/permissions.js
import { auth, db } from '@/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'

/**
 * Check if user has access to artist roster
 * @param {object} userData - User data from Firestore
 * @returns {boolean}
 */
export function canViewArtistRoster(userData) {
  if (!userData) return false
  return ['admin', 'label', 'manager'].includes(userData.userType)
}

/**
 * Check if user can create new artist profiles
 * @param {object} userData - User data from Firestore
 * @returns {boolean}
 */
export function canCreateArtist(userData) {
  if (!userData) return false
  return ['admin', 'label', 'manager'].includes(userData.userType)
}

/**
 * Check if user has access to specific artist
 * @param {object} userData - User data from Firestore
 * @param {string} artistId - Artist profile ID
 * @returns {Promise<boolean>}
 */
export async function hasArtistAccess(userData, artistId) {
  if (!userData || !artistId) return false
  
  // Admins have access to all artists
  if (userData.userType === 'admin') return true
  
  // Check if user created the artist
  try {
    const artistDoc = await getDoc(doc(db, 'artistProfiles', artistId))
    if (artistDoc.exists() && artistDoc.data().createdBy === userData.uid) {
      return true
    }
  } catch (error) {
    console.error('Error checking artist ownership:', error)
  }
  
  // Check artistAccess permissions
  if (userData.artistAccess && userData.artistAccess[artistId]) {
    return true
  }
  
  return false
}

/**
 * Get all artists accessible to user
 * @param {object} userData - User data from Firestore
 * @returns {Promise<array>}
 */
export async function getAccessibleArtists(userData) {
  if (!userData) return []
  
  try {
    // Admins get all artists
    if (userData.userType === 'admin') {
      const allArtistsSnapshot = await getDocs(collection(db, 'artistProfiles'))
      return allArtistsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'admin'
      }))
    }
    
    const accessibleArtists = []
    
    // Get artists created by user
    const createdQuery = query(
      collection(db, 'artistProfiles'),
      where('createdBy', '==', userData.uid)
    )
    const createdSnapshot = await getDocs(createdQuery)
    
    createdSnapshot.docs.forEach(doc => {
      accessibleArtists.push({
        id: doc.id,
        ...doc.data(),
        role: userData.userType // creator has role matching their type
      })
    })
    
    // Get artists from artistAccess permissions
    if (userData.artistAccess) {
      for (const [artistId, access] of Object.entries(userData.artistAccess)) {
        try {
          const artistDoc = await getDoc(doc(db, 'artistProfiles', artistId))
          if (artistDoc.exists()) {
            accessibleArtists.push({
              id: artistId,
              ...artistDoc.data(),
              role: access.role,
              permissions: access.permissions,
              grantedBy: access.grantedBy,
              grantedAt: access.grantedAt
            })
          }
        } catch (error) {
          console.error(`Error loading artist ${artistId}:`, error)
        }
      }
    }
    
    return accessibleArtists
  } catch (error) {
    console.error('Error getting accessible artists:', error)
    return []
  }
}

/**
 * Get role label for display
 * @param {string} role
 * @returns {string}
 */
export function getRoleLabel(role) {
  const labels = {
    admin: 'Admin',
    label: 'Label',
    manager: 'Manager',
    owner: 'Owner',
    artist: 'Artist'
  }
  return labels[role] || role
}

/**
 * Extract Spotify artist ID from URL
 * @param {string} spotifyUrl
 * @returns {string|null}
 */
export function extractSpotifyArtistId(spotifyUrl) {
  if (!spotifyUrl) return null
  
  // Handle different Spotify URL formats
  const patterns = [
    /spotify\.com\/artist\/([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/,
    /^([a-zA-Z0-9]{22})$/ // Direct ID
  ]
  
  for (const pattern of patterns) {
    const match = spotifyUrl.match(pattern)
    if (match) return match[1]
  }
  
  return null
}