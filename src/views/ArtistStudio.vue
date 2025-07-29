<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth, db, storage } from '@/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc as firestoreDeleteDoc,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage'
import { apiService } from '@/services/api'
import { validateAudioFile, validateImageFile, validateTrackMetadata } from '@/utils/validators'
import { hasArtistAccess, getRoleLabel } from '@/utils/permissions'
import { extractAudioMetadata } from '@/utils/audioMetadata'
import { uploadCoverArtWithThumbnail, deleteCoverArt } from '@/utils/fileUpload'
import PhotoLab from '@/components/PhotoLab.vue'
import CircularCropEditor from '@/components/CircularCropEditor.vue'

const router = useRouter()
const route = useRoute()

// State
const loading = ref(true)
const error = ref('')
const artist = ref(null)
const tracks = ref([])
const photos = ref([])
const userData = ref(null)
const stats = ref({
  totalPlays: 0,
  totalHearts: 0,
  totalDownloads: 0,
  totalRevenue: 0
})
const copied = ref(false)

// PhotoLab state
const showPhotoLab = ref(false)
const photoLabPhoto = ref(null)

// Modal state
const showTrackModal = ref(false)
const editingTrack = ref(null)
const saving = ref(false)
const modalError = ref('')

// Photo state
const uploadingPhoto = ref(false)
const uploadProgress = ref(0)
const viewingPhoto = ref(null)

// Crop editor state
const showCropEditor = ref(false)
const cropEditorPhoto = ref(null)

// Refs
const audioFileInput = ref(null)
const artworkFileInput = ref(null)
const photoFileInput = ref(null)
const coverArtUploadProgress = ref(0)

// Form state
const trackForm = ref({
  title: '',
  description: '',
  price: 0,
  allowDownload: true,
  audioFile: null,
  artworkFile: null,
  order: 0,
  collaborators: []
})

// Computed
const isOwnStudio = computed(() => {
  if (!userData.value || !artist.value) return false
  return userData.value.uid === artist.value.createdBy
})

const publicUrl = computed(() => {
  if (!artist.value?.customSlug) return ''
  return `${window.location.origin}/${artist.value.customSlug}`
})

const totalSplitPercentage = computed(() => {
  return trackForm.value.collaborators.reduce((sum, collab) => sum + (parseFloat(collab.percentage) || 0), 0)
})

const isSplitValid = computed(() => {
  return Math.abs(totalSplitPercentage.value - 100) < 0.01 // Allow for floating point precision
})

const loadArtistData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const user = auth.currentUser
    if (!user) {
      router.push('/login')
      return
    }
    
    // Load user data
    const userQuery = query(
      collection(db, 'users'),
      where('uid', '==', user.uid)
    )
    const userSnapshot = await getDocs(userQuery)
    
    if (!userSnapshot.empty) {
      userData.value = {
        id: userSnapshot.docs[0].id,
        ...userSnapshot.docs[0].data()
      }
    }
    
    // Check if viewing specific artist's studio
    const artistId = route.params.artistId
    
    if (artistId) {
      // Viewing another artist's studio
      // Check permissions
      if (!hasArtistAccess(userData.value, artistId)) {
        error.value = 'You do not have permission to view this studio'
        loading.value = false
        return
      }
      
      // Load specific artist
      const artistDoc = await getDoc(doc(db, 'artistProfiles', artistId))
      if (!artistDoc.exists()) {
        error.value = 'Artist not found'
        loading.value = false
        return
      }
      
      artist.value = {
        id: artistDoc.id,
        ...artistDoc.data()
      }
    } else {
      // Viewing own studio
      if (userData.value?.userType !== 'artist') {
        router.push('/artist/create')
        return
      }
      
      // Find artist profile for current user
      const artistQuery = query(
        collection(db, 'artistProfiles'),
        where('createdBy', '==', user.uid)
      )
      
      const artistSnapshot = await getDocs(artistQuery)
      
      if (artistSnapshot.empty) {
        // User is an artist but hasn't created a profile yet
        loading.value = false
        return
      }
      
      artist.value = {
        id: artistSnapshot.docs[0].id,
        ...artistSnapshot.docs[0].data()
      }
    }
    
    // Load tracks
    await loadTracks()
    
    // Load photos
    await loadPhotos()
    
    // Load analytics
    await loadAnalytics()
    
  } catch (err) {
    console.error('Error loading artist data:', err)
    error.value = 'Failed to load studio data'
  } finally {
    loading.value = false
  }
}

const loadTracks = async () => {
  if (!artist.value) return
  
  try {
    const tracksQuery = query(
      collection(db, 'medleyTracks'),
      where('artistId', '==', artist.value.id),
      orderBy('order', 'asc')
    )
    
    const tracksSnapshot = await getDocs(tracksQuery)
    tracks.value = tracksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error loading tracks:', err)
  }
}

const loadPhotos = async () => {
  if (!artist.value) return
  
  try {
    const photosQuery = query(
      collection(db, 'artistPhotos'),
      where('artistId', '==', artist.value.id),
      orderBy('uploadedAt', 'desc')
    )
    
    const photosSnapshot = await getDocs(photosQuery)
    photos.value = photosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Update artist profile image if we have a primary photo
    const primaryPhoto = photos.value.find(p => p.isPrimary)
    if (primaryPhoto && primaryPhoto.thumbnailUrl !== artist.value.profileImageUrl) {
      await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
        profileImageUrl: primaryPhoto.thumbnailUrl
      })
      artist.value.profileImageUrl = primaryPhoto.thumbnailUrl
    }
  } catch (err) {
    console.error('Error loading photos:', err)
  }
}

