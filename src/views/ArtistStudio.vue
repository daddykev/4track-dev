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
import ColorThief from 'colorthief'

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

// States for color customization
const showColorModal = ref(false)
const extractingColors = ref(false)
const colorPalette = ref(null)
const selectedGradient = ref({
  start: { r: 102, g: 126, b: 234 }, // Default --color-primary
  end: { r: 118, g: 75, b: 162 }     // Default #764ba2
})
const selectedTextColors = ref({
  primary: { r: 255, g: 255, b: 255 },
  secondary: { r: 255, g: 255, b: 255, a: 0.9 }
})
const isUsingDefaultColors = ref(true)
const savingColors = ref(false)
const isManualTextColor = ref(false)
const manualTextColorMode = ref('light') // 'light' or 'dark'

// Live Shows state
const shows = ref([])
const showShowModal = ref(false)
const editingShow = ref(null)
const savingShow = ref(false)
const showModalError = ref('')
const flyerFileInput = ref(null)

// Live Show form state
const showForm = ref({
  title: '',
  description: '',
  eventDate: '',
  eventTime: '20:00',
  venue: '',
  location: '',
  ticketUrl: '',
  flyerFile: null
})

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

// Computed show properties
const upcomingShows = computed(() => {
  const now = new Date()
  return shows.value
    .filter(show => {
      const eventDate = show.eventDate?.toDate ? show.eventDate.toDate() : new Date(show.eventDate)
      return eventDate > now
    })
    .sort((a, b) => {
      const dateA = a.eventDate?.toDate ? a.eventDate.toDate() : new Date(a.eventDate)
      const dateB = b.eventDate?.toDate ? b.eventDate.toDate() : new Date(b.eventDate)
      return dateA - dateB
    })
})

const pastShows = computed(() => {
  const now = new Date()
  return shows.value
    .filter(show => {
      const eventDate = show.eventDate?.toDate ? show.eventDate.toDate() : new Date(show.eventDate)
      return eventDate <= now
    })
    .sort((a, b) => {
      const dateA = a.eventDate?.toDate ? a.eventDate.toDate() : new Date(a.eventDate)
      const dateB = b.eventDate?.toDate ? b.eventDate.toDate() : new Date(b.eventDate)
      return dateB - dateA // Most recent first
    })
})

// Computed color properties
const hasColorPalette = computed(() => {
  return artist.value?.colorPalette?.extractedColors?.length > 0
})

const currentGradientStyle = computed(() => {
  const start = selectedGradient.value.start
  const end = selectedGradient.value.end
  return `linear-gradient(135deg, rgb(${start.r}, ${start.g}, ${start.b}) 0%, rgb(${end.r}, ${end.g}, ${end.b}) 100%)`
})

// Color utility functions
const rgbToHex = (color) => {
  const toHex = (n) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
}

const colorToString = (color) => {
  if (color.a !== undefined) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
  }
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}

const hslToRgb = (h, s, l) => {
  let r, g, b
  
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  return { r: r * 255, g: g * 255, b: b * 255 }
}

const getHue = (color) => {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  
  if (delta === 0) return 0
  
  let hue = 0
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  
  return hue * 60
}

const calculateAverageBrightness = (color1, color2) => {
  const brightness1 = (color1.r * 299 + color1.g * 587 + color1.b * 114) / 1000
  const brightness2 = (color2.r * 299 + color2.g * 587 + color2.b * 114) / 1000
  return (brightness1 + brightness2) / 2
}

const calculateGradientScore = (color1, color2) => {
  const brightness1 = (color1.r * 299 + color1.g * 587 + color1.b * 114) / 1000
  const brightness2 = (color2.r * 299 + color2.g * 587 + color2.b * 114) / 1000
  const contrast = Math.abs(brightness1 - brightness2)
  
  const colorDistance = Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  )
  
  const hue1 = getHue(color1)
  const hue2 = getHue(color2)
  const hueDistance = Math.min(Math.abs(hue1 - hue2), 360 - Math.abs(hue1 - hue2))
  
  const hueScore = hueDistance > 60 && hueDistance < 300 ? hueDistance : hueDistance * 0.5
  
  return contrast + (colorDistance * 0.5) + (hueScore * 0.3)
}

// Load existing colors
const loadArtistColors = () => {
  if (artist.value?.colorPalette) {
    const palette = artist.value.colorPalette
    
    if (palette.extractedColors) {
      colorPalette.value = palette.extractedColors
    }
    
    if (palette.selectedGradient) {
      selectedGradient.value = palette.selectedGradient
    }
    
    if (palette.textColors) {
      selectedTextColors.value = palette.textColors
    }
    
    if (palette.isManualTextColor !== undefined) {
      isManualTextColor.value = palette.isManualTextColor
    }
    
    if (palette.manualTextColorMode) {
      manualTextColorMode.value = palette.manualTextColorMode
    }
    
    isUsingDefaultColors.value = palette.isDefault !== false
  }
}

// Color extraction from image
const extractColorsFromImage = async (imageUrl) => {
  extractingColors.value = true
  
  try {
    await tryColorThiefExtraction(imageUrl)
  } catch (error) {
    console.error('ColorThief extraction failed:', error)
    await generateIntelligentColors()
  } finally {
    extractingColors.value = false
  }
}

const tryColorThiefExtraction = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief()
        const palette = colorThief.getPalette(img, 8)
        
        if (!palette || palette.length === 0) {
          throw new Error('ColorThief returned empty palette')
        }
        
        colorPalette.value = palette.map(color => ({
          r: color[0],
          g: color[1],
          b: color[2]
        }))
        
        autoSelectGradientColors()
        resolve()
        
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Image failed to load'))
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
  })
}

const generateIntelligentColors = async () => {
  // Fallback color generation based on artist data
  const baseHue = Math.abs(simpleHash(artist.value.name + artist.value.id)) % 360
  const colors = []
  
  for (let i = 0; i < 8; i++) {
    const hue = (baseHue + (i * 45)) % 360
    const saturation = 50 + (i % 3) * 20
    const lightness = 40 + (i % 4) * 15
    
    const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100)
    colors.push({
      r: Math.round(rgb.r),
      g: Math.round(rgb.g),
      b: Math.round(rgb.b)
    })
  }
  
  colorPalette.value = colors
  autoSelectGradientColors()
}

const simpleHash = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

const findOptimalGradientEnd = (palette, startColor) => {
  let bestColor = palette[1]
  let bestScore = 0
  
  for (let i = 1; i < palette.length; i++) {
    const candidate = palette[i]
    const score = calculateGradientScore(startColor, candidate)
    
    if (score > bestScore) {
      bestScore = score
      bestColor = candidate
    }
  }
  
  return bestColor
}

const autoSelectGradientColors = () => {
  if (!colorPalette.value || colorPalette.value.length < 2) return
  
  const startColor = colorPalette.value[0]
  const endColor = findOptimalGradientEnd(colorPalette.value, startColor)
  
  selectedGradient.value = {
    start: startColor,
    end: endColor
  }
  
  if (!isManualTextColor.value) {
    autoSelectTextColors()
  }
  
  isUsingDefaultColors.value = false
}

const autoSelectTextColors = () => {
  const avgBrightness = calculateAverageBrightness(selectedGradient.value.start, selectedGradient.value.end)
  
  if (avgBrightness > 140) {
    selectedTextColors.value = {
      primary: { r: 28, g: 28, b: 28 },
      secondary: { r: 28, g: 28, b: 28, a: 0.8 }
    }
  } else {
    selectedTextColors.value = {
      primary: { r: 255, g: 255, b: 255 },
      secondary: { r: 255, g: 255, b: 255, a: 0.9 }
    }
  }
}

const toggleManualTextColor = () => {
  isManualTextColor.value = !isManualTextColor.value
  
  if (isManualTextColor.value) {
    applyManualTextColor()
  } else {
    autoSelectTextColors()
  }
}

const setManualTextColorMode = (mode) => {
  manualTextColorMode.value = mode
  if (isManualTextColor.value) {
    applyManualTextColor()
  }
}

const applyManualTextColor = () => {
  if (manualTextColorMode.value === 'dark') {
    selectedTextColors.value = {
      primary: { r: 28, g: 28, b: 28 },
      secondary: { r: 28, g: 28, b: 28, a: 0.8 }
    }
  } else {
    selectedTextColors.value = {
      primary: { r: 255, g: 255, b: 255 },
      secondary: { r: 255, g: 255, b: 255, a: 0.9 }
    }
  }
}

const selectGradientColor = (color, position) => {
  selectedGradient.value[position] = { ...color }
  isUsingDefaultColors.value = false
  
  if (!isManualTextColor.value) {
    autoSelectTextColors()
  }
}

const resetToDefaultColors = () => {
  selectedGradient.value = {
    start: { r: 102, g: 126, b: 234 },
    end: { r: 118, g: 75, b: 162 }
  }
  selectedTextColors.value = {
    primary: { r: 255, g: 255, b: 255 },
    secondary: { r: 255, g: 255, b: 255, a: 0.9 }
  }
  isUsingDefaultColors.value = true
  colorPalette.value = []
  isManualTextColor.value = false
  manualTextColorMode.value = 'light'
}

const saveColorPalette = async () => {
  savingColors.value = true
  
  try {
    const colorData = {
      colorPalette: {
        extractedColors: colorPalette.value || [],
        selectedGradient: selectedGradient.value,
        textColors: selectedTextColors.value,
        isDefault: isUsingDefaultColors.value,
        isManualTextColor: isManualTextColor.value,
        manualTextColorMode: manualTextColorMode.value,
        lastUpdated: new Date()
      }
    }
    
    await updateDoc(doc(db, 'artistProfiles', artist.value.id), colorData)
    artist.value.colorPalette = colorData.colorPalette
    closeColorModal()
    
  } catch (error) {
    console.error('Error saving color palette:', error)
    alert('Failed to save color palette')
  } finally {
    savingColors.value = false
  }
}

const openColorModal = () => {
  showColorModal.value = true
  loadArtistColors()
}

const closeColorModal = () => {
  showColorModal.value = false
}

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

    // Load shows
    await loadShows()

    // Load analytics
    await loadAnalytics()
    
    // Load color palette data (NEW)
    if (artist.value) {
      loadArtistColors()
    }
    
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

// Live Shows Management Functions
const loadShows = async () => {
  if (!artist.value) return

  try {
    const showsQuery = query(
      collection(db, 'liveShows'),
      where('artistId', '==', artist.value.id),
      orderBy('eventDate', 'asc')
    )

    const showsSnapshot = await getDocs(showsQuery)
    shows.value = showsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error loading shows:', err)
  }
}

const addShow = () => {
  showForm.value = {
    title: '',
    description: '',
    eventDate: '',
    eventTime: '20:00',
    venue: '',
    location: '',
    ticketUrl: '',
    flyerFile: null
  }
  editingShow.value = null
  showShowModal.value = true
}

const editShow = (show) => {
  const eventDate = show.eventDate?.toDate ? show.eventDate.toDate() : new Date(show.eventDate)

  showForm.value = {
    title: show.title,
    description: show.description || '',
    eventDate: eventDate.toISOString().split('T')[0],
    eventTime: eventDate.toTimeString().slice(0, 5),
    venue: show.venue,
    location: show.location || '',
    ticketUrl: show.ticketUrl || '',
    flyerFile: null
  }
  editingShow.value = show
  showShowModal.value = true
}

const saveShow = async () => {
  // Validation
  if (!showForm.value.title.trim()) {
    showModalError.value = 'Event title is required'
    return
  }
  if (showForm.value.title.length > 100) {
    showModalError.value = 'Event title must be less than 100 characters'
    return
  }
  if (!showForm.value.eventDate) {
    showModalError.value = 'Event date is required'
    return
  }
  if (!showForm.value.venue.trim()) {
    showModalError.value = 'Venue is required'
    return
  }
  if (!showForm.value.location.trim()) {
    showModalError.value = 'Location is required'
    return
  }
  if (showForm.value.ticketUrl && !isValidUrl(showForm.value.ticketUrl)) {
    showModalError.value = 'Please enter a valid ticket URL'
    return
  }

  savingShow.value = true
  showModalError.value = ''

  try {
    const user = auth.currentUser

    // Combine date and time into timestamp
    const eventDateTime = new Date(`${showForm.value.eventDate}T${showForm.value.eventTime}`)

    const showData = {
      title: showForm.value.title.trim(),
      description: showForm.value.description.trim(),
      eventDate: eventDateTime,
      venue: showForm.value.venue.trim(),
      location: showForm.value.location.trim(),
      ticketUrl: showForm.value.ticketUrl.trim(),
      artistId: artist.value.id,
      artistName: artist.value.name,
      updatedAt: serverTimestamp()
    }

    // Upload flyer if provided
    if (showForm.value.flyerFile) {
      const flyerPath = `${user.uid}/live-shows/${artist.value.id}/flyers/${Date.now()}_${showForm.value.flyerFile.name}`
      showData.flyerUrl = await uploadFile(showForm.value.flyerFile, flyerPath)
      showData.flyerPath = flyerPath
    }

    if (editingShow.value) {
      await updateDoc(doc(db, 'liveShows', editingShow.value.id), showData)
    } else {
      showData.createdAt = serverTimestamp()
      showData.createdBy = user.uid
      await addDoc(collection(db, 'liveShows'), showData)
    }

    // Update artist profile hasUpcomingShows flag
    await updateArtistShowFlags()

    await loadShows()
    closeShowModal()
  } catch (err) {
    console.error('Error saving show:', err)
    showModalError.value = 'Failed to save show. Please try again.'
  } finally {
    savingShow.value = false
  }
}

const deleteShow = async (show) => {
  if (!confirm(`Delete "${show.title}"?`)) return

  try {
    await firestoreDeleteDoc(doc(db, 'liveShows', show.id))

    // Delete flyer if exists
    if (show.flyerPath) {
      try {
        await deleteObject(storageRef(storage, show.flyerPath))
      } catch (err) {
        console.warn('Could not delete show flyer:', err)
      }
    }

    await updateArtistShowFlags()
    await loadShows()
  } catch (err) {
    console.error('Error deleting show:', err)
    alert('Failed to delete show')
  }
}

const closeShowModal = () => {
  showShowModal.value = false
  editingShow.value = null
  showModalError.value = ''
  showForm.value = {
    title: '',
    description: '',
    eventDate: '',
    eventTime: '20:00',
    venue: '',
    location: '',
    ticketUrl: '',
    flyerFile: null
  }
  if (flyerFileInput.value) flyerFileInput.value.value = ''
}

const handleFlyerFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const validation = validateImageFile(file, { maxSize: 10 * 1024 * 1024 })
  if (!validation.isValid) {
    showModalError.value = validation.error
    event.target.value = ''
    return
  }

  showForm.value.flyerFile = file
  showModalError.value = ''
}

const updateArtistShowFlags = async () => {
  const hasUpcoming = upcomingShows.value.length > 0

  await updateDoc(doc(db, 'artistProfiles', artist.value.id), {
    hasUpcomingShows: hasUpcoming
  })

  artist.value.hasUpcomingShows = hasUpcoming
}

// Helper function for URL validation
const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Show date formatting helpers
const formatShowMonth = (date) => {
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

const formatShowDay = (date) => {
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.getDate()
}

const formatShowTime = (date) => {
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const formatShowFullDate = (date) => {
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
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
      <div v-else-if="error" class="text-center p-xl">
        <p class="error-message mb-lg">{{ error }}</p>
        <router-link to="/discover" class="btn btn-primary">
          Back to Discover
        </router-link>
      </div>

      <!-- No Artist Profile Yet -->
      <div v-else-if="!artist && isOwnStudio" class="flex flex-center" style="min-height: 60vh;">
        <div class="card text-center" style="max-width: 500px;">
          <font-awesome-icon :icon="['fas', 'microphone-alt']" class="empty-icon text-primary mb-lg" />
          <h2 class="mb-md">Set Up Your Artist Profile</h2>
          <p class="text-secondary mb-md">You're registered as an artist, but you haven't created your profile yet.</p>
          <p class="text-secondary mb-xl">Create your profile to start uploading music and sharing with fans!</p>
          <router-link to="/artist/create" class="btn btn-primary btn-lg">
            <font-awesome-icon :icon="['fas', 'plus']" />
            Create Artist Profile
          </router-link>
        </div>
      </div>

      <!-- Studio Content (when artist profile exists) -->
      <div v-else>
        <!-- Studio Header -->
        <div class="card flex flex-between mb-xl">
          <div class="flex gap-lg">
            <img 
              v-if="artist.profileImageUrl" 
              :src="artist.profileImageUrl" 
              :alt="artist.name"
              class="artist-avatar"
            />
            <div v-else class="artist-avatar artist-avatar-placeholder flex flex-center">
              <font-awesome-icon :icon="['fas', 'music']" />
            </div>
            <div>
              <h1 class="m-0 mb-sm">{{ artist.name }}'s Studio</h1>
              <p class="text-secondary m-0 mb-sm">{{ artist.genre || 'Independent Artist' }}</p>
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
              <p v-if="!isOwnStudio" class="viewing-notice text-primary font-sm m-0 mt-sm">
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
        <div class="grid grid-4 gap-lg mb-xl stats-responsive">
          <div class="stat-card card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'play']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalPlays }}</div>
              <div class="stat-label text-secondary">Total Plays</div>
            </div>
          </div>
          
          <div class="stat-card card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'heart']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalHearts }}</div>
              <div class="stat-label text-secondary">Hearts</div>
            </div>
          </div>
          
          <div class="stat-card card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'download']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalDownloads }}</div>
              <div class="stat-label text-secondary">Downloads</div>
            </div>
          </div>
          
          <div class="stat-card card">
            <div class="stat-icon">
              <font-awesome-icon :icon="['fas', 'dollar-sign']" />
            </div>
            <div class="stat-content">
              <div class="stat-value">${{ stats.totalRevenue.toFixed(2) }}</div>
              <div class="stat-label text-secondary">Total Revenue</div>
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
          <div class="grid grid-4 gap-lg track-slots-responsive">
            <div 
              v-for="(slot, index) in 4" 
              :key="index"
              class="track-slot card"
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
                <div v-else class="track-artwork artwork-placeholder flex flex-center">
                  <font-awesome-icon :icon="['fas', 'music']" />
                </div>
                <div class="track-details p-md">
                  <h3 class="m-0 mb-xs">{{ tracks[index].title }}</h3>
                  <p class="text-primary fw-semibold m-0">${{ tracks[index].price.toFixed(2) }}</p>
                  <div v-if="tracks[index].collaborators && tracks[index].collaborators.length > 1" class="collaborator-count text-secondary font-sm mt-xs">
                    <font-awesome-icon :icon="['fas', 'users']" />
                    {{ tracks[index].collaborators.length }} collaborators
                  </div>
                </div>
                <button 
                  @click="editTrack(tracks[index])"
                  class="btn-icon btn-track-action btn-edit"
                >
                  <font-awesome-icon :icon="['fas', 'edit']" />
                </button>
                <button 
                  @click="deleteTrack(tracks[index])"
                  class="btn-icon btn-track-action btn-delete"
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
                  class="btn-icon photo-action-btn"
                  title="Edit photo"
                >
                  <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" />
                </button>
                <button 
                  v-if="!photo.isPrimary"
                  @click="setPrimaryPhoto(photo)"
                  class="btn-icon photo-action-btn"
                  title="Set as primary"
                >
                  <font-awesome-icon :icon="['fas', 'star']" />
                </button>
                <button 
                  @click="deletePhoto(photo)"
                  class="btn-icon photo-action-btn btn-danger"
                  title="Delete photo"
                >
                  <font-awesome-icon :icon="['fas', 'trash']" />
                </button>
              </div>
              <div v-if="photo.isPrimary" class="primary-badge badge badge-primary">
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
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="mt-sm">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p class="text-muted text-center mt-sm">Uploading photo... {{ uploadProgress }}%</p>
          </div>
        </div>

        <!-- Medley Colors Section (NEW) -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">
              <font-awesome-icon :icon="['fas', 'palette']" class="section-icon" />
              Medley Colors
            </h2>
            <button 
              @click="openColorModal" 
              class="btn btn-primary"
            >
              {{ hasColorPalette ? 'Edit Colors' : 'Customize Colors' }}
            </button>
          </div>
          
          <!-- Current Color Preview -->
          <div class="current-colors-preview">
            <div class="gradient-preview-container">
              <div 
                class="gradient-preview"
                :style="{ background: currentGradientStyle }"
              >
                <div class="gradient-overlay">
                  <h3 :style="{ color: colorToString(selectedTextColors.primary) }">
                    {{ artist.name }}'s Medley
                  </h3>
                  <p :style="{ color: colorToString(selectedTextColors.secondary) }">
                    Preview of your custom colors
                  </p>
                </div>
              </div>
            </div>
            
            <div class="color-info">
              <div class="color-status">
                <span v-if="isUsingDefaultColors" class="badge badge-secondary">Default Colors</span>
                <span v-else class="badge badge-success">Custom Colors</span>
              </div>
              
              <div class="color-details">
                <div class="color-detail">
                  <span class="color-label">Gradient Start:</span>
                  <div class="color-swatch" :style="{ backgroundColor: colorToString(selectedGradient.start) }"></div>
                  <span class="color-value">{{ rgbToHex(selectedGradient.start) }}</span>
                </div>
                <div class="color-detail">
                  <span class="color-label">Gradient End:</span>
                  <div class="color-swatch" :style="{ backgroundColor: colorToString(selectedGradient.end) }"></div>
                  <span class="color-value">{{ rgbToHex(selectedGradient.end) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Shows Section -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">
              <font-awesome-icon :icon="['fas', 'calendar-days']" class="section-icon" />
              Live Shows
            </h2>
            <button @click="addShow" class="btn btn-primary">
              <font-awesome-icon :icon="['fas', 'plus']" />
              Add Show
            </button>
          </div>

          <!-- Upcoming Shows -->
          <div v-if="upcomingShows.length > 0" class="shows-subsection mb-xl">
            <h3 class="subsection-title mb-lg">
              <font-awesome-icon :icon="['fas', 'clock']" />
              Upcoming
            </h3>
            <div class="shows-grid">
              <div
                v-for="show in upcomingShows"
                :key="show.id"
                class="show-card card"
              >
                <div class="show-image">
                  <img
                    v-if="show.flyerUrl"
                    :src="show.flyerUrl"
                    :alt="show.title"
                    class="show-flyer"
                  />
                  <div v-else class="show-flyer-placeholder flex flex-center">
                    <font-awesome-icon :icon="['fas', 'calendar-days']" />
                  </div>
                  <div class="show-date-badge">
                    <span class="show-month">{{ formatShowMonth(show.eventDate) }}</span>
                    <span class="show-day">{{ formatShowDay(show.eventDate) }}</span>
                  </div>
                </div>

                <div class="show-details p-md">
                  <h4 class="show-title m-0 mb-xs">{{ show.title }}</h4>
                  <p class="show-venue text-secondary m-0 mb-xs">
                    <font-awesome-icon :icon="['fas', 'location-dot']" />
                    {{ show.venue }}
                  </p>
                  <p class="show-location text-muted m-0 mb-sm font-sm">
                    {{ show.location }}
                  </p>
                  <p class="show-time text-primary font-sm m-0">
                    <font-awesome-icon :icon="['fas', 'clock']" />
                    {{ formatShowTime(show.eventDate) }}
                  </p>
                  <a
                    v-if="show.ticketUrl"
                    :href="show.ticketUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ticket-link font-sm mt-sm"
                    @click.stop
                  >
                    <font-awesome-icon :icon="['fas', 'ticket']" />
                    Get Tickets
                  </a>
                </div>

                <div class="show-actions">
                  <button
                    @click="editShow(show)"
                    class="btn-icon show-action-btn"
                    title="Edit show"
                  >
                    <font-awesome-icon :icon="['fas', 'edit']" />
                  </button>
                  <button
                    @click="deleteShow(show)"
                    class="btn-icon show-action-btn btn-danger"
                    title="Delete show"
                  >
                    <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Past Shows (Collapsible) -->
          <div v-if="pastShows.length > 0" class="shows-subsection">
            <details class="past-shows-accordion">
              <summary class="subsection-title">
                <font-awesome-icon :icon="['fas', 'history']" />
                Past Shows ({{ pastShows.length }})
              </summary>
              <div class="shows-grid shows-grid-compact mt-lg">
                <div
                  v-for="show in pastShows"
                  :key="show.id"
                  class="show-card show-card-past card"
                >
                  <div class="show-details-compact p-md flex flex-between">
                    <div>
                      <h4 class="show-title m-0 mb-xs">{{ show.title }}</h4>
                      <p class="text-muted font-sm m-0">
                        {{ formatShowFullDate(show.eventDate) }} · {{ show.venue }}
                      </p>
                    </div>
                    <button
                      @click="deleteShow(show)"
                      class="btn-icon show-action-btn btn-danger"
                      title="Delete show"
                    >
                      <font-awesome-icon :icon="['fas', 'trash']" />
                    </button>
                  </div>
                </div>
              </div>
            </details>
          </div>

          <!-- Empty State -->
          <div v-if="shows.length === 0" class="empty-state text-center p-xl">
            <font-awesome-icon :icon="['fas', 'calendar-plus']" class="empty-icon text-muted mb-md" />
            <p class="text-secondary m-0">No live shows scheduled yet.</p>
            <p class="text-muted font-sm">Add your upcoming shows to let fans know where to see you live!</p>
          </div>
        </div>

        <!-- Public Link Section -->
        <div v-if="artist.customSlug && artist.hasPublicMedley" class="card">
          <h2 class="flex gap-sm m-0 mb-lg">
            <font-awesome-icon :icon="['fas', 'share']" />
            Share Your Medley
          </h2>
          <div class="link-display flex gap-md">
            <code class="link-code">{{ publicUrl }}</code>
            <button @click="copyLink" class="btn btn-secondary">
              <font-awesome-icon :icon="['fas', 'copy']" />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Add a notice when medley is hidden -->
        <div v-else-if="artist.customSlug && !artist.hasPublicMedley" class="card">
          <h2 class="flex gap-sm m-0 mb-lg">
            <font-awesome-icon :icon="['fas', 'eye-slash']" />
            Medley is Hidden
          </h2>
          <p class="text-secondary m-0">
            Your medley is currently hidden from the public. Toggle the switch above to make it discoverable.
          </p>
        </div>

        <!-- Getting Started Tips -->
        <div v-if="!artist.hasPublicMedley" class="tips-card card">
          <h3 class="flex gap-sm m-0 mb-lg">
            <font-awesome-icon :icon="['fas', 'lightbulb']" />
            Getting Started
          </h3>
          <ol class="tips-list">
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
                <div class="section-header-inline flex flex-between mb-lg">
                  <h4 class="m-0 flex gap-sm">
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
                        <div class="input-group flex">
                          <input
                            :value="collab.percentage"
                            @input="updateCollaboratorSplit(index, $event.target.value)"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            class="form-input"
                            placeholder="0"
                            style="border-right: none; border-radius: var(--radius-md) 0 0 var(--radius-md);"
                          />
                          <span class="input-addon">%</span>
                        </div>
                      </div>
                      
                      <button
                        v-if="!collab.isPrimary"
                        type="button"
                        @click="removeCollaborator(index)"
                        class="btn-icon btn-collab-delete"
                        title="Remove collaborator"
                      >
                        <font-awesome-icon :icon="['fas', 'trash']" />
                      </button>
                    </div>
                    
                    <p v-if="collab.isPrimary" class="form-hint text-primary flex gap-xs mt-xs">
                      <font-awesome-icon :icon="['fas', 'crown']" />
                      Primary Artist
                    </p>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  @click="addCollaborator" 
                  class="btn btn-secondary btn-sm" 
                  style="width: 100%;"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                  Add Collaborator
                </button>
                
                <!-- Split Total -->
                <div class="split-total text-center p-md mt-lg" :class="{ 'invalid': !isSplitValid }">
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
                <div v-if="coverArtUploadProgress > 0 && coverArtUploadProgress < 100" class="mt-sm">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: coverArtUploadProgress + '%' }"></div>
                  </div>
                  <p class="text-muted text-center mt-sm">Processing cover art... {{ Math.round(coverArtUploadProgress) }}%</p>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="modalError" class="form-error">
                {{ modalError }}
              </div>

              <!-- Form Actions -->
              <div class="modal-footer">
                <button type="button" @click="closeModal" class="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="saving || !isSplitValid">
                  <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" class="fa-spin" style="margin-right: 0.5rem;" />
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

      <!-- Color Palette Modal (NEW) -->
      <div v-if="showColorModal" class="modal-overlay" @click="closeColorModal">
        <div class="modal color-modal" @click.stop>
          <div class="modal-header">
            <h3>Customize Medley Colors</h3>
            <button @click="closeColorModal" class="close-btn">×</button>
          </div>
          
          <div class="modal-content">
            <!-- Image Selection for Color Extraction -->
            <div v-if="!extractingColors && (!colorPalette || colorPalette.length === 0)" class="extract-section text-center mb-xl">
              <h4 class="text-primary mb-md">Extract Colors From:</h4>
              
              <!-- Artist Photos -->
              <div v-if="photos.length > 0" class="extract-options mb-lg">
                <p class="text-secondary mb-md">Artist Photos</p>
                <div class="image-grid">
                  <div 
                    v-for="photo in photos.slice(0, 4)" 
                    :key="photo.id"
                    class="extractable-image"
                    @click="extractColorsFromImage(photo.originalUrl)"
                  >
                    <img :src="photo.thumbnailUrl" :alt="'Artist photo'" />
                    <div class="overlay">
                      <font-awesome-icon :icon="['fas', 'palette']" />
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Track Artwork -->
              <div v-if="tracks.length > 0" class="extract-options">
                <p class="text-secondary mb-md">Track Artwork</p>
                <div class="image-grid">
                  <div 
                    v-for="track in tracks" 
                    :key="track.id"
                    class="extractable-image"
                    @click="extractColorsFromImage(track.artworkUrl)"
                  >
                    <img :src="track.artworkUrl" :alt="track.title" />
                    <div class="overlay">
                      <font-awesome-icon :icon="['fas', 'palette']" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="photos.length === 0 && tracks.length === 0" class="no-images">
                <p class="text-muted">Upload photos or tracks to extract colors from their images.</p>
              </div>
            </div>

            <!-- Extracting State -->
            <div v-if="extractingColors" class="extracting-state text-center mb-xl">
              <div class="loading-spinner mb-md"></div>
              <p class="text-secondary">Extracting colors from image...</p>
            </div>

            <!-- Color Palette Display -->
            <div v-if="colorPalette && colorPalette.length > 0" class="palette-section">
              <h4 class="text-primary mb-md">Extracted Color Palette</h4>
              <div class="color-palette-grid mb-xl">
                <div 
                  v-for="(color, index) in colorPalette" 
                  :key="index"
                  class="palette-color"
                  :style="{ backgroundColor: colorToString(color) }"
                  @click="selectGradientColor(color, index % 2 === 0 ? 'start' : 'end')"
                  :title="`Click to use as ${index % 2 === 0 ? 'start' : 'end'} color`"
                >
                  <span class="color-hex">{{ rgbToHex(color) }}</span>
                </div>
              </div>

              <!-- Gradient Selection -->
              <div class="gradient-selection mb-xl">
                <h4 class="text-primary mb-md">Selected Gradient</h4>
                <div class="gradient-controls">
                  <div class="gradient-color-selection">
                    <div class="color-selection-group">
                      <label class="color-label">Start Color</label>
                      <div 
                        class="selected-color" 
                        :style="{ backgroundColor: colorToString(selectedGradient.start) }"
                      >
                        <span class="color-hex">{{ rgbToHex(selectedGradient.start) }}</span>
                      </div>
                      <div class="palette-mini">
                        <div 
                          v-for="(color, index) in colorPalette" 
                          :key="`start-${index}`"
                          class="mini-color"
                          :style="{ backgroundColor: colorToString(color) }"
                          @click="selectGradientColor(color, 'start')"
                          :class="{ active: color.r === selectedGradient.start.r && color.g === selectedGradient.start.g && color.b === selectedGradient.start.b }"
                        ></div>
                      </div>
                    </div>

                    <div class="gradient-arrow">→</div>

                    <div class="color-selection-group">
                      <label class="color-label">End Color</label>
                      <div 
                        class="selected-color" 
                        :style="{ backgroundColor: colorToString(selectedGradient.end) }"
                      >
                        <span class="color-hex">{{ rgbToHex(selectedGradient.end) }}</span>
                      </div>
                      <div class="palette-mini">
                        <div 
                          v-for="(color, index) in colorPalette" 
                          :key="`end-${index}`"
                          class="mini-color"
                          :style="{ backgroundColor: colorToString(color) }"
                          @click="selectGradientColor(color, 'end')"
                          :class="{ active: color.r === selectedGradient.end.r && color.g === selectedGradient.end.g && color.b === selectedGradient.end.b }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- Live Preview -->
                  <div class="gradient-preview-large">
                    <div 
                      class="preview-background"
                      :style="{ background: currentGradientStyle }"
                    >
                      <div class="preview-content">
                        <h3 :style="{ color: colorToString(selectedTextColors.primary) }">
                          {{ artist.name }}
                        </h3>
                        <p :style="{ color: colorToString(selectedTextColors.secondary) }">
                          Now Playing: Track Title
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Text Color Control -->
              <div class="text-color-control mb-xl">
                <h4 class="text-primary mb-md">Text Color</h4>
                <div class="text-color-options">
                  <div class="text-color-toggle">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        :checked="isManualTextColor"
                        @change="toggleManualTextColor"
                        class="toggle-input"
                      />
                      <span class="toggle-switch-color"></span>
                      <span class="toggle-text">Manual Text Color Control</span>
                    </label>
                    <p class="text-secondary text-sm mt-xs">
                      {{ isManualTextColor ? 'Choose text color manually' : 'Text color selected automatically based on gradient' }}
                    </p>
                  </div>
                  
                  <div v-if="isManualTextColor" class="manual-color-selector">
                    <div class="color-option-group">
                      <button 
                        @click="setManualTextColorMode('light')"
                        class="color-option"
                        :class="{ active: manualTextColorMode === 'light' }"
                      >
                        <div class="color-preview light-preview">
                          <span class="preview-text">Aa</span>
                        </div>
                        <span class="option-label">Light Text</span>
                      </button>
                      
                      <button 
                        @click="setManualTextColorMode('dark')"
                        class="color-option"
                        :class="{ active: manualTextColorMode === 'dark' }"
                      >
                        <div class="color-preview dark-preview">
                          <span class="preview-text">Aa</span>
                        </div>
                        <span class="option-label">Dark Text</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="quick-actions mb-xl">
                <button @click="autoSelectGradientColors" class="btn btn-secondary">
                  <font-awesome-icon :icon="['fas', 'arrows-rotate']" />
                  Auto-Select Best Colors
                </button>
                <button @click="resetToDefaultColors" class="btn btn-secondary">
                  <font-awesome-icon :icon="['fas', 'arrows-rotate']" />
                  Reset to Default
                </button>
              </div>
            </div>

            <!-- Modal Actions -->
            <div class="flex gap-md modal-footer">
              <button @click="closeColorModal" class="btn btn-secondary">
                Cancel
              </button>
              <button 
                @click="saveColorPalette" 
                :disabled="savingColors || (!colorPalette && isUsingDefaultColors)"
                class="btn btn-primary"
              >
                {{ savingColors ? 'Saving...' : 'Save Colors' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Show Modal -->
      <div v-if="showShowModal" class="modal-overlay" @click="closeShowModal">
        <div class="modal modal-lg" @click.stop>
          <div class="modal-header">
            <h3>
              <font-awesome-icon :icon="editingShow ? ['fas', 'edit'] : ['fas', 'plus']" />
              {{ editingShow ? 'Edit Show' : 'Add Show' }}
            </h3>
            <button @click="closeShowModal" class="close-btn">×</button>
          </div>

          <div class="modal-content">
            <form @submit.prevent="saveShow">
              <!-- Event Title -->
              <div class="form-group">
                <label class="form-label">Event Title *</label>
                <input
                  v-model="showForm.title"
                  type="text"
                  class="form-input"
                  placeholder="Album Release Party, Summer Tour Stop, etc."
                  required
                />
              </div>

              <!-- Description -->
              <div class="form-group">
                <label class="form-label">Description (Optional)</label>
                <textarea
                  v-model="showForm.description"
                  class="form-textarea"
                  rows="3"
                  placeholder="Tell fans what to expect at this show..."
                ></textarea>
              </div>

              <!-- Date and Time -->
              <div class="grid grid-2 gap-md">
                <div class="form-group">
                  <label class="form-label">Date *</label>
                  <input
                    v-model="showForm.eventDate"
                    type="date"
                    class="form-input"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Time *</label>
                  <input
                    v-model="showForm.eventTime"
                    type="time"
                    class="form-input"
                    required
                  />
                </div>
              </div>

              <!-- Venue -->
              <div class="form-group">
                <label class="form-label">Venue *</label>
                <input
                  v-model="showForm.venue"
                  type="text"
                  class="form-input"
                  placeholder="The Blue Note"
                  required
                />
              </div>

              <!-- Location -->
              <div class="form-group">
                <label class="form-label">Location *</label>
                <input
                  v-model="showForm.location"
                  type="text"
                  class="form-input"
                  placeholder="Brooklyn, NY"
                  required
                />
                <p class="form-hint">City, State or City, Country</p>
              </div>

              <!-- Ticket URL -->
              <div class="form-group">
                <label class="form-label">Ticket URL (Optional)</label>
                <input
                  v-model="showForm.ticketUrl"
                  type="url"
                  class="form-input"
                  placeholder="https://eventbrite.com/..."
                />
                <p class="form-hint">Link where fans can purchase tickets</p>
              </div>

              <!-- Flyer Image -->
              <div class="form-group">
                <label class="form-label">
                  Flyer Image {{ editingShow ? '(Leave empty to keep current)' : '(Optional)' }}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFlyerFileSelect"
                  class="form-input"
                  ref="flyerFileInput"
                />
                <p class="form-hint">Maximum file size: 10MB</p>
              </div>

              <!-- Error Message -->
              <div v-if="showModalError" class="form-error">
                {{ showModalError }}
              </div>

              <!-- Form Actions -->
              <div class="modal-footer">
                <button type="button" @click="closeShowModal" class="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="savingShow">
                  <font-awesome-icon v-if="savingShow" :icon="['fas', 'spinner']" class="fa-spin" />
                  {{ savingShow ? 'Saving...' : (editingShow ? 'Save Changes' : 'Add Show') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles only - leveraging utility classes above */
.artist-studio {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* Artist-specific elements */
.artist-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  object-fit: cover;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.artist-avatar-placeholder {
  background: var(--bg-tertiary);
  font-size: 2rem;
  color: var(--text-muted);
}

.viewing-notice {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* Stats */
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
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
  flex-shrink: 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  margin-top: var(--spacing-xs);
}

/* Track Slots */
.track-slot {
  min-height: 300px;
  position: relative;
  overflow: hidden;
  padding: 0;
}

.track-slot.empty {
  background: transparent;
  border: 3px dashed var(--border-primary);
}

.empty-slot-btn {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  color: var(--text-secondary);
  font-size: 3rem;
}

.empty-slot-btn:hover {
  color: var(--color-primary);
  background: var(--bg-hover);
}

.track-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.track-artwork {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.artwork-placeholder {
  background: var(--bg-tertiary);
  font-size: 3rem;
  color: var(--text-muted);
}

.track-details {
  flex: 1;
}

.collaborator-count {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-track-action {
  position: absolute;
  top: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  width: 36px;
  height: 36px;
}

.btn-edit {
  right: calc(var(--spacing-sm) + 44px);
}

.btn-delete {
  right: var(--spacing-sm);
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

.photo-action-btn {
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
}

.photo-action-btn:hover {
  background: var(--color-primary);
}

.photo-action-btn.btn-danger:hover {
  background: var(--color-danger);
}

.primary-badge {
  position: absolute;
  bottom: var(--spacing-sm);
  left: var(--spacing-sm);
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
  font-size: 2rem;
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

/* Photo Viewer */
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

/* Link Display */
.link-code {
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
}

.tips-list {
  margin: 0 0 var(--spacing-lg) var(--spacing-lg);
  padding: 0;
}

.tips-list li {
  margin-bottom: var(--spacing-sm);
  color: white;
}

/* Modal Overrides */
.modal-lg {
  max-width: 600px;
}

/* Form Extensions */
.form-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
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

.input-addon {
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 2px solid var(--border-primary);
  border-left: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: var(--text-secondary);
  font-weight: 600;
}

.btn-collab-delete {
  width: 36px;
  height: 36px;
  background: var(--color-danger);
  color: white;
}

.btn-collab-delete:hover {
  background: var(--color-danger-hover);
  transform: scale(1.1);
}

.split-total {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background: var(--bg-card);
  border-radius: var(--radius-md);
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

/* Color Section Styles (NEW) */
.current-colors-preview {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--spacing-xl);
  align-items: center;
}

.gradient-preview-container {
  position: relative;
}

.gradient-preview {
  width: 100%;
  height: 200px;
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-md);
  background: rgba(0, 0, 0, 0.1);
}

.gradient-overlay h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.gradient-overlay p {
  font-size: 1rem;
  margin-bottom: var(--spacing-md);
}

.color-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.color-status {
  text-align: center;
}

.color-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.color-detail {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.color-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  flex: 1;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-primary);
  flex-shrink: 0;
}

.color-value {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 600;
}

/* Color Modal Styles (NEW) */
.color-modal {
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
}

.extract-section {
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.extract-options {
  margin-bottom: var(--spacing-lg);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--spacing-md);
  max-width: 500px;
  margin: 0 auto;
}

.extractable-image {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 3px solid transparent;
}

.extractable-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.extractable-image .overlay {
  position: absolute;
  inset: 0;
  background: rgba(102, 126, 234, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-normal);
  color: white;
  font-size: 2rem;
}

.extractable-image:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.extractable-image:hover .overlay {
  opacity: 1;
}

.no-images {
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.extracting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
}

.color-palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--spacing-md);
}

.palette-color {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  border: 3px solid transparent;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.palette-color:hover {
  transform: scale(1.05);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.color-hex {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.palette-color:hover .color-hex {
  opacity: 1;
}

.gradient-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.gradient-color-selection {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-xl);
  align-items: center;
}

.color-selection-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.color-selection-group .color-label {
  font-weight: 600;
  color: var(--text-primary);
  flex: none;
}

.selected-color {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  border: 3px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: var(--shadow-md);
}

.selected-color .color-hex {
  opacity: 1;
}

.palette-mini {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  justify-content: center;
  max-width: 200px;
}

.mini-color {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all var(--transition-normal);
}

.mini-color:hover,
.mini-color.active {
  border-color: var(--color-primary);
  transform: scale(1.1);
}

.gradient-arrow {
  font-size: 2rem;
  color: var(--color-primary);
  font-weight: bold;
}

.gradient-preview-large {
  width: 100%;
  height: 250px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.preview-background {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-lg);
}

.preview-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.preview-content p {
  font-size: 1.2rem;
  margin-bottom: var(--spacing-lg);
}

/* Text Color Control Styles (NEW) */
.text-color-control {
  background: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
}

.text-color-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch-color {
  position: relative;
  width: 48px;
  height: 24px;
  background-color: var(--bg-tertiary);
  border-radius: 24px;
  transition: background-color var(--transition-normal);
  flex-shrink: 0;
}

.toggle-switch-color::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform var(--transition-normal);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-switch-color {
  background-color: var(--color-primary);
}

.toggle-input:checked + .toggle-switch-color::after {
  transform: translateX(24px);
}

.toggle-text {
  font-weight: 600;
  color: var(--text-primary);
}

.text-sm {
  font-size: 0.85rem;
}

.mt-xs {
  margin-top: var(--spacing-xs);
}

.manual-color-selector {
  margin-top: var(--spacing-md);
}

.color-option-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.color-option {
  background: var(--bg-card);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.color-option:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.color-option.active {
  border-color: var(--color-primary);
  background: var(--bg-hover);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.color-preview {
  width: 80px;
  height: 60px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  position: relative;
  overflow: hidden;
}

.light-preview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dark-preview {
  background: linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%);
  color: #1a1a1a;
}

.preview-text {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.option-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.quick-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

/* Component-specific utilities */
.empty-icon {
  font-size: 5rem;
  opacity: 0.8;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
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
  .stats-responsive {
    grid-template-columns: 1fr;
  }
  
  .track-slots-responsive {
    grid-template-columns: 1fr;
  }
  
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .link-display {
    flex-direction: column;
  }
  
  .link-code {
    word-break: break-all;
  }
  
  .collab-fields {
    grid-template-columns: 1fr;
  }
  
  .percentage-input {
    max-width: 100%;
  }
  
  /* Color-specific responsive styles (NEW) */
  .current-colors-preview {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .gradient-preview {
    height: 150px;
  }
  
  .color-palette-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .gradient-color-selection {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .gradient-arrow {
    transform: rotate(90deg);
  }
  
  .color-modal {
    width: 100vw;
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }
}

@media (max-width: 480px) {
  .artist-avatar {
    width: 60px;
    height: 60px;
  }
  
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-md);
  }
  
  /* Color-specific mobile styles (NEW) */
  .color-palette-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .image-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .color-option-group {
    grid-template-columns: 1fr;
  }

  .color-preview {
    width: 100px;
    height: 50px;
  }
}

/* Live Shows Section Styles */
.shows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.shows-grid-compact {
  grid-template-columns: 1fr;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.show-card {
  position: relative;
  overflow: hidden;
  padding: 0;
  transition: all var(--transition-normal);
}

.show-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.show-card-past {
  background: var(--bg-secondary);
  opacity: 0.8;
}

.show-image {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--bg-tertiary);
}

.show-flyer {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.show-flyer-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 3rem;
}

.show-date-badge {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  text-align: center;
  line-height: 1.2;
  box-shadow: var(--shadow-md);
}

.show-month {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.show-day {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.show-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.show-venue {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.show-location {
  color: var(--text-muted);
}

.show-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.ticket-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.ticket-link:hover {
  text-decoration: underline;
}

.show-actions {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.show-card:hover .show-actions {
  opacity: 1;
}

.show-action-btn {
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
}

.show-action-btn:hover {
  background: var(--color-primary);
}

.show-action-btn.btn-danger:hover {
  background: var(--color-danger);
}

.show-details-compact {
  align-items: center;
}

.past-shows-accordion {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.past-shows-accordion summary {
  cursor: pointer;
  user-select: none;
  list-style: none;
}

.past-shows-accordion summary::-webkit-details-marker {
  display: none;
}

.past-shows-accordion summary::before {
  content: '▶';
  display: inline-block;
  margin-right: var(--spacing-sm);
  transition: transform var(--transition-normal);
  font-size: 0.75rem;
}

.past-shows-accordion[open] summary::before {
  transform: rotate(90deg);
}

/* Responsive Shows */
@media (max-width: 768px) {
  .shows-grid {
    grid-template-columns: 1fr;
  }

  .show-image {
    aspect-ratio: 2 / 1;
  }
}

@media (max-width: 480px) {
  .show-date-badge {
    padding: var(--spacing-xs);
  }

  .show-day {
    font-size: 1.25rem;
  }
}
</style>