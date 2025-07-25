<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="photo-lab" @click.stop>
      <!-- Header -->
      <div class="lab-header">
        <h2 class="section-title">
          <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" class="section-icon" />
          Photo Lab
        </h2>
        <button @click="$emit('close')" class="close-btn">
          <font-awesome-icon :icon="['fas', 'times']" />
        </button>
      </div>
      
      <!-- Original Photo -->
      <div class="lab-content">
        <div v-if="!processed" class="original-section">
          <h3 class="text-center mb-md">Original Photo</h3>
          <div class="photo-container">
            <img 
              ref="originalImage"
              :src="photo.originalUrl" 
              alt="Original photo"
              class="lab-photo"
              crossorigin="anonymous"
              @load="onImageLoad"
            />
          </div>
          <button 
            @click="processPhoto" 
            class="btn btn-primary btn-lg mt-lg"
            :disabled="processing || !imageLoaded"
          >
            <font-awesome-icon 
              v-if="processing" 
              :icon="['fas', 'spinner']" 
              class="fa-spin mr-sm" 
            />
            {{ processing ? 'Processing...' : 'Process Photo' }}
          </button>
        </div>
        
        <!-- Processed Versions -->
        <div v-else class="processed-section">
          <div class="section-header mb-lg">
            <h3>Choose a Style</h3>
            <button @click="resetLab" class="btn btn-secondary">
              <font-awesome-icon :icon="['fas', 'undo']" />
              Start Over
            </button>
          </div>
          
          <div class="filters-grid">
            <div 
              v-for="(filter, index) in processedImages" 
              :key="index"
              class="filter-item"
              :class="{ selected: selectedFilter === index }"
              @click="selectFilter(index)"
            >
              <img 
                :src="filter.dataUrl" 
                :alt="filter.name"
                class="filter-preview"
              />
              <p class="filter-name">{{ filter.name }}</p>
            </div>
          </div>
          
          <div v-if="selectedFilter !== null" class="actions mt-xl">
            <button @click="$emit('close')" class="btn btn-secondary">
              Cancel
            </button>
            <button 
              @click="saveProcessed" 
              class="btn btn-primary"
              :disabled="saving"
            >
              <font-awesome-icon 
                v-if="saving" 
                :icon="['fas', 'spinner']" 
                class="fa-spin mr-sm" 
              />
              {{ saving ? 'Saving...' : 'Add to Photos' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  photo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

// State
const originalImage = ref(null)
const processing = ref(false)
const processed = ref(false)
const processedImages = ref([])
const selectedFilter = ref(null)
const saving = ref(false)
const imageLoaded = ref(false)

// Selected filters - using working filters
const filters = [
  { name: 'Vintage', method: 'vintage' },
  { name: 'Perfume', method: 'perfume' },
  { name: 'Serenity', method: 'serenity' },
  { name: 'Pink Aura', method: 'pink_aura' },
  { name: 'Ocean', method: 'ocean' },
  { name: 'Mellow', method: 'mellow' },
  { name: 'Coral', method: 'coral' },
  { name: 'Crimson', method: 'crimson' },
  { name: 'Greyscale', method: 'greyscale' },
  { name: 'Phase', method: 'phase' }
]

const onImageLoad = () => {
  imageLoaded.value = true
}

const processPhoto = async () => {
  processing.value = true
  processedImages.value = []
  
  try {
    // Check which global is available
    const pixelsLib = window.Pixels || window.pixelsJS || window.pixels
    
    if (!pixelsLib) {
      console.error('Pixels.js not found')
      alert('Image processing library not loaded. Please refresh the page and try again.')
      processing.value = false
      return
    }
    
    console.log('Found Pixels.js library:', pixelsLib)
    
    const img = originalImage.value
    
    // Create a master canvas to draw the original image
    const masterCanvas = document.createElement('canvas')
    const masterCtx = masterCanvas.getContext('2d')
    
    // Set canvas size (smaller for preview)
    const maxSize = 400
    let width = img.naturalWidth
    let height = img.naturalHeight
    
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height)
      width = Math.floor(width * ratio)
      height = Math.floor(height * ratio)
    }
    
    masterCanvas.width = width
    masterCanvas.height = height
    
    // Draw the image once
    masterCtx.drawImage(img, 0, 0, width, height)
    
    // Get the original image data
    const originalImageData = masterCtx.getImageData(0, 0, width, height)
    
    // Process each filter
    for (const filterConfig of filters) {
      try {
        // Create a new canvas for this filter
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = width
        canvas.height = height
        
        // Create a copy of the original image data
        const imageDataCopy = ctx.createImageData(width, height)
        imageDataCopy.data.set(originalImageData.data)
        
        // Apply the filter to the image data
        let filteredData
        try {
          if (pixelsLib.filterImgData) {
            filteredData = pixelsLib.filterImgData(imageDataCopy, filterConfig.method)
          } else {
            console.warn(`filterImgData not available, skipping ${filterConfig.name}`)
            continue
          }
        } catch (filterError) {
          console.warn(`Filter ${filterConfig.name} failed:`, filterError)
          continue
        }
        
        // Put the filtered data onto the canvas
        if (filteredData) {
          ctx.putImageData(filteredData, 0, 0)
        } else {
          ctx.putImageData(imageDataCopy, 0, 0)
        }
        
        // Get the data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        
        processedImages.value.push({
          name: filterConfig.name,
          filter: filterConfig.method,
          dataUrl
        })
      } catch (filterError) {
        console.error(`Error applying ${filterConfig.name} filter:`, filterError)
      }
    }
    
    if (processedImages.value.length === 0) {
      throw new Error('No filters could be applied')
    }
    
    processed.value = true
    
  } catch (err) {
    console.error('Error processing photo:', err)
    alert('Failed to process photo. Please try again.')
  } finally {
    processing.value = false
  }
}

const selectFilter = (index) => {
  selectedFilter.value = index
}

const resetLab = () => {
  processed.value = false
  processedImages.value = []
  selectedFilter.value = null
}

const saveProcessed = async () => {
  if (selectedFilter.value === null) return
  
  saving.value = true
  
  try {
    const selectedImage = processedImages.value[selectedFilter.value]
    emit('save', selectedImage.dataUrl)
  } catch (err) {
    console.error('Error saving processed photo:', err)
    alert('Failed to save photo')
  } finally {
    saving.value = false
  }
}

// Check on mount if pixelsJS is available
onMounted(() => {
  const checkPixels = () => {
    const pixelsLib = window.Pixels || window.pixelsJS || window.pixels
    if (pixelsLib) {
      console.log('✅ Pixels.js loaded successfully!', pixelsLib)
      console.log('Available methods:', Object.keys(pixelsLib))
      
      // Test available filters
      if (pixelsLib.getFilterList) {
        try {
          console.log('Available filters:', pixelsLib.getFilterList())
        } catch (e) {
          console.log('Could not get filter list')
        }
      }
    } else {
      console.warn('⚠️ Pixels.js not yet available')
    }
  }
  
  checkPixels()
  setTimeout(checkPixels, 500)
  setTimeout(checkPixels, 1500)
})
</script>

<style scoped>
.photo-lab {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 90vw;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.lab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

.lab-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
}

.original-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-container {
  max-width: 600px;
  width: 100%;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  position: relative;
}

.lab-photo {
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.processed-section {
  width: 100%;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.filter-item {
  cursor: pointer;
  transition: all var(--transition-normal);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 3px solid transparent;
  background: var(--bg-secondary);
}

.filter-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.filter-item.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.filter-preview {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.filter-name {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: center;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

/* Responsive */
@media (max-width: 768px) {
  .photo-lab {
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }
  
  .filters-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }
  
  .lab-content {
    padding: var(--spacing-md);
  }
}
</style>