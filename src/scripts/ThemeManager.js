export class ThemeManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;

    // Available themes with their display names.
    this.themes = {
      'light': 'Light',
      'dark': 'Dark',
      'dracula': 'Dracula',
      'github': 'GitHub',
      'discord': 'Discord',
      'onedark': 'One Dark'
    };

    this.currentTheme = this.loadTheme();

    this.bindEvents();
  }

  bindEvents() {
    // Listen for theme selector changes.
    document.addEventListener('theme-changed', (e) => {
      this.setTheme(e.detail.theme);
    });
  }

  setTheme(theme) {
    if (!this.themes[theme]) {
      console.warn(`Theme "${theme}" not found. Available themes:`, Object.keys(this.themes));
      return;
    }

    // Check for conflicts with Starlight theme.
    const starlightTheme = this.getStarlightTheme();
    if (starlightTheme === 'dark' && theme === 'light') {
      console.warn('Light theme disabled when Starlight is in dark mode to prevent conflicts. Switching to dracula theme.');
      theme = 'dracula';
    } else if (starlightTheme === 'light' && theme === 'dark') {
      console.warn('Dark theme disabled when Starlight is in light mode to prevent conflicts. Switching to github theme.');
      theme = 'github';
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
    if (!modal) return;

    // Remove all existing theme classes.
    Object.keys(this.themes).forEach(theme => {
      modal.classList.remove(`fb-slide__theme-${theme}`);
    });

    // Add the current theme class.
    modal.classList.add(`fb-slide__theme-${this.currentTheme}`);

    // Also set on document for global theme awareness.
    document.documentElement.setAttribute('data-slide-theme', this.currentTheme);
  }

  checkThemeCompatibility() {
    const starlightTheme = this.getStarlightTheme();
    const currentTheme = this.getCurrentTheme();

    // Check if current theme is incompatible with Starlight theme.
    const isIncompatible = (starlightTheme === 'dark' && currentTheme === 'light') ||
                          (starlightTheme === 'light' && currentTheme === 'dark');

    if (isIncompatible) {
      console.warn(`Current theme "${currentTheme}" is incompatible with Starlight theme "${starlightTheme}". Switching to compatible theme.`);

      // Switch to a compatible theme.
      let newTheme;
      if (starlightTheme === 'dark') {
        newTheme = 'dracula';
      } else {
        newTheme = 'github';
      }

      this.setTheme(newTheme);
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getStarlightTheme() {
    return document.documentElement.dataset.theme || 'light';
  }

  getAvailableThemes() {
    const starlightTheme = this.getStarlightTheme();
    const availableThemes = { ...this.themes };

    // Filter incompatible themes based on Starlight theme.
    if (starlightTheme === 'dark') {
      delete availableThemes.light;
    } else if (starlightTheme === 'light') {
      delete availableThemes.dark;
    }

    return availableThemes;
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
        // Check for conflicts with Starlight theme.
        const starlightTheme = this.getStarlightTheme();
        if (starlightTheme === 'dark' && savedTheme === 'light') {
          console.warn('Saved light theme conflicts with Starlight dark mode. Using dracula theme instead.');
          return 'dracula';
        } else if (starlightTheme === 'light' && savedTheme === 'dark') {
          console.warn('Saved dark theme conflicts with Starlight light mode. Using github theme instead.');
          return 'github';
        }
        return savedTheme;
      }
    } catch (error) {
      console.log('Error loading theme from localStorage:', error);
    }

    // Choose default theme based on Starlight theme.
    const starlightTheme = this.getStarlightTheme();
    if (starlightTheme === 'light') {
      return 'github'; // Default for light Starlight.
    } else {
      return 'dracula'; // Default for dark Starlight.
    }
  }

  saveTheme() {
    try {
      localStorage.setItem('slideViewer-theme', this.currentTheme);
    } catch (error) {
      console.log('Error saving theme to localStorage:', error);
    }
  }
}