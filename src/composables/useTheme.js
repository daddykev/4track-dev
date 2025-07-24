import { computed } from 'vue'

export function useTheme() {
  // For the medley page, we're always in dark mode
  const isDarkTheme = computed(() => true)

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