const loadAnalytics = async () => {
  if (!artist.value) return
  
  try {
    const analyticsData = await apiService.getMedleyAnalytics(artist.value.id)
    
    stats.value = {
      totalPlays: analyticsData.totalPlays || 0,
      totalHearts: await getHeartCount(),
      totalDownloads: analyticsData.totalDownloads || 0,
      totalRevenue: analyticsData.totalRevenue || 0
    }
    
  } catch (err) {
    console.error('Error loading analytics:', err)
  }
}

const getHeartCount = async () => {
  try {
    const heartsQuery = query(
      collection(db, 'userCollections'),
      where('artistId', '==', artist.value.id),
      where('type', '==', 'hearted')
    )
    
    const heartsSnapshot = await getDocs(heartsQuery)
    return heartsSnapshot.size
  } catch (err) {
    console.error('Error getting heart count:', err)
    return 0
  }
}

// Photo Management Functions
const selectPhotoFile = () => {
  photoFileInput.value.click()
}

const handlePhotoFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const validation = validateImageFile(file, { maxSize: 20 * 1024 * 1024 })
  if (!validation.isValid) {
    alert(validation.error)
    event.target.value = ''
    return
  }
  
  await uploadPhoto(file)
  event.target.value = '' // Clear input
}

const uploadPhoto = async (file) => {
  uploadingPhoto.value = true
  uploadProgress.value = 0
  
  try {
    const user = auth.currentUser
    const timestamp = Date.now()
    
    // Extract image metadata
    const metadata = await extractImageMetadata(file)
    
    // Upload original
    const originalPath = `${user.uid}/artist-photos/${artist.value.id}/original_${timestamp}_${file.name}`
    const originalRef = storageRef(storage, originalPath)
    
    const uploadTask = uploadBytesResumable(originalRef, file)
    
    uploadTask.on('state_changed',
      (snapshot) => {
        uploadProgress.value = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
      },
      (error) => {
        console.error('Upload error:', error)
        uploadingPhoto.value = false
        uploadProgress.value = 0
        alert('Failed to upload photo')
      },
      async () => {
        // Get original URL
        const originalUrl = await getDownloadURL(uploadTask.snapshot.ref)
        
        // Create thumbnail
        const thumbnailBlob = await createThumbnail(file, 1000, 0.85)
        const thumbnailPath = `${user.uid}/artist-photos/${artist.value.id}/thumbnails/${timestamp}_thumb.webp`
        const thumbnailRef = storageRef(storage, thumbnailPath)
        
        await uploadBytesResumable(thumbnailRef, thumbnailBlob).then(async (snapshot) => {
          const thumbnailUrl = await getDownloadURL(snapshot.ref)
          
          // Save to Firestore
          const photoData = {
            artistId: artist.value.id,
            originalUrl,
            originalPath,
            thumbnailUrl,
            thumbnailPath,
            fileName: file.name,
            fileSize: file.size,
            width: metadata.width,
            height: metadata.height,
            isPrimary: photos.value.length === 0, // First photo is primary
            metadata: metadata.exif || {},
            uploadedBy: user.uid,
            uploadedAt: serverTimestamp()
          }
          
          await addDoc(collection(db, 'artistPhotos'), photoData)
          
          // Reload photos
          await loadPhotos()
          
          uploadingPhoto.value = false
          uploadProgress.value = 0
        })
      }
    )
  } catch (err) {
    console.error('Error uploading photo:', err)
    uploadingPhoto.value = false
    uploadProgress.value = 0
    alert('Failed to upload photo')
  }
}

const extractImageMetadata = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const metadata = {
          width: img.width,
          height: img.height,
          exif: {} // Would need EXIF library to extract full EXIF data
        }
        resolve(metadata)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const createThumbnail = (file, maxSize, quality) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculate new dimensions
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (height > maxSize) {
            width = (width / height) * maxSize
            height = maxSize
          }
        } else {
          if (width > maxSize) {
            height = (height / width) * maxSize
            width = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and convert to WebP
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          quality
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const setPrimaryPhoto = async (photo) => {
  // Open the crop editor instead of directly setting
  cropEditorPhoto.value = photo
  showCropEditor.value = true
}

// Cleaner handleCroppedPhoto function
const handleCroppedPhoto = async (croppedFile) => {
  try {
    // Upload the cropped thumbnail
    const user = auth.currentUser
    const timestamp = Date.now()
    const croppedPath = `${user.uid}/artist-photos/${artist.value.id}/cropped_${timestamp}.webp`
    const croppedRef = storageRef(storage, croppedPath)
    
    // Upload
    await uploadBytesResumable(croppedRef, croppedFile)
    const croppedUrl = await getDownloadURL(croppedRef)
    
    // Delete old cropped thumbnail if exists
    const currentPhoto = photos.value.find(p => p.id === cropEditorPhoto.value.id)
    if (currentPhoto.croppedThumbnailPath && currentPhoto.croppedThumbnailPath !== currentPhoto.thumbnailPath) {
      try {
        await deleteObject(storageRef(storage, currentPhoto.croppedThumbnailPath))
      } catch (err) {
        console.warn('Could not delete old cropped thumbnail:', err)
      }
    }
    
    // Update all photos
    const updates = photos.value.map(p => {
      if (p.id === cropEditorPhoto.value.id) {
        // Set this as primary with cropped thumbnail
        return updateDoc(doc(db, 'artistPhotos', p.id), { 
          isPrimary: true,
          croppedThumbnailUrl: croppedUrl,
          croppedThumbnailPath: croppedPath
        })
      } else if (p.isPrimary) {
        // Remove primary from others
        return updateDoc(doc(db, 'artistPhotos', p.id), { 
          isPrimary: false 
        })
      }
      return Promise.resolve()
    })
    
    await Promise.all(updates)
    
    // Update artist profile image
    await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
      profileImageUrl: croppedUrl
    })
    
    // Reload photos to get fresh data
    await loadPhotos()
    
    // Close editor
    showCropEditor.value = false
    cropEditorPhoto.value = null
    
  } catch (err) {
    console.error('Error setting primary photo:', err)
    alert('Failed to set primary photo')
  }
}

