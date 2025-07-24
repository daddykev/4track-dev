/**
 * Formatting utilities for 4track
 */

/**
 * Format duration from seconds to mm:ss or hh:mm:ss
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format file size from bytes to human readable
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format currency amount
 * @param {number} amount - Amount in dollars
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === 0) return 'Free'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now - then) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return interval === 1 
        ? `1 ${unit} ago`
        : `${interval} ${unit}s ago`
    }
  }
  
  return 'Just now'
}

/**
 * Format date to display format
 * @param {Date|string|number} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date))
}

/**
 * Format date and time
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date and time
 */
export function formatDateTime(date) {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format play count with abbreviation
 * @param {number} count - Play count
 * @returns {string} Formatted count (e.g., "1.2K", "3.4M")
 */
export function formatPlayCount(count) {
  if (count < 1000) return count.toString()
  if (count < 1000000) return (count / 1000).toFixed(1) + 'K'
  return (count / 1000000).toFixed(1) + 'M'
}

/**
 * Format artist name for URL slug
 * @param {string} name - Artist name
 * @returns {string} URL-safe slug
 */
export function formatSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Format genre for display
 * @param {string} genre - Genre identifier
 * @returns {string} Formatted genre name
 */
export function formatGenre(genre) {
  if (!genre) return 'Unknown'
  
  // Handle common genre formats
  return genre
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to append (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Format email for display (partially hidden)
 * @param {string} email - Email address
 * @returns {string} Partially hidden email
 */
export function formatEmailDisplay(email) {
  if (!email) return ''
  
  const [username, domain] = email.split('@')
  if (!domain) return email
  
  const hiddenUsername = username.length > 3
    ? username.substring(0, 2) + '***'
    : '***'
    
  return `${hiddenUsername}@${domain}`
}

/**
 * Format percentage
 * @param {number} value - Value between 0 and 1
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 0) {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format audio quality
 * @param {number} bitrate - Bitrate in kbps
 * @returns {string} Quality description
 */
export function formatAudioQuality(bitrate) {
  if (bitrate >= 320) return 'High Quality'
  if (bitrate >= 192) return 'Good Quality'
  if (bitrate >= 128) return 'Standard Quality'
  return 'Basic Quality'
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export function getInitials(name) {
  if (!name) return ''
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Format PayPal order status
 * @param {string} status - PayPal order status
 * @returns {string} User-friendly status
 */
export function formatPayPalStatus(status) {
  const statusMap = {
    'CREATED': 'Pending',
    'SAVED': 'Saved',
    'APPROVED': 'Approved',
    'VOIDED': 'Cancelled',
    'COMPLETED': 'Completed',
    'PAYER_ACTION_REQUIRED': 'Action Required'
  }
  
  return statusMap[status] || status
}