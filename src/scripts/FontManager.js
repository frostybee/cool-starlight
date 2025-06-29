export class FontManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.fontSize = this.loadFontSize(); // Load saved font size or use default
    
    this.decreaseFontBtn = document.getElementById('slide-decrease-font');
    this.resetFontBtn = document.getElementById('slide-reset-font');
    this.increaseFontBtn = document.getElementById('slide-increase-font');
    
    this.bindEvents();
  }

  bindEvents() {
    // Font size adjustment events
    this.decreaseFontBtn.addEventListener('click', () => {
      this.adjustFontSize(-20);
    });

    this.resetFontBtn.addEventListener('click', () => {
      this.resetFontSize();
    });

    this.increaseFontBtn.addEventListener('click', () => {
      this.adjustFontSize(20);
    });
  }

  adjustFontSize(change) {
    const newSize = Math.max(60, Math.min(500, this.fontSize + change));
    this.fontSize = newSize;
    this.saveFontSize();
    this.applyFontSize();
  }

  resetFontSize() {
    this.fontSize = 100;
    this.saveFontSize();
    this.applyFontSize();
  }

  applyFontSize() {
    const slideContainer = this.slideViewer.modal.querySelector('.fb-slide__content');
    if (slideContainer) {
      const scale = this.fontSize / 100;
      slideContainer.style.setProperty('--font-scale', scale);
    }
  }

  loadFontSize() {
    try {
      const savedSize = localStorage.getItem('slideViewer-fontSize');
      if (savedSize) {
        const parsedSize = parseInt(savedSize, 10);
        // Validate the saved size is within acceptable bounds
        if (parsedSize >= 60 && parsedSize <= 500) {
          return parsedSize;
        }
      }
    } catch (error) {
      console.log('Error loading font size from localStorage:', error);
    }
    return 100; // Default font size percentage
  }

  saveFontSize() {
    try {
      localStorage.setItem('slideViewer-fontSize', this.fontSize.toString());
    } catch (error) {
      console.log('Error saving font size to localStorage:', error);
    }
  }
}