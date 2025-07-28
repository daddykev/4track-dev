// utils/fileUpload.js
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/firebase'

/**
 * Generate a square thumbnail from cover art
 * @param {File} file - The original image file
 * @param {number} targetSize - Target size for thumbnail (default 1000)
 * @param {number} quality - WebP quality (default 0.85)
 * @returns {Promise<Blob>} WebP thumbnail blob
 */
export const generateCoverArtThumbnail = async (file, targetSize = 1000, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          // Create canvas for processing
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d', { 
            willReadFrequently: true,
            alpha: false // This helps flatten transparent images
          })
          
          // Calculate square crop dimensions
          const minDimension = Math.min(img.width, img.height)
          const cropX = (img.width - minDimension) / 2
          const cropY = (img.height - minDimension) / 2
          
          // Set canvas to target size
          canvas.width = targetSize
          canvas.height = targetSize
          
          // Fill with white background (flattens transparency)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, targetSize, targetSize)
          
          // Enable image smoothing for better quality when scaling
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          // Draw the cropped and scaled image
          ctx.drawImage(
            img,
            cropX, cropY,              // Source crop position
            minDimension, minDimension, // Source crop size (square)
            0, 0,                      // Destination position
            targetSize, targetSize     // Destination size
          )
          
          // Convert to WebP blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to create thumbnail blob'))
              }
            },
            'image/webp',
            quality
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Upload cover art with automatic thumbnail generation
 * @param {File} file - The original cover art file
 * @param {string} userId - User ID for storage path
 * @param {string} artistId - Artist ID for storage path
 * @param {string} trackId - Track ID or timestamp for unique filename
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Object with original and thumbnail URLs and paths
 */
export const uploadCoverArtWithThumbnail = async (file, userId, artistId, trackId, options = {}) => {
  const {
    onProgress = () => {},
    onError = () => {}
  } = options
  
  try {
    // Generate thumbnail first
    const thumbnailBlob = await generateCoverArtThumbnail(file)
    
    // Create unique filenames
    const timestamp = trackId || Date.now()
    const extension = file.name.split('.').pop()
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_')
    
    // Define storage paths
    const originalPath = `${userId}/medley/${artistId}/artwork/original_${timestamp}_${sanitizedName}.${extension}`
    const thumbnailPath = `${userId}/medley/${artistId}/artwork/thumb_${timestamp}_${sanitizedName}.webp`
    
    // Upload original
    const originalRef = storageRef(storage, originalPath)
    const originalUploadTask = uploadBytesResumable(originalRef, file)
    
    // Track upload progress
    const originalUploadPromise = new Promise((resolve, reject) => {
      originalUploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 50 // 0-50%
          onProgress(progress)
        },
        (error) => {
          onError(error)
          reject(error)
        },
        async () => {
          try {
            const originalUrl = await getDownloadURL(originalUploadTask.snapshot.ref)
            resolve({ url: originalUrl, path: originalPath })
          } catch (error) {
            reject(error)
          }
        }
      )
    })
    
    // Upload thumbnail
    const thumbnailFile = new File([thumbnailBlob], `thumb_${sanitizedName}.webp`, {
      type: 'image/webp'
    })
    
    const thumbnailRef = storageRef(storage, thumbnailPath)
    const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, thumbnailFile)
    
    const thumbnailUploadPromise = new Promise((resolve, reject) => {
      thumbnailUploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = 50 + (snapshot.bytesTransferred / snapshot.totalBytes) * 50 // 50-100%
          onProgress(progress)
        },
        (error) => {
          onError(error)
          reject(error)
        },
        async () => {
          try {
            const thumbnailUrl = await getDownloadURL(thumbnailUploadTask.snapshot.ref)
            resolve({ url: thumbnailUrl, path: thumbnailPath })
          } catch (error) {
            reject(error)
          }
        }
      )
    })
    
    // Wait for both uploads to complete
    const [original, thumbnail] = await Promise.all([
      originalUploadPromise,
      thumbnailUploadPromise
    ])
    
    return {
      original: {
        url: original.url,
        path: original.path
      },
      thumbnail: {
        url: thumbnail.url,
        path: thumbnail.path
      }
    }
  } catch (error) {
    console.error('Error uploading cover art:', error)
    throw error
  }
}

/**
 * Delete cover art files from storage
 * @param {string} originalPath - Path to original file
 * @param {string} thumbnailPath - Path to thumbnail file
 */
export const deleteCoverArt = async (originalPath, thumbnailPath) => {
  const { deleteObject } = await import('firebase/storage')
  
  const deletePromises = []
  
  if (originalPath) {
    try {
      const originalRef = storageRef(storage, originalPath)
      deletePromises.push(deleteObject(originalRef))
    } catch (error) {
      console.warn('Could not delete original cover art:', error)
    }
  }
  
  if (thumbnailPath) {
    try {
      const thumbnailRef = storageRef(storage, thumbnailPath)
      deletePromises.push(deleteObject(thumbnailRef))
    } catch (error) {
      console.warn('Could not delete thumbnail:', error)
    }
  }
  
  await Promise.all(deletePromises)
}