const closeCropEditor = () => {
  showCropEditor.value = false
  cropEditorPhoto.value = null
}

const deletePhoto = async (photo) => {
  if (!confirm('Delete this photo?')) return
  
  try {
    // Delete from Storage
    await deleteObject(storageRef(storage, photo.originalPath))
    await deleteObject(storageRef(storage, photo.thumbnailPath))
    
    // Delete from Firestore
    await firestoreDeleteDoc(doc(db, 'artistPhotos', photo.id))
    
    // If this was primary, set the next photo as primary
    if (photo.isPrimary && photos.value.length > 1) {
      const nextPhoto = photos.value.find(p => p.id !== photo.id)
      if (nextPhoto) {
        await setPrimaryPhoto(nextPhoto)
      }
    }
    
    await loadPhotos()
  } catch (err) {
    console.error('Error deleting photo:', err)
    alert('Failed to delete photo')
  }
}

const viewPhoto = (photo) => {
  viewingPhoto.value = photo
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

// Track Management Functions
const addTrack = (index) => {
  // Initialize with artist as primary collaborator
  trackForm.value = {
    title: '',
    description: '',
    price: 0,
    allowDownload: true,
    audioFile: null,
    artworkFile: null,
    order: index,
    collaborators: [{
      id: Date.now().toString(),
      name: artist.value.name,
      email: artist.value.paypalEmail || '',
      percentage: 100,
      isPrimary: true
    }]
  }
  editingTrack.value = null
  showTrackModal.value = true
}

const editTrack = (track) => {
  trackForm.value = {
    title: track.title,
    description: track.description || '',
    price: track.price || 0,
    allowDownload: track.allowDownload !== false,
    audioFile: null,
    artworkFile: null,
    order: track.order,
    collaborators: track.collaborators || [{
      id: Date.now().toString(),
      name: artist.value.name,
      email: artist.value.paypalEmail || '',
      percentage: 100,
      isPrimary: true
    }]
  }
  editingTrack.value = track
  showTrackModal.value = true
}

// Collaborator management functions
const addCollaborator = () => {
  trackForm.value.collaborators.push({
    id: Date.now().toString(),
    name: '',
    email: '',
    percentage: 0,
    isPrimary: false
  })
}

const removeCollaborator = (index) => {
  if (trackForm.value.collaborators[index].isPrimary) {
    modalError.value = 'Cannot remove the primary artist'
    return
  }
  trackForm.value.collaborators.splice(index, 1)
}

const updateCollaboratorSplit = (index, value) => {
  const percentage = parseFloat(value) || 0
  trackForm.value.collaborators[index].percentage = Math.min(100, Math.max(0, percentage))
}

const autoBalanceSplits = () => {
  const collabCount = trackForm.value.collaborators.length
  if (collabCount === 0) return
  
  const equalSplit = 100 / collabCount
  trackForm.value.collaborators.forEach(collab => {
    collab.percentage = parseFloat(equalSplit.toFixed(2))
  })
}

const handleAudioFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const validation = validateAudioFile(file)
  if (!validation.isValid) {
    modalError.value = validation.error
    event.target.value = ''
    return
  }
  
  trackForm.value.audioFile = file
  modalError.value = ''
}

const handleArtworkFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const validation = validateImageFile(file)
  if (!validation.isValid) {
    modalError.value = validation.error
    event.target.value = ''
    return
  }
  
  trackForm.value.artworkFile = file
  modalError.value = ''
}

const uploadFile = async (file, path, isAudio = false) => {
  const fileRef = storageRef(storage, path)
  
  // Set proper metadata for the file
  const metadata = {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    }
  }
  
  // For audio files, force download with Content-Disposition header
  if (isAudio) {
    metadata.contentDisposition = `attachment; filename="${encodeURIComponent(file.name)}"`
    // Ensure proper audio content type
    if (!metadata.contentType || metadata.contentType === 'application/octet-stream') {
      metadata.contentType = 'audio/mpeg'
    }
  }
  
  const uploadTask = uploadBytesResumable(fileRef, file, metadata)
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      null,
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadURL)
      }
    )
  })
}

// Complete updated saveTrack function
const saveTrack = async () => {
  // Validate basic fields
  const validation = validateTrackMetadata(trackForm.value)
  if (!validation.isValid) {
    modalError.value = validation.errors.join('. ')
    return
  }
  
  // Validate collaborators
  if (!isSplitValid.value) {
    modalError.value = `Royalty splits must add up to 100% (currently ${totalSplitPercentage.value.toFixed(2)}%)`
    return
  }
  
  // Validate each collaborator
  for (const collab of trackForm.value.collaborators) {
    if (!collab.name.trim()) {
      modalError.value = 'All collaborators must have a name'
      return
    }
    if (!collab.email.trim() || !collab.email.includes('@')) {
      modalError.value = 'All collaborators must have a valid PayPal email'
      return
    }
    if (collab.percentage <= 0) {
      modalError.value = 'All collaborators must have a percentage greater than 0'
      return
    }
  }
  
  if (!editingTrack.value && (!trackForm.value.audioFile || !trackForm.value.artworkFile)) {
    modalError.value = 'Audio and artwork files are required'
    return
  }
  
  saving.value = true
  modalError.value = ''
  coverArtUploadProgress.value = 0
  
  try {
    const user = auth.currentUser
    const trackData = {
      title: trackForm.value.title.trim(),
      description: trackForm.value.description.trim(),
      price: parseFloat(trackForm.value.price) || 0,
      allowDownload: trackForm.value.allowDownload,
      order: trackForm.value.order,
      artistId: artist.value.id,
      artistName: artist.value.name,
      collaborators: trackForm.value.collaborators.map(collab => ({
        name: collab.name.trim(),
        email: collab.email.trim(),
        percentage: parseFloat(collab.percentage),
        isPrimary: collab.isPrimary || false
      })),
      updatedAt: serverTimestamp()
    }
    
    // Upload files if provided
    if (trackForm.value.audioFile) {
      // Extract audio metadata before upload
      const audioMetadata = await extractAudioMetadata(trackForm.value.audioFile)
      
      const audioPath = `${user.uid}/medley/${artist.value.id}/audio/${Date.now()}_${trackForm.value.audioFile.name}`
      
      // Pass true as third parameter to indicate this is an audio file
      trackData.audioUrl = await uploadFile(trackForm.value.audioFile, audioPath, true)
      trackData.audioPath = audioPath
      trackData.audioFilename = trackForm.value.audioFile.name
      trackData.audioSize = trackForm.value.audioFile.size
      
      // Add the extracted metadata
      trackData.audioMetadata = {
        format: audioMetadata.format,
        sampleRate: audioMetadata.sampleRate,
        bitDepth: audioMetadata.bitDepth,
        bitrate: audioMetadata.bitrate,
        duration: audioMetadata.duration,
        channels: audioMetadata.channels
      }
    }
    
    // Upload artwork with thumbnail generation
    if (trackForm.value.artworkFile) {
      const trackTimestamp = editingTrack.value?.id || Date.now()
      
      try {
        const artworkResult = await uploadCoverArtWithThumbnail(
          trackForm.value.artworkFile,
          user.uid,
          artist.value.id,
          trackTimestamp,
          {
            onProgress: (progress) => {
              coverArtUploadProgress.value = progress
            },
            onError: (error) => {
              console.error('Cover art upload error:', error)
              modalError.value = 'Failed to upload cover art. Please try again.'
            }
          }
        )
        
        // Store both original and thumbnail URLs/paths
        trackData.artworkUrl = artworkResult.thumbnail.url // Use thumbnail for display
        trackData.artworkPath = artworkResult.thumbnail.path
        trackData.artworkOriginalUrl = artworkResult.original.url
        trackData.artworkOriginalPath = artworkResult.original.path
        
      } catch (error) {
        console.error('Error processing cover art:', error)
        modalError.value = 'Failed to process cover art. Please try again.'
        saving.value = false
        coverArtUploadProgress.value = 0
        return
      }
    }
    
    if (editingTrack.value) {
      // Update existing
      await updateDoc(doc(db, 'medleyTracks', editingTrack.value.id), trackData)
    } else {
      // Create new
      trackData.createdAt = serverTimestamp()
      trackData.createdBy = user.uid
      await addDoc(collection(db, 'medleyTracks'), trackData)
    }
    
    // Mark artist as having public medley
    if (!artist.value.hasPublicMedley) {
      await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
        hasPublicMedley: true
      })
      artist.value.hasPublicMedley = true
    }
    
    await loadTracks()
    closeModal()
  } catch (err) {
    console.error('Error saving track:', err)
    modalError.value = 'Failed to save track. Please try again.'
  } finally {
    saving.value = false
    coverArtUploadProgress.value = 0
  }
}

// Complete updated deleteTrack function
const deleteTrack = async (track) => {
  if (!confirm(`Delete "${track.title}"?`)) return
  
  try {
    // Delete from Firestore
    await firestoreDeleteDoc(doc(db, 'medleyTracks', track.id))
    
    // Delete audio file from storage
    if (track.audioPath) {
      try {
        await deleteObject(storageRef(storage, track.audioPath))
      } catch (err) {
        console.warn('Could not delete audio file:', err)
      }
    }
    
    // Delete cover art files (both original and thumbnail)
    if (track.artworkOriginalPath || track.artworkPath) {
      try {
        await deleteCoverArt(track.artworkOriginalPath, track.artworkPath)
      } catch (err) {
        console.warn('Could not delete cover art:', err)
      }
    }
    
    // Update artist if no tracks remain
    if (tracks.value.length === 1) {
      await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
        hasPublicMedley: false
      })
      artist.value.hasPublicMedley = false
    }
    
    // Reload tracks
    await loadTracks()
  } catch (err) {
    console.error('Error deleting track:', err)
    alert('Failed to delete track')
  }
}

const closeModal = () => {
  showTrackModal.value = false
  editingTrack.value = null
  modalError.value = ''
  trackForm.value = {
    title: '',
    description: '',
    price: 0,
    allowDownload: true,
    audioFile: null,
    artworkFile: null,
    order: 0,
    collaborators: []
  }
  // Clear file inputs
  if (audioFileInput.value) audioFileInput.value.value = ''
  if (artworkFileInput.value) artworkFileInput.value.value = ''
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// PhotoLab methods
const openPhotoLab = (photo) => {
  photoLabPhoto.value = photo
  showPhotoLab.value = true
}

const closePhotoLab = () => {
  showPhotoLab.value = false
  photoLabPhoto.value = null
}

const handleProcessedPhoto = async (processedImageData) => {
  // Convert data URL to blob
  try {
    const response = await fetch(processedImageData)
    const blob = await response.blob()
    const file = new File([blob], `processed_${Date.now()}.jpg`, { type: 'image/jpeg' })
    
    await uploadPhoto(file)
    closePhotoLab()
  } catch (err) {
    console.error('Error saving processed photo:', err)
    alert('Failed to save processed photo')
  }
}

// Audio player visibility toggle
const toggleMedleyVisibility = async () => {
  try {
    const newStatus = !artist.value.hasPublicMedley
    
    // Update Firestore
    await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
      hasPublicMedley: newStatus,
      updatedAt: serverTimestamp()
    })
    
    // Update local state
    artist.value.hasPublicMedley = newStatus
    
  } catch (error) {
    console.error('Error toggling medley visibility:', error)
    alert('Failed to update medley visibility')
  }
}

onMounted(async () => {
  await loadArtistData()
})
</script>

<template>
  <div class="artist-studio">
    <div class="page-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading studio...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <router-link to="/discover" class="btn btn-primary">
          Back to Discover
        </router-link>
      </div>

      <!-- No Artist Profile Yet -->
      <div v-else-if="!artist && isOwnStudio" class="no-profile">
        <div class="empty-state">
          <font-awesome-icon :icon="['fas', 'microphone-alt']" class="empty-icon" />
          <h2>Set Up Your Artist Profile</h2>
          <p>You're registered as an artist, but you haven't created your profile yet.</p>
          <p>Create your profile to start uploading music and sharing with fans!</p>
          <router-link to="/artist/create" class="btn btn-primary btn-lg">
            <font-awesome-icon :icon="['fas', 'plus']" />
            Create Artist Profile
          </router-link>
        </div>
      </div>

      <!-- Studio Content (when artist profile exists) -->
      <div v-else>
        <!-- Studio Header -->
        <div class="studio-header">
          <div class="artist-info">
            <img 
              v-if="artist.profileImageUrl" 
              :src="artist.profileImageUrl" 
              :alt="artist.name"
              class="artist-avatar"
            />
            <div v-else class="artist-avatar-placeholder">
              <font-awesome-icon :icon="['fas', 'music']" />
            </div>
            <div>
              <h1>{{ artist.name }}'s Studio</h1>
              <p class="artist-genre">{{ artist.genre || 'Independent Artist' }}</p>
              <!-- Add toggle switch here -->
              <label class="toggle-switch mt-sm">
                <input 
                  type="checkbox" 
                  :checked="artist.hasPublicMedley"
                  @change="toggleMedleyVisibility"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-label">
                  {{ artist.hasPublicMedley ? 'Medley is Public' : 'Medley is Hidden' }}
                </span>
              </label>
              <!-- Show viewing notice for label/manager/admin -->
              <p v-if="!isOwnStudio" class="viewing-notice">
                <font-awesome-icon :icon="['fas', 'eye']" />
                Viewing as {{ getRoleLabel(userData?.userType) }}
              </p>
            </div>
          </div>
          <!-- Back button when viewing another artist's studio -->
          <router-link v-if="!isOwnStudio" to="/roster" class="btn btn-secondary">
            <font-awesome-icon :icon="['fas', 'arrow-left']" />
            Back to Roster
          </router-link>
        </div>

        <!-- Quick Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'play']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalPlays }}</div>
              <div class="stat-label">Total Plays</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'heart']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalHearts }}</div>
              <div class="stat-label">Hearts</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'download']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalDownloads }}</div>
              <div class="stat-label">Downloads</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'dollar-sign']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">${{ stats.totalRevenue.toFixed(2) }}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
          </div>
        </div>

        <!-- Track Management Section -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">
              <font-awesome-icon :icon="['fas', 'music']" class="section-icon" />
              Medley Tracks
            </h2>
          </div>
          
          <!-- Track Slots -->
          <div class="track-slots">
            <div 
              v-for="(slot, index) in 4" 
              :key="index"
              class="track-slot"
              :class="{ 'filled': tracks[index], 'empty': !tracks[index] }"
            >
              <!-- Filled Slot -->
              <div v-if="tracks[index]" class="track-content">
                <img 
                  v-if="tracks[index].artworkUrl" 
                  :src="tracks[index].artworkUrl" 
                  :alt="tracks[index].title"
                  class="track-artwork"
                />
                <div v-else class="artwork-placeholder">
                  <font-awesome-icon :icon="['fas', 'music']" />
                </div>
                <div class="track-details">
                  <h3>{{ tracks[index].title }}</h3>
                  <p>${{ tracks[index].price.toFixed(2) }}</p>
                  <div v-if="tracks[index].collaborators && tracks[index].collaborators.length > 1" class="collaborator-count">
                    <font-awesome-icon :icon="['fas', 'users']" />
                    {{ tracks[index].collaborators.length }} collaborators
                  </div>
                </div>
                <button 
                  @click="editTrack(tracks[index])"
                  class="btn-edit"
                >
                  <font-awesome-icon :icon="['fas', 'edit']" />
                </button>
                <button 
                  @click="deleteTrack(tracks[index])"
                  class="btn-delete"
                >
                  <font-awesome-icon :icon="['fas', 'trash']" />
                </button>
              </div>
              
              <!-- Empty Slot -->
              <button 
                v-else 
                @click="addTrack(index)"
                class="empty-slot-btn"
              >
                <font-awesome-icon :icon="['fas', 'plus']" />
                <span>Add Track</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Photo Management Section -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">
              <font-awesome-icon :icon="['fas', 'camera']" class="section-icon" />
              Photos
            </h2>
          </div>
          
          <!-- Photo Grid -->
          <div class="photo-grid">
            <!-- Existing Photos -->
            <div 
              v-for="photo in photos" 
              :key="photo.id"
              class="photo-item"
              :class="{ 'primary': photo.isPrimary }"
            >
              <img 
                :src="photo.croppedThumbnailUrl || photo.thumbnailUrl" 
                :alt="`Artist photo ${photo.id}`"
                class="photo-thumbnail"
                @click="viewPhoto(photo)"
              />
              <div class="photo-actions">
                <button 
                  @click="openPhotoLab(photo)"
                  class="btn-action"
                  title="Edit photo"
                >
                  <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" />
                </button>
                <button 
                  v-if="!photo.isPrimary"
                  @click="setPrimaryPhoto(photo)"
                  class="btn-action"
                  title="Set as primary"
                >
                  <font-awesome-icon :icon="['fas', 'star']" />
                </button>
                <button 
                  @click="deletePhoto(photo)"
                  class="btn-action btn-delete"
                  title="Delete photo"
                >
                  <font-awesome-icon :icon="['fas', 'trash']" />
                </button>
              </div>
              <div v-if="photo.isPrimary" class="primary-badge">
                <font-awesome-icon :icon="['fas', 'star']" />
                Primary
              </div>
            </div>
            
            <!-- Add Photo Button -->
            <button 
              @click="selectPhotoFile"
              class="add-photo-btn"
              :disabled="uploadingPhoto"
            >
              <font-awesome-icon 
                v-if="uploadingPhoto" 
                :icon="['fas', 'spinner']" 
                class="fa-spin" 
              />
              <font-awesome-icon 
                v-else
                :icon="['fas', 'plus']" 
              />
              <span>{{ uploadingPhoto ? 'Uploading...' : 'Add Photo' }}</span>
            </button>
            
            <!-- Hidden File Input -->
            <input
              ref="photoFileInput"
              type="file"
              accept="image/*"
              @change="handlePhotoFileSelect"
              style="display: none"
            />
          </div>
          
          <!-- Upload Progress -->
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p class="text-muted text-center mt-sm">Uploading photo... {{ uploadProgress }}%</p>
          </div>
        </div>

        <!-- Public Link Section -->
        <div v-if="artist.customSlug && artist.hasPublicMedley" class="section-card">
          <h2>
            <font-awesome-icon :icon="['fas', 'share']" />
            Share Your Medley
          </h2>
          <div class="link-display">
            <code>{{ publicUrl }}</code>
            <button @click="copyLink" class="btn btn-secondary">
              <font-awesome-icon :icon="['fas', 'copy']" />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Add a notice when medley is hidden -->
        <div v-else-if="artist.customSlug && !artist.hasPublicMedley" class="section-card">
          <h2>
            <font-awesome-icon :icon="['fas', 'eye-slash']" />
            Medley is Hidden
          </h2>
          <p class="text-secondary">
            Your medley is currently hidden from the public. Toggle the switch above to make it discoverable.
          </p>
        </div>

        <!-- Getting Started Tips -->
        <div v-if="!artist.hasPublicMedley" class="tips-card">
          <h3>
            <font-awesome-icon :icon="['fas', 'lightbulb']" />
            Getting Started
          </h3>
          <ol>
            <li>Upload your first track to create your medley</li>
            <li>Add up to 4 tracks with custom artwork</li>
            <li>Share your medley link with fans</li>
            <li>Get paid directly via PayPal</li>
          </ol>
        </div>
      </div>

      <!-- Edit Track Modal -->
      <div v-if="showTrackModal" class="modal-overlay" @click="closeModal">
        <div class="modal modal-lg" @click.stop>
          <div class="modal-header">
            <h3>
              <font-awesome-icon :icon="editingTrack ? ['fas', 'edit'] : ['fas', 'plus']" />
              {{ editingTrack ? 'Edit Track' : 'Add Track' }}
            </h3>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          
          <div class="modal-content">
            <form @submit.prevent="saveTrack">
              <!-- Track Title -->
              <div class="form-group">
                <label class="form-label">Track Title *</label>
                <input
                  v-model="trackForm.title"
                  type="text"
                  class="form-input"
                  placeholder="Enter track title"
                  required
                />
              </div>

              <!-- Track Description -->
              <div class="form-group">
                <label class="form-label">Description (Optional)</label>
                <textarea
                  v-model="trackForm.description"
                  class="form-textarea"
                  rows="3"
                  placeholder="Brief description"
                ></textarea>
              </div>

              <!-- Price and Download Settings -->
              <div class="grid grid-2 gap-md">
                <div class="form-group">
                  <label class="form-label">Price ($)</label>
                  <input
                    v-model.number="trackForm.price"
                    type="number"
                    step="0.50"
                    min="0"
                    max="10"
                    class="form-input"
                  />
                  <p class="form-hint">$0 = Free download, max $10</p>
                </div>

                <div class="form-group">
                  <label class="form-label">Download Option</label>
                  <label class="checkbox-label">
                    <input
                      v-model="trackForm.allowDownload"
                      type="checkbox"
                    />
                    <span>Allow download after purchase</span>
                  </label>
                  <p class="form-hint">Unchecked = Stream only</p>
                </div>
              </div>

              <!-- Collaborators Section -->
              <div class="form-section">
                <div class="section-header-inline">
                  <h4>
                    <font-awesome-icon :icon="['fas', 'users']" />
                    Royalty Splits
                  </h4>
                  <button 
                    type="button" 
                    @click="autoBalanceSplits" 
                    class="btn btn-sm btn-secondary"
                    :disabled="trackForm.collaborators.length === 0"
                  >
                    <font-awesome-icon :icon="['fas', 'percentage']" />
                    Split Equally
                  </button>
                </div>
                
                <div class="collaborators-list">
                  <div 
                    v-for="(collab, index) in trackForm.collaborators" 
                    :key="collab.id"
                    class="collaborator-row"
                    :class="{ 'primary-artist': collab.isPrimary }"
                  >
                    <div class="collab-fields">
                      <div class="form-group">
                        <input
                          v-model="collab.name"
                          type="text"
                          class="form-input"
                          placeholder="Name"
                          :readonly="collab.isPrimary"
                        />
                      </div>
                      
                      <div class="form-group">
                        <input
                          v-model="collab.email"
                          type="email"
                          class="form-input"
                          placeholder="PayPal Email"
                        />
                      </div>
                      
                      <div class="form-group percentage-input">
                        <div class="input-group">
                          <input
                            :value="collab.percentage"
                            @input="updateCollaboratorSplit(index, $event.target.value)"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            class="form-input"
                            placeholder="0"
                          />
                          <span class="input-addon">%</span>
                        </div>
                      </div>
                      
                      <button
                        v-if="!collab.isPrimary"
                        type="button"
                        @click="removeCollaborator(index)"
                        class="btn-icon btn-danger"
                        title="Remove collaborator"
                      >
                        <font-awesome-icon :icon="['fas', 'trash']" />
                      </button>
                    </div>
                    
                    <p v-if="collab.isPrimary" class="form-hint text-primary">
                      <font-awesome-icon :icon="['fas', 'crown']" />
                      Primary Artist
                    </p>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  @click="addCollaborator" 
                  class="btn btn-secondary btn-sm w-full"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                  Add Collaborator
                </button>
                
                <!-- Split Total -->
                <div class="split-total" :class="{ 'invalid': !isSplitValid }">
                  <span>Total Split:</span>
                  <strong>{{ totalSplitPercentage.toFixed(2) }}%</strong>
                  <span v-if="!isSplitValid" class="text-danger ml-sm">
                    (Must equal 100%)
                  </span>
                </div>
              </div>

              <!-- Audio File -->
              <div class="form-group">
                <label class="form-label">
                  Audio File {{ editingTrack ? '(Leave empty to keep current)' : '*' }}
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  @change="handleAudioFileSelect"
                  class="form-input"
                  ref="audioFileInput"
                />
                <p class="form-hint">Maximum file size: 200MB</p>
              </div>

              <!-- Artwork File -->
              <div class="form-group">
                <label class="form-label">
                  Artwork {{ editingTrack ? '(Leave empty to keep current)' : '*' }}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleArtworkFileSelect"
                  class="form-input"
                  ref="artworkFileInput"
                />
                <p class="form-hint">Maximum file size: 20MB. Will be cropped to square and resized to 1000×1000px.</p>
                
                <!-- Cover art upload progress -->
                <div v-if="coverArtUploadProgress > 0 && coverArtUploadProgress < 100" class="upload-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: coverArtUploadProgress + '%' }"></div>
                  </div>
                  <p class="text-muted text-center mt-sm">Processing cover art... {{ Math.round(coverArtUploadProgress) }}%</p>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="modalError" class="error-message">
                {{ modalError }}
              </div>

              <!-- Form Actions -->
              <div class="modal-footer">
                <button type="button" @click="closeModal" class="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="saving || !isSplitValid">
                  <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" class="fa-spin mr-sm" />
                  {{ saving ? 'Saving...' : (editingTrack ? 'Save Changes' : 'Add Track') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Photo Viewer Modal -->
      <div v-if="viewingPhoto" class="modal-overlay" @click="viewingPhoto = null">
        <div class="photo-viewer" @click.stop>
          <button @click="viewingPhoto = null" class="close-btn">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>
          <img 
            :src="viewingPhoto.originalUrl" 
            :alt="`Artist photo`"
            class="photo-full"
          />
          <div class="photo-info">
            <p><strong>Size:</strong> {{ formatFileSize(viewingPhoto.fileSize) }}</p>
            <p><strong>Dimensions:</strong> {{ viewingPhoto.width }} × {{ viewingPhoto.height }}px</p>
            <p v-if="viewingPhoto.metadata?.dateTime">
              <strong>Taken:</strong> {{ formatDate(viewingPhoto.metadata.dateTime) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Photo Lab Modal -->
      <PhotoLab
        v-if="showPhotoLab && photoLabPhoto"
        :photo="photoLabPhoto"
        @close="closePhotoLab"
        @save="handleProcessedPhoto"
      />

      <!-- Circular Crop Editor Modal -->
      <CircularCropEditor
        v-if="showCropEditor && cropEditorPhoto"
        :photo="cropEditorPhoto"
        @close="closeCropEditor"
        @save="handleCroppedPhoto"
      />

    </div>
  </div>
</template>

<style scoped>
.artist-studio {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* No Profile State */
.no-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  max-width: 500px;
}

.empty-icon {
  font-size: 5rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  opacity: 0.8;
}

.empty-state h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: 2rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
}

.empty-state p:last-of-type {
  margin-bottom: var(--spacing-xl);
}

/* Studio Header */
.studio-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-2xl);
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.artist-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.artist-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.artist-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-muted);
}

.artist-info h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 2rem;
}

.artist-genre {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.viewing-notice {
  margin: var(--spacing-xs) 0 0 0;
  color: var(--color-primary);
  font-size: var(--font-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.viewing-notice svg {
  font-size: 0.9rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: var(--bg-card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: var(--bg-hover);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: var(--spacing-xs);
}

/* Track Slots */
.track-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.track-slot {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  min-height: 300px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.empty-slot-btn {
  width: 100%;
  height: 100%;
  background: transparent;
  border: 3px dashed var(--border-primary);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  color: var(--text-secondary);
}

.empty-slot-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--bg-hover);
}

.empty-slot-btn svg {
  font-size: 3rem;
}

/* Track Content */
.track-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.track-artwork,
.artwork-placeholder {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.artwork-placeholder {
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--text-muted);
}

.track-details {
  padding: var(--spacing-md);
  flex: 1;
}

.track-details h3 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.track-details p {
  color: var(--color-primary);
  font-weight: 600;
  margin: 0;
}

.collaborator-count {
  margin-top: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-edit,
.btn-delete {
  position: absolute;
  top: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-edit {
  right: calc(var(--spacing-sm) + 44px);
}

.btn-delete {
  right: var(--spacing-sm);
}

.btn-edit:hover,
.btn-delete:hover {
  transform: scale(1.1);
}

.btn-delete:hover {
  background: var(--color-danger);
}

/* Photo Grid */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.photo-item.primary {
  box-shadow: 0 0 0 3px var(--color-primary);
}

.photo-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.photo-actions {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.photo-item:hover .photo-actions {
  opacity: 1;
}

.btn-action {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-action:hover {
  transform: scale(1.1);
  background: var(--color-primary);
}

.btn-action.btn-delete:hover {
  background: var(--color-danger);
}

.primary-badge {
  position: absolute;
  bottom: var(--spacing-sm);
  left: var(--spacing-sm);
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.add-photo-btn {
  aspect-ratio: 1;
  background: transparent;
  border: 3px dashed var(--border-primary);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
  color: var(--text-secondary);
}

.add-photo-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--bg-hover);
}

.add-photo-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add-photo-btn svg {
  font-size: 2rem;
}

/* Upload Progress */
.upload-progress {
  margin-top: var(--spacing-sm);
}

/* Photo Viewer Modal */
.photo-viewer {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.photo-full {
  display: block;
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.photo-info {
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
}

.photo-info p {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--text-secondary);
}

.photo-info strong {
  color: var(--text-primary);
}

/* Section Cards */
.section-card {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
}

.section-card h2 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: 1.5rem;
}

/* Link Display */
.link-display {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.link-display code {
  flex: 1;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
}

/* Tips Card */
.tips-card {
  background: linear-gradient(135deg, var(--color-primary), #764ba2);
  color: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.tips-card h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-lg) 0;
}

.tips-card ol {
  margin: 0 0 var(--spacing-lg) var(--spacing-lg);
  padding: 0;
}

.tips-card li {
  margin-bottom: var(--spacing-sm);
}

/* Modal Overrides */
.modal-lg {
  max-width: 600px;
}

.modal-footer {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
}

/* Collaborators Section */
.form-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.section-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header-inline h4 {
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.collaborator-row {
  background: var(--bg-card);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: all var(--transition-normal);
}

.collaborator-row.primary-artist {
  border-color: var(--color-primary);
  background: var(--bg-hover);
}

.collab-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 120px auto;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.collab-fields .form-group {
  margin: 0;
}

.percentage-input {
  max-width: 120px;
}

.input-group {
  display: flex;
  align-items: center;
}

.input-group .form-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-addon {
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 2px solid var(--border-primary);
  border-left: none;
  border-top-right-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 600;
}

.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-icon.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-icon.btn-danger:hover {
  background: var(--color-danger-hover);
  transform: scale(1.1);
}

.split-total {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-lg);
  font-size: 1.1rem;
  border: 2px solid var(--border-primary);
  transition: all var(--transition-normal);
}

.split-total.invalid {
  border-color: var(--color-danger);
  background: rgba(220, 53, 69, 0.1);
}

.split-total strong {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.split-total.invalid strong {
  color: var(--color-danger);
}

/* Form Elements */
.form-textarea {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color var(--transition-normal);
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.form-hint.text-primary {
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

/* Grid Utilities */
.grid {
  display: grid;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.gap-md {
  gap: var(--spacing-md);
}

/* Checkbox Label */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--spacing-md);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid var(--border-primary);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error */
.error-container {
  text-align: center;
  padding: var(--spacing-2xl);
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--border-primary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width var(--transition-normal);
}

/* Utilities */
.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mr-sm { margin-right: var(--spacing-sm); }
.ml-sm { margin-left: var(--spacing-sm); }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-danger { color: var(--color-danger); }
.text-primary { color: var(--color-primary); }
.w-full { width: 100%; }

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.875rem;
}

.btn-lg {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1.1rem;
}

/* Animations */
.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .studio-header {
    flex-direction: column;
    gap: var(--spacing-lg);
    text-align: center;
  }
  
  .artist-info {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .track-slots {
    grid-template-columns: 1fr;
  }
  
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .link-display {
    flex-direction: column;
  }
  
  .link-display code {
    word-break: break-all;
  }
  
  .grid-2 {
    grid-template-columns: 1fr;
  }
  
  .collab-fields {
    grid-template-columns: 1fr;
  }
  
  .percentage-input {
    max-width: 100%;
  }
  
  .section-header-inline {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: var(--spacing-md);
  }
  
  .studio-header {
    padding: var(--spacing-lg);
  }
  
  .artist-info h1 {
    font-size: 1.5rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-md);
  }
}
</style>