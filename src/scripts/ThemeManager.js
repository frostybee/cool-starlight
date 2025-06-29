export class ThemeManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.currentTheme = this.loadTheme();
    
    // Available themes with their display names
    this.themes = {
      'light': 'Light',
      'dark': 'Dark', 
      'dracula': 'Dracula',
      'github': 'GitHub',
      'discord': 'Discord'
    };
    
    this.bindEvents();
  }

  bindEvents() {
    // Listen for theme selector changes
    document.addEventListener('theme-changed', (e) => {
      this.setTheme(e.detail.theme);
    });
  }

  setTheme(theme) {
    if (!this.themes[theme]) {
      console.warn(`Theme "${theme}" not found. Available themes:`, Object.keys(this.themes));
      return;
    }

    this.currentTheme = theme;
    this.applyTheme();
    this.saveTheme();
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('theme-applied', {
      detail: { theme: this.currentTheme }
    }));
  }

  applyTheme() {
    const modal = this.slideViewer.modal;
    if (!modal) return;

    // Remove all existing theme classes
    Object.keys(this.themes).forEach(theme => {
      modal.classList.remove(`fb-slide__theme-${theme}`);
    });

    // Add the current theme class
    modal.classList.add(`fb-slide__theme-${this.currentTheme}`);
    
    // Also set on document for global theme awareness
    document.documentElement.setAttribute('data-slide-theme', this.currentTheme);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return { ...this.themes };
  }

  cycleTheme() {
    const themeKeys = Object.keys(this.themes);
    const currentIndex = themeKeys.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    const nextTheme = themeKeys[nextIndex];
    this.setTheme(nextTheme);
    return nextTheme;
  }

  loadTheme() {
    try {
      const savedTheme = localStorage.getItem('slideViewer-theme');
      if (savedTheme && this.themes[savedTheme]) {
        return savedTheme;
      }
    } catch (error) {
      console.log('Error loading theme from localStorage:', error);
    }
    return 'dark'; // Default theme
  }

  saveTheme() {
    try {
      localStorage.setItem('slideViewer-theme', this.currentTheme);
    } catch (error) {
      console.log('Error saving theme to localStorage:', error);
    }
  }
}