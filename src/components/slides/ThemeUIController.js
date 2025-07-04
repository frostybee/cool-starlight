export class ThemeUIController {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.themeManager = slideViewer.themeManager;

    // Desktop elements.
    this.themeBtn = document.getElementById('slide-theme-btn');
    this.themeDropdown = document.getElementById('slide-theme-dropdown');
    this.themeItems = document.querySelectorAll('.fb-slide__theme-item');

    // Mobile elements.
    this.cycleMobileBtn = document.getElementById('cycle-theme-mobile');
    this.mobileThemeText = document.getElementById('mobile-theme-text');

    this.isDropdownOpen = false;

    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    // Desktop theme button click.
    this.themeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Desktop theme item clicks.
    this.themeItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedTheme = item.dataset.theme;
        this.setTheme(selectedTheme);
        this.hideDropdown();
      });
    });

    // Mobile theme cycle button.
    this.cycleMobileBtn?.addEventListener('click', () => {
      const nextTheme = this.themeManager.cycleTheme();
      this.updateUI();
    });

    // Close dropdown when clicking outside.
    document.addEventListener('click', (e) => {
      if (this.isDropdownOpen && !this.themeBtn?.contains(e.target) && !this.themeDropdown?.contains(e.target)) {
        this.hideDropdown();
      }
    });

    // Listen for theme changes from other sources.
    document.addEventListener('theme-applied', () => {
      this.updateUI();
    });

    // Keyboard shortcut - T key to cycle themes.
    document.addEventListener('keydown', (e) => {
      if (!this.slideViewer.modal.classList.contains('hidden')) {
        // Only when slideshow is open.
        if (e.key === 't' || e.key === 'T') {
          // Don't trigger if user is typing in inputs.
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
    // Dispatch custom event that ThemeManager listens for.
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
    this.themeDropdown?.classList.remove('hidden');
    this.themeBtn?.classList.add('active');
    this.isDropdownOpen = true;

    // Update dropdown to show only available themes.
    this.updateDropdownItems();

    // Set current theme as selected.
    const currentTheme = this.themeManager.getCurrentTheme();
    this.updateActiveTheme(currentTheme);
  }

  hideDropdown() {
    this.themeDropdown?.classList.add('hidden');
    this.themeBtn?.classList.remove('active');
    this.isDropdownOpen = false;
  }

  updateUI() {
    const currentTheme = this.themeManager.getCurrentTheme();
    const themes = this.themeManager.getAvailableThemes();

    // Update dropdown items visibility.
    this.updateDropdownItems();

    // Update desktop dropdown selection.
    this.updateActiveTheme(currentTheme);

    // Update mobile theme text.
    if (this.mobileThemeText) {
      const themeName = themes[currentTheme] || currentTheme;
      this.mobileThemeText.textContent = `Theme: ${themeName}`;
    }

    // Update button title for accessibility.
    if (this.themeBtn) {
      const themeName = themes[currentTheme] || currentTheme;
      this.themeBtn.title = `Theme: ${themeName} (Press T to cycle)`;
    }
  }

  updateDropdownItems() {
    const availableThemes = this.themeManager.getAvailableThemes();

    // Show/hide theme items based on availability.
    this.themeItems.forEach(item => {
      const themeName = item.dataset.theme;
      if (availableThemes[themeName]) {
        item.style.display = '';
        item.classList.remove('disabled');
      } else {
        item.style.display = '';
        item.classList.add('disabled');
      }
    });
  }

  updateActiveTheme(currentTheme) {
    // Remove active class from all theme items.
    this.themeItems.forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to current theme item.
    let activeItem = document.querySelector(`[data-theme="${currentTheme}"]`);

    // Handle theme substitution cases - if the actual theme isn't available,
    // check if we should highlight the disabled theme that maps to this one
    if (!activeItem || activeItem.classList.contains('disabled')) {
      const starlightTheme = this.themeManager.getStarlightTheme();

      // If current theme is github and starlight is light, highlight dark theme as active.
      if (currentTheme === 'github' && starlightTheme === 'light') {
        const darkItem = document.querySelector(`[data-theme="dark"]`);
        if (darkItem) {
          activeItem = darkItem;
        }
      }
      // If current theme is dracula and starlight is dark, highlight light theme as active.
      else if (currentTheme === 'dracula' && starlightTheme === 'dark') {
        const lightItem = document.querySelector(`[data-theme="light"]`);
        if (lightItem) {
          activeItem = lightItem;
        }
      }
    }

    if (activeItem) {
      activeItem.classList.add('active');
    }
  }
}