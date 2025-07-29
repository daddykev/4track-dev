<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  photo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

// State
const processing = ref(false)
const imageLoaded = ref(false)
const imageDimensions = ref({ width: 0, height: 0 })
const containerSize = ref(400) // Size of the crop area
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// Refs
const cropContainer = ref(null)

// Computed
const imageStyle = computed(() => {
  const scale = getScale()
  return {
    transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale})`,
    cursor: isDragging.value ? 'grabbing' : 'grab'
  }
})

// Load image dimensions
onMounted(() => {
  const img = new Image()
  img.onload = () => {
    imageDimensions.value = {
      width: img.width,
      height: img.height
    }
    imageLoaded.value = true
    centerImage()
  }
  img.src = props.photo.originalUrl
  
  // Add event listeners
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', handleDrag)
  document.addEventListener('touchend', endDrag)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', endDrag)
})

// Drag handling
const startDrag = (e) => {
  e.preventDefault()
  isDragging.value = true
  
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  
  dragStart.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
}

const handleDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  
  const scale = getScale()
  const scaledWidth = imageDimensions.value.width * scale
  const scaledHeight = imageDimensions.value.height * scale
  
  // Calculate new position
  let newX = clientX - dragStart.value.x
  let newY = clientY - dragStart.value.y
  
  // Constrain position to ensure crop area is always covered
  const minX = containerSize.value - scaledWidth
  const maxX = 0
  const minY = containerSize.value - scaledHeight
  const maxY = 0
  
  newX = Math.max(minX, Math.min(maxX, newX))
  newY = Math.max(minY, Math.min(maxY, newY))
  
  position.value = { x: newX, y: newY }
}

const endDrag = () => {
  isDragging.value = false
}

// Crop and save
const cropAndSave = async () => {
  if (processing.value) return
  processing.value = true
  
  try {
    // Create canvas for cropping
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false 
    })
    
    // Set output size - ensure it's square
    const outputSize = 1000
    canvas.width = outputSize
    canvas.height = outputSize
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, outputSize, outputSize)
    
    // Load the image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = props.photo.originalUrl
    })
    
    // Calculate the visible area in the crop circle
    const scale = getScale()
    
    // The crop area is always containerSize x containerSize pixels on screen
    // We need to find what part of the original image is visible in this area
    
    // Convert screen position to source image coordinates
    const visibleAreaSize = containerSize.value / scale
    
    // Calculate the top-left position in the source image
    // position.value is negative when image is dragged, so we negate it
    const sourceX = (-position.value.x) / scale
    const sourceY = (-position.value.y) / scale
    
    // Enable high quality scaling
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Draw the cropped and scaled image
    // We're taking a square from the source and drawing it to fill the square canvas
    ctx.drawImage(
      img,
      sourceX,                    // Source X position
      sourceY,                    // Source Y position  
      visibleAreaSize,           // Source width (square)
      visibleAreaSize,           // Source height (square)
      0,                         // Destination X
      0,                         // Destination Y
      outputSize,                // Destination width (1000)
      outputSize                 // Destination height (1000)
    )
    
    // Verify the output is square
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)
    
    // Convert to WebP blob with high quality for profile images
    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/webp',
        0.90  // Slightly higher quality for profile images
      )
    })
    
    // Create file from blob with proper naming
    const timestamp = Date.now()
    const file = new File([blob], `profile_${timestamp}.webp`, {
      type: 'image/webp'
    })
    
    // Log the file details to verify
    console.log('Output file:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    // Verify dimensions by creating a temporary image
    const verifyImg = new Image()
    const objectUrl = URL.createObjectURL(blob)
    
    await new Promise((resolve) => {
      verifyImg.onload = () => {
        console.log('Verified output dimensions:', verifyImg.width, 'x', verifyImg.height)
        URL.revokeObjectURL(objectUrl)
        resolve()
      }
      verifyImg.src = objectUrl
    })
    
    emit('save', file)
  } catch (error) {
    console.error('Error cropping image:', error)
    alert('Failed to crop image. Please try again.')
  } finally {
    processing.value = false
  }
}

// Update getScale to be more explicit about maintaining square crop
const getScale = () => {
  if (!imageLoaded.value) return 1
  
  const { width, height } = imageDimensions.value
  
  // We want to scale the image so that the crop area (which is square)
  // can be fully filled by the image, regardless of the image's aspect ratio
  const minDimension = Math.min(width, height)
  
  // This ensures the square crop area is always covered by the image
  return containerSize.value / minDimension
}

// Update centerImage to ensure proper initial positioning
const centerImage = () => {
  const scale = getScale()
  const scaledWidth = imageDimensions.value.width * scale
  const scaledHeight = imageDimensions.value.height * scale
  
  // Center the scaled image in the square container
  position.value = {
    x: (containerSize.value - scaledWidth) / 2,
    y: (containerSize.value - scaledHeight) / 2
  }
}
</script>

<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="crop-editor" @click.stop>
      <div class="editor-header">
        <h3>Set Primary Photo</h3>
        <button @click="$emit('close')" class="close-btn">
          <font-awesome-icon :icon="['fas', 'times']" />
        </button>
      </div>
      
      <div class="editor-content">
        <div class="crop-container" ref="cropContainer">
          <div class="crop-area">
            <img 
              :src="photo.originalUrl" 
              :alt="'Crop preview'"
              class="crop-image"
              :style="imageStyle"
              @mousedown="startDrag"
              @touchstart="startDrag"
            />
            <div class="crop-overlay"></div>
          </div>
        </div>
        
        <div class="crop-instructions">
          <p>Drag the image to position it within the circle</p>
        </div>
      </div>
      
      <div class="editor-footer">
        <button @click="$emit('close')" class="btn btn-secondary">
          Cancel
        </button>
        <button @click="cropAndSave" class="btn btn-primary" :disabled="processing">
          <font-awesome-icon v-if="processing" :icon="['fas', 'spinner']" class="fa-spin" />
          {{ processing ? 'Processing...' : 'Crop' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crop-editor {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

.editor-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.editor-content {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.crop-container {
  position: relative;
  width: 400px;
  height: 400px;
  max-width: 100%;
  aspect-ratio: 1;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.crop-area {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 50%;
}

.crop-image {
  position: absolute;
  top: 0;
  left: 0;
  user-select: none;
  -webkit-user-drag: none;
  transition: none;
  transform-origin: top left;
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.crop-instructions {
  text-align: center;
}

.crop-instructions p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
}

/* Responsive */
@media (max-width: 480px) {
  .crop-container {
    width: 300px;
    height: 300px;
  }
}

/* Animation */
.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>