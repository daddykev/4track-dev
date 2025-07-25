import { getFunctions, httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

class ApiService {
  constructor() {
    this.functions = functions
  }

  // Generic function to call Firebase Functions
  async callFunction(functionName, data = {}) {
    try {
      const callable = httpsCallable(this.functions, functionName)
      const result = await callable(data)
      return result.data
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error)
      throw this.handleApiError(error)
    }
  }

  // Medley/PayPal Functions
  async createMedleyPayPalOrder(artistId, trackId) {
    return this.callFunction('createMedleyPayPalOrder', {
      artistId,  // Changed from medleyId
      trackId
    })
  }

  async captureMedleyPayment(orderId, artistSlug) {
    return this.callFunction('captureMedleyPayment', {
      orderId,
      artistSlug
    })
  }

  async processFreeDownload(medleyId, trackId) {
    return this.callFunction('processMedleyFreeDownload', {
      medleyId,
      trackId
    })
  }

  // Analytics Functions
  async trackPageView(pageType, pageId, referrer = null) {
    // Fire and forget for analytics
    this.callFunction('collectAnalytics', {
      pageType,
      pageId,
      eventType: 'page_view',
      referrer
    }).catch(err => console.warn('Analytics error:', err))
  }

  async trackEvent(eventType, pageType, pageId, metadata = {}) {
    // Fire and forget for analytics
    this.callFunction('collectAnalytics', {
      pageType,
      pageId,
      eventType,
      metadata
    }).catch(err => console.warn('Analytics error:', err))
  }

  // Medley Analytics
  async getMedleyAnalytics(artistId, dateRange = '30d') {
    return this.callFunction('getMedleyAnalytics', {
      artistId,
      dateRange
    })
  }

  // Search Functions
  async searchArtists(searchTerm, filters = {}) {
    return this.callFunction('searchArtists', {
      searchTerm,
      filters
    })
  }

  // User Collection Functions
  async addToCollection(trackId, collectionType = 'hearted') {
    return this.callFunction('addToCollection', {
      trackId,
      collectionType
    })
  }

  async removeFromCollection(trackId, collectionType = 'hearted') {
    return this.callFunction('removeFromCollection', {
      trackId,
      collectionType
    })
  }

  async getUserCollection(collectionType = 'all') {
    return this.callFunction('getUserCollection', {
      collectionType
    })
  }

  // Cross-Platform Functions (for future migration phase)
  async generateCrossPlatformToken() {
    return this.callFunction('generateCrossPlatformToken')
  }

  async validateCrossPlatformToken(token) {
    return this.callFunction('validateCrossPlatformToken', { token })
  }

  // Error handling
  handleApiError(error) {
    // Extract user-friendly error message
    const message = error.message || 'An unexpected error occurred'
    
    // Check for specific error codes
    if (error.code === 'functions/cancelled') {
      return new Error('The operation was cancelled')
    } else if (error.code === 'functions/invalid-argument') {
      return new Error('Invalid data provided')
    } else if (error.code === 'functions/deadline-exceeded') {
      return new Error('The operation took too long. Please try again')
    } else if (error.code === 'functions/not-found') {
      return new Error('The requested resource was not found')
    } else if (error.code === 'functions/permission-denied') {
      return new Error('You do not have permission to perform this action')
    } else if (error.code === 'functions/resource-exhausted') {
      return new Error('Too many requests. Please try again later')
    } else if (error.code === 'functions/unauthenticated') {
      return new Error('Please sign in to continue')
    } else if (error.code === 'functions/unavailable') {
      return new Error('Service temporarily unavailable. Please try again later')
    } else if (error.code === 'functions/internal') {
      return new Error('An internal error occurred. Please try again')
    }
    
    return new Error(message)
  }

  // Utility function to handle PayPal redirects
  getPayPalReturnUrl(artistSlug) {
    const baseUrl = window.location.origin
    return `${baseUrl}/${artistSlug}/success`
  }

  getPayPalCancelUrl(artistSlug) {
    const baseUrl = window.location.origin
    return `${baseUrl}/${artistSlug}`
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export commonly used functions
export const {
  createMedleyPayPalOrder,
  captureMedleyPayment,
  processFreeDownload,
  trackPageView,
  trackEvent,
  getMedleyAnalytics,
  searchArtists,
  addToCollection,
  removeFromCollection,
  getUserCollection
} = apiService