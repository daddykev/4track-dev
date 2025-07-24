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
      low: { color: '#4caf50' },
      middle: { color: '#ff9800', threshold: -12 },
      top: { color: '#f44336', threshold: -3 }
    },
    rms: {
      low: { color: '#2196f3' },
      middle: { color: '#00bcd4', threshold: -20 },
      top: { color: '#4caf50', threshold: -12 }
    }
  }))

  return {
    isDarkTheme,
    canvasBgColor,
    canvasGridColor,
    meterColors
  }
}