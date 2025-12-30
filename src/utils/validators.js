/**
 * Validation utilities for 4track
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with strength and suggestions
 */
export function validatePassword(password) {
  const result = {
    isValid: false,
    strength: 'weak',
    suggestions: []
  }
  
  if (!password) {
    result.suggestions.push('Password is required')
    return result
  }
  
  if (password.length < 6) {
    result.suggestions.push('Password must be at least 6 characters')
  }
  
  if (password.length >= 6 && password.length < 8) {
    result.strength = 'fair'
  }
  
  if (password.length >= 8) {
    result.strength = 'good'
    
    // Check for strong password criteria
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar) {
      result.strength = 'strong'
    } else {
      if (!hasUpperCase) result.suggestions.push('Add uppercase letters')
      if (!hasNumbers) result.suggestions.push('Add numbers')
      if (!hasSpecialChar) result.suggestions.push('Add special characters')
    }
  }
  
  result.isValid = password.length >= 6
  return result
}

/**
 * Validate artist name
 * @param {string} name - Artist name to validate
 * @returns {object} Validation result
 */
export function validateArtistName(name) {
  const result = {
    isValid: false,
    error: null
  }
  
  if (!name || !name.trim()) {
    result.error = 'Artist name is required'
    return result
  }
  
  const trimmedName = name.trim()
  
  if (trimmedName.length < 2) {
    result.error = 'Artist name must be at least 2 characters'
    return result
  }
  
  if (trimmedName.length > 50) {
    result.error = 'Artist name must be less than 50 characters'
    return result
  }
  
  // Check for invalid characters
  const invalidChars = /[<>{}\\\/]/
  if (invalidChars.test(trimmedName)) {
    result.error = 'Artist name contains invalid characters'
    return result
  }
  
  result.isValid = true
  return result
}

/**
 * Format a string into a URL-friendly slug
 * @param {string} text - Text to convert to slug
 * @returns {string} Formatted slug
 */
export function formatSlug(text) {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Remove consecutive hyphens
    .replace(/-{2,}/g, '-')
    // Limit length
    .substring(0, 50)
}

/**
 * Validate slug format
 * @param {string} slug - URL slug to validate
 * @returns {object} Validation result
 */
export function validateSlug(slug) {
  const result = {
    isValid: false,
    error: null
  }
  
  if (!slug) {
    result.error = 'Slug is required'
    return result
  }
  
  if (slug.length < 3) {
    result.error = 'Slug must be at least 3 characters'
    return result
  }
  
  if (slug.length > 50) {
    result.error = 'Slug must be less than 50 characters'
    return result
  }
  
  // Check format: lowercase letters, numbers, hyphens only
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(slug)) {
    result.error = 'Slug can only contain lowercase letters, numbers, and hyphens'
    return result
  }
  
  // Check for reserved slugs
  const reservedSlugs = [
    'admin', 'api', 'app', 'login', 'signup', 'logout', 'profile',
    'settings', 'dashboard', 'discover', 'collection', 'studio',
    'help', 'support', 'about', 'terms', 'privacy', 'contact'
  ]
  
  if (reservedSlugs.includes(slug)) {
    result.error = 'This slug is reserved'
    return result
  }
  
  result.isValid = true
  return result
}

/**
 * Validate audio file
 * @param {File} file - Audio file to validate
 * @returns {object} Validation result
 */
export function validateAudioFile(file) {
  const result = {
    isValid: false,
    error: null
  }
  
  if (!file) {
    result.error = 'No file selected'
    return result
  }
  
  // Check file type
  const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav']
  if (!validTypes.includes(file.type)) {
    result.error = 'File must be MP3 or WAV format'
    return result
  }
  
  // Check file size (max 200MB)
  const maxSize = 200 * 1024 * 1024
  if (file.size > maxSize) {
    result.error = 'File size must be less than 200MB'
    return result
  }
  
  result.isValid = true
  return result
}

/**
 * Validate image file
 * @param {File} file - Image file to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
export function validateImageFile(file, options = {}) {
  const {
    maxSize = 20 * 1024 * 1024, // 20MB default
    minWidth = 0,
    minHeight = 0,
    aspectRatio = null
  } = options
  
  const result = {
    isValid: false,
    error: null
  }
  
  if (!file) {
    result.error = 'No file selected'
    return result
  }
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    result.error = 'File must be JPEG, PNG, or WebP format'
    return result
  }
  
  // Check file size
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / 1024 / 1024)
    result.error = `File size must be less than ${sizeMB}MB`
    return result
  }
  
  result.isValid = true
  return result
}

/**
 * Validate track metadata
 * @param {object} track - Track metadata to validate
 * @returns {object} Validation result
 */
export function validateTrackMetadata(track) {
  const errors = []
  
  if (!track.title || !track.title.trim()) {
    errors.push('Track title is required')
  } else if (track.title.length > 100) {
    errors.push('Track title must be less than 100 characters')
  }
  
  if (track.artistName && track.artistName.length > 100) {
    errors.push('Artist name must be less than 100 characters')
  }
  
  if (track.price !== undefined) {
    if (typeof track.price !== 'number') {
      errors.push('Price must be a number')
    } else if (track.price < 0) {
      errors.push('Price cannot be negative')
    } else if (track.price > 10) {
      errors.push('Price cannot exceed $10')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate PayPal email
 * @param {string} email - PayPal email to validate
 * @returns {object} Validation result
 */
export function validatePayPalEmail(email) {
  const result = {
    isValid: false,
    error: null
  }
  
  if (!email) {
    result.error = 'PayPal email is required'
    return result
  }
  
  if (!isValidEmail(email)) {
    result.error = 'Please enter a valid email address'
    return result
  }
  
  result.isValid = true
  return result
}

/**
 * Validate genre selection
 * @param {string} genre - Selected genre
 * @param {array} validGenres - List of valid genres
 * @returns {object} Validation result
 */
export function validateGenre(genre, validGenres = []) {
  const result = {
    isValid: false,
    error: null
  }
  
  if (!genre) {
    result.error = 'Please select a genre'
    return result
  }
  
  if (validGenres.length > 0 && !validGenres.includes(genre)) {
    result.error = 'Please select a valid genre'
    return result
  }
  
  result.isValid = true
  return result
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate social media handle
 * @param {string} handle - Social media handle
 * @param {string} platform - Social platform (instagram, twitter, etc)
 * @returns {object} Validation result
 */
export function validateSocialHandle(handle, platform) {
  const result = {
    isValid: false,
    error: null
  }
  
  if (!handle) {
    result.isValid = true // Optional field
    return result
  }
  
  // Remove @ if present
  const cleanHandle = handle.replace(/^@/, '')
  
  // Platform-specific validation
  switch (platform) {
    case 'instagram':
    case 'twitter':
    case 'tiktok':
      const handleRegex = /^[a-zA-Z0-9._]+$/
      if (!handleRegex.test(cleanHandle)) {
        result.error = 'Handle can only contain letters, numbers, dots, and underscores'
        return result
      }
      if (cleanHandle.length > 30) {
        result.error = 'Handle must be less than 30 characters'
        return result
      }
      break
      
    case 'spotify':
      // Spotify URLs or IDs
      if (!cleanHandle.includes('spotify.com') && cleanHandle.length !== 22) {
        result.error = 'Please enter a valid Spotify URL or artist ID'
        return result
      }
      break
  }
  
  result.isValid = true
  return result
}

/**
 * Validate collection name
 * @param {string} name - Collection name
 * @returns {object} Validation result
 */
export function validateCollectionName(name) {
  const result = {
    isValid: false,
    error: null
  }

  if (!name || !name.trim()) {
    result.error = 'Collection name is required'
    return result
  }

  const trimmedName = name.trim()

  if (trimmedName.length < 2) {
    result.error = 'Collection name must be at least 2 characters'
    return result
  }

  if (trimmedName.length > 50) {
    result.error = 'Collection name must be less than 50 characters'
    return result
  }

  result.isValid = true
  return result
}

/**
 * Validate live show metadata
 * @param {object} show - Show data to validate
 * @returns {object} Validation result with errors array
 */
export function validateShowMetadata(show) {
  const errors = []

  // Title (required)
  if (!show.title || !show.title.trim()) {
    errors.push('Event title is required')
  } else if (show.title.length > 100) {
    errors.push('Event title must be less than 100 characters')
  }

  // Description (optional, max length)
  if (show.description && show.description.length > 2000) {
    errors.push('Description must be less than 2000 characters')
  }

  // Event date (required)
  if (!show.eventDate) {
    errors.push('Event date is required')
  } else {
    const eventDate = new Date(show.eventDate)
    if (isNaN(eventDate.getTime())) {
      errors.push('Please enter a valid date')
    }
  }

  // Event time (required if provided separately)
  if (show.eventTime !== undefined && !show.eventTime) {
    errors.push('Event time is required')
  }

  // Venue (required)
  if (!show.venue || !show.venue.trim()) {
    errors.push('Venue is required')
  } else if (show.venue.length > 100) {
    errors.push('Venue name must be less than 100 characters')
  }

  // Location (required)
  if (!show.location || !show.location.trim()) {
    errors.push('Location is required')
  } else if (show.location.length > 100) {
    errors.push('Location must be less than 100 characters')
  }

  // Ticket URL (optional but must be valid if provided)
  if (show.ticketUrl && show.ticketUrl.trim()) {
    if (!isValidUrl(show.ticketUrl)) {
      errors.push('Please enter a valid ticket URL')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}