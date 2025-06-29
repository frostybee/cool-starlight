export class FontManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.fontSize = this.loadFontSize(); // Load saved font size or use default
    
    this.decreaseFontBtn = document.getElementById('slide-decrease-font');
    this.increaseFontBtn = document.getElementById('slide-increase-font');
    
    // Track double-click for reset functionality
    this.lastClickTime = 0;
    this.resetThreshold = 500; // milliseconds for double-click
    
    this.bindEvents();
  }

  bindEvents() {
    // Font size adjustment events with double-click reset
    this.decreaseFontBtn.addEventListener('click', (e) => {
      const currentTime = new Date().getTime();
      if (currentTime - this.lastClickTime < this.resetThreshold) {
        // Double-click detected - reset font size
        this.resetFontSize();
      } else {
        // Single click - decrease font size
        this.adjustFontSize(-20);
      }
      this.lastClickTime = currentTime;
    });

    this.increaseFontBtn.addEventListener('click', (e) => {
      const currentTime = new Date().getTime();
      if (currentTime - this.lastClickTime < this.resetThreshold) {
        // Double-click detected - reset font size
        this.resetFontSize();
      } else {
        // Single click - increase font size
        this.adjustFontSize(20);
      }
      this.lastClickTime = currentTime;
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