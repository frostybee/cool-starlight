export class ThemeUIController {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.themeManager = slideViewer.themeManager;
    
    // Desktop elements
    this.themeBtn = document.getElementById('slide-theme-btn');
    this.themeSelect = document.getElementById('slide-theme-select');
    
    // Mobile elements
    this.cycleMobileBtn = document.getElementById('cycle-theme-mobile');
    this.mobileThemeText = document.getElementById('mobile-theme-text');
    
    this.isDropdownOpen = false;
    
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    // Desktop theme button click
    this.themeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Desktop theme select change
    this.themeSelect?.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      this.setTheme(selectedTheme);
      this.hideDropdown();
    });

    // Mobile theme cycle button
    this.cycleMobileBtn?.addEventListener('click', () => {
      const nextTheme = this.themeManager.cycleTheme();
      this.updateUI();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isDropdownOpen && !this.themeBtn?.contains(e.target) && !this.themeSelect?.contains(e.target)) {
        this.hideDropdown();
      }
    });

    // Listen for theme changes from other sources
    document.addEventListener('theme-applied', () => {
      this.updateUI();
    });

    // Keyboard shortcut - T key to cycle themes
    document.addEventListener('keydown', (e) => {
      if (!this.slideViewer.modal.classList.contains('hidden')) {
        // Only when slideshow is open
        if (e.key === 't' || e.key === 'T') {
          // Don't trigger if user is typing in inputs
          if (document.activeElement?.tagName === 'INPUT' || 
              document.activeElement?.tagName === 'SELECT' ||
              document.activeElement?.tagName === 'TEXTAREA') {
            return;
          }
          
          e.preventDefault();
          const nextTheme = this.themeManager.cycleTheme();
          this.updateUI();
        }
      }
    });
  }

  setTheme(theme) {
    // Dispatch custom event that ThemeManager listens for
    document.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme }
    }));
  }

  toggleDropdown() {
    if (this.isDropdownOpen) {
      this.hideDropdown();
    } else {
      this.showDropdown();
    }
  }

  showDropdown() {
    this.themeSelect?.classList.remove('hidden');
    this.themeBtn?.classList.add('active');
    this.isDropdownOpen = true;
    
    // Set current theme as selected
    const currentTheme = this.themeManager.getCurrentTheme();
    if (this.themeSelect) {
      this.themeSelect.value = currentTheme;
      this.themeSelect.focus();
    }
  }

  hideDropdown() {
    this.themeSelect?.classList.add('hidden');
    this.themeBtn?.classList.remove('active');
    this.isDropdownOpen = false;
  }

  updateUI() {
    const currentTheme = this.themeManager.getCurrentTheme();
    const themes = this.themeManager.getAvailableThemes();
    
    // Update desktop select value
    if (this.themeSelect) {
      this.themeSelect.value = currentTheme;
    }
    
    // Update mobile theme text
    if (this.mobileThemeText) {
      const themeName = themes[currentTheme] || currentTheme;
      this.mobileThemeText.textContent = `Theme: ${themeName}`;
    }
    
    // Update button title for accessibility
    if (this.themeBtn) {
      const themeName = themes[currentTheme] || currentTheme;
      this.themeBtn.title = `Theme: ${themeName} (Press T to cycle)`;
    }
  }
}