// composables/useTheme.js
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { themeManager } from '@/utils/themeManager'

export function useTheme() {
  const currentTheme = ref(themeManager.getEffectiveTheme())
  
  // Update theme when it changes
  const updateTheme = () => {
    currentTheme.value = themeManager.getEffectiveTheme()
  }
  
  onMounted(() => {
    // Listen for theme changes
    window.addEventListener('theme-changed', updateTheme)
    
    // Also listen for system theme changes if in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateTheme)
  })
  
  onUnmounted(() => {
    window.removeEventListener('theme-changed', updateTheme)
  })
  
  const isDarkTheme = computed(() => currentTheme.value === 'dark')

  const canvasBgColor = computed(() => {
    return isDarkTheme.value ? '#1e1e1e' : '#f5f5f5'
  })

  const canvasGridColor = computed(() => {
    return isDarkTheme.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  })

  const meterColors = computed(() => ({
    peak: {
      top: { threshold: -2, color: isDarkTheme.value ? '#e5402b' : '#e5402b' },
      middle: { threshold: -6, color: isDarkTheme.value ? '#d3d65d' : '#d3d65d' },
      low: { color: isDarkTheme.value ? '#7fbdf8' : '#7fbdf8' }
    },
    rms: {
      top: { threshold: -16, color: isDarkTheme.value ? '#8b2112' : '#a02814' },
      middle: { threshold: -20, color: isDarkTheme.value ? '#999b30' : '#999b30' },
      low: { color: isDarkTheme.value ? '#36538a' : '#36538a' }
    }
  }))

  return {
    isDarkTheme,
    canvasBgColor,
    canvasGridColor,
    meterColors
  }
}