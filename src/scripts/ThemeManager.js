export class ThemeManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;

    // Available themes with their display names.
    this.themes = {
      'default': 'Default',
      'dracula': 'Dracula',
      'github': 'GitHub',
      'discord': 'Discord',
      'onedark': 'One Dark',
      'ocean': 'Ocean'
    };

    this.currentTheme = this.loadTheme();

    this.bindEvents();
  }

  bindEvents() {
    // Listen for theme selector changes.
    document.addEventListener('theme-changed', (e) => {
      this.setTheme(e.detail.theme);
    });

    // Listen for light/dark toggle changes from ThemeToggleManager
    window.addEventListener('slideThemeChanged', (e) => {
      this.handleLightDarkToggle(e.detail.theme);
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

    // Dispatch event for other components.
    document.dispatchEvent(new CustomEvent('theme-applied', {
      detail: { theme: this.currentTheme }
    }));
  }

  applyTheme() {
    const modal = this.slideViewer.modal;
    const slideContainer = document.querySelector('.fb-slide__container');
    
    if (!modal) return;

    // Apply to both modal and container like ThemeToggleManager does
    const containers = [modal, slideContainer].filter(Boolean);

    // Get the effective theme (considering light/dark variants)
    const effectiveTheme = this.getEffectiveTheme();

    containers.forEach(container => {
      // Remove all existing theme classes.
      Object.keys(this.themes).forEach(theme => {
        container.classList.remove(`fb-slide__theme-${theme}`);
        container.classList.remove(`fb-slide__theme-${theme}-light`); // Also remove light variants
      });

      // Also remove old legacy theme classes from ThemeToggleManager
      container.classList.remove('fb-slide__theme-light');
      container.classList.remove('fb-slide__theme-dark');
      container.classList.remove('fb-slide__theme-default-dark'); // Remove old incorrect naming

      // Add the effective theme class.
      container.classList.add(`fb-slide__theme-${effectiveTheme}`);
    });

    // Also set on document for global theme awareness.
    document.documentElement.setAttribute('data-slide-theme', effectiveTheme);
  }

  checkThemeCompatibility() {
    // No longer needed - all themes work with both light and dark Starlight modes
    // since they have light/dark variants controlled by the toggle
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  handleLightDarkToggle(toggleTheme) {
    // Re-apply current theme to pick up the new light/dark variant
    this.applyTheme();
  }

  getEffectiveTheme() {
    // Get the light/dark state from ThemeToggleManager
    const themeToggleManager = this.slideViewer.themeToggleManager;
    const isLightMode = themeToggleManager?.getCurrentTheme() === 'light';

    // Debug logging
    console.log('🔍 Theme Debug:', {
      currentTheme: this.currentTheme,
      toggleState: themeToggleManager?.getCurrentTheme(),
      isLightMode: isLightMode
    });

    // All themes now have light/dark variants
    const themesWithVariants = ['default', 'dracula', 'github', 'discord', 'onedark', 'ocean'];
    
    if (themesWithVariants.includes(this.currentTheme)) {
      let effectiveTheme;
      // All themes now follow the same pattern: base = dark, -light = light
      effectiveTheme = isLightMode ? `${this.currentTheme}-light` : this.currentTheme;
      
      console.log('🎨 Effective theme:', effectiveTheme);
      return effectiveTheme;
    }

    // Fallback (shouldn't happen with current themes)
    return this.currentTheme;
  }

  getStarlightTheme() {
    return document.documentElement.dataset.theme || 'light';
  }

  getAvailableThemes() {
    // All themes are now always available since they have light/dark variants
    return { ...this.themes };
  }

  cycleTheme() {
    const availableThemes = this.getAvailableThemes();
    const themeKeys = Object.keys(availableThemes);
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
      // Handle legacy theme names
      if (savedTheme === 'light') {
        return 'default';
      }
      if (savedTheme === 'dark') {
        return 'default';
      }
    } catch (error) {
      console.log('Error loading theme from localStorage:', error);
    }

    // Default theme for all Starlight modes
    return 'default';
  }

  saveTheme() {
    try {
      localStorage.setItem('slideViewer-theme', this.currentTheme);
    } catch (error) {
      console.log('Error saving theme to localStorage:', error);
    }
  }
}