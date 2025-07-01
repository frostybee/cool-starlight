/**
 * ThemeToggleManager - Manages independent light/dark theme toggle for slide viewer
 * Independent from Starlight's theme system
 */
export class ThemeToggleManager {
  constructor() {
    this.toggleBtn = null;
    this.lightIcon = null;
    this.darkIcon = null;
    
    // Mobile elements
    this.toggleBtnMobile = null;
    this.lightIconMobile = null;
    this.darkIconMobile = null;
    this.mobileText = null;
    
    this.currentTheme = 'light'; // default
    this.storageKey = 'slide-viewer-theme';
    
    this.init();
  }

  init() {
    // Get DOM elements - Desktop
    this.toggleBtn = document.getElementById('slide-independent-theme-toggle');
    this.lightIcon = document.getElementById('theme-icon-light');
    this.darkIcon = document.getElementById('theme-icon-dark');

    // Get DOM elements - Mobile
    this.toggleBtnMobile = document.getElementById('slide-independent-theme-toggle-mobile');
    this.lightIconMobile = document.getElementById('theme-icon-light-mobile');
    this.darkIconMobile = document.getElementById('theme-icon-dark-mobile');
    this.mobileText = document.getElementById('mobile-independent-theme-text');

    if (!this.toggleBtn && !this.toggleBtnMobile) {
      console.warn('Theme toggle buttons not found');
      return;
    }

    // Load saved theme or default to light
    this.loadSavedTheme();
    
    // Set up event listeners
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    if (this.toggleBtnMobile) {
      this.toggleBtnMobile.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Apply initial theme
    this.applyTheme();
  }

  /**
   * Load theme preference from localStorage
   */
  loadSavedTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.currentTheme = savedTheme;
    }
  }

  /**
   * Save theme preference to localStorage
   */
  saveTheme() {
    localStorage.setItem(this.storageKey, this.currentTheme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    this.saveTheme();
  }

  /**
   * Apply the current theme to the slide viewer
   */
  applyTheme() {
    const slideContainer = document.querySelector('.fb-slide__container');
    const modal = document.getElementById('slide-viewer-modal');
    
    if (!slideContainer && !modal) {
      // No containers found yet, theme will be applied when slide viewer opens
      return;
    }

    // Apply theme to both containers
    const containers = [slideContainer, modal].filter(Boolean);
    
    containers.forEach(container => {
      if (this.currentTheme === 'dark') {
        container.classList.add('fb-slide__theme-independent-dark');
        container.classList.remove('fb-slide__theme-independent-light');
      } else {
        container.classList.add('fb-slide__theme-independent-light');
        container.classList.remove('fb-slide__theme-independent-dark');
      }
    });

    // Update button icons
    this.updateButtonIcons();
    
    // Update button tooltips and labels
    const lightLabel = 'Switch to dark theme';
    const darkLabel = 'Switch to light theme';
    const currentLabel = this.currentTheme === 'light' ? lightLabel : darkLabel;
    
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('title', currentLabel);
      this.toggleBtn.setAttribute('aria-label', currentLabel);
    }

    if (this.toggleBtnMobile) {
      this.toggleBtnMobile.setAttribute('aria-label', currentLabel);
    }

    // Update mobile text
    if (this.mobileText) {
      this.mobileText.textContent = `Light/Dark: ${this.currentTheme === 'light' ? 'Light' : 'Dark'}`;
    }

    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('slideThemeChanged', {
      detail: { theme: this.currentTheme }
    }));
  }

  /**
   * Update the toggle button icons based on current theme
   */
  updateButtonIcons() {
    // Update desktop icons
    if (this.lightIcon && this.darkIcon) {
      if (this.currentTheme === 'light') {
        // Show sun icon (currently light, click to go dark)
        this.lightIcon.style.display = 'block';
        this.darkIcon.style.display = 'none';
      } else {
        // Show moon icon (currently dark, click to go light)
        this.lightIcon.style.display = 'none';
        this.darkIcon.style.display = 'block';
      }
    }

    // Update mobile icons
    if (this.lightIconMobile && this.darkIconMobile) {
      if (this.currentTheme === 'light') {
        this.lightIconMobile.style.display = 'block';
        this.darkIconMobile.style.display = 'none';
      } else {
        this.lightIconMobile.style.display = 'none';
        this.darkIconMobile.style.display = 'block';
      }
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Set theme programmatically
   */
  setTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      this.currentTheme = theme;
      this.applyTheme();
      this.saveTheme();
    }
  }

  /**
   * Check if dark theme is active
   */
  isDarkTheme() {
    return this.currentTheme === 'dark';
  }

  /**
   * Force apply theme - useful when slide viewer is just opened
   */
  forceApplyTheme() {
    this.applyTheme();
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this.toggleBtn) {
      this.toggleBtn.removeEventListener('click', this.toggleTheme);
    }
    if (this.toggleBtnMobile) {
      this.toggleBtnMobile.removeEventListener('click', this.toggleTheme);
    }
  }
}