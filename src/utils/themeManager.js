// src/utils/themeManager.js
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
}

class ThemeManager {
  constructor() {
    this.currentTheme = this.loadTheme()
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.applyTheme()
    
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === THEMES.AUTO) {
        this.applyTheme()
      }
    })
  }

  loadTheme() {
    const saved = localStorage.getItem('4track-theme')
    return saved || THEMES.AUTO
  }

  setTheme(theme) {
    this.currentTheme = theme
    localStorage.setItem('4track-theme', theme)
    this.applyTheme()
  }

  getTheme() {
    return this.currentTheme
  }

  applyTheme() {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark')
    
    // Determine actual theme to apply
    let actualTheme = this.currentTheme
    if (this.currentTheme === THEMES.AUTO) {
      actualTheme = this.mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT
    }
    
    // Apply theme class
    root.classList.add(`theme-${actualTheme}`)
  }

  getEffectiveTheme() {
    if (this.currentTheme === THEMES.AUTO) {
      return this.mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT
    }
    return this.currentTheme
  }
}

// Export singleton instance
export const themeManager = new ThemeManager()