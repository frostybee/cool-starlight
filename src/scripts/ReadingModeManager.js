export class ReadingModeManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.toggleReadingModeBtn = document.getElementById('toggle-reading-mode');
    this.toggleReadingModeBtnMobile = document.getElementById('toggle-reading-mode-mobile');
    
    this.bindEvents();
  }

  bindEvents() {
    // Reading mode toggle event (inside modal)
    if (this.toggleReadingModeBtn) {
      console.log('Binding click event to reading mode toggle button');
      this.toggleReadingModeBtn.addEventListener('click', (e) => {
        console.log('Reading mode toggle clicked!', e);
        e.preventDefault();
        e.stopPropagation();
        this.toggleReadingMode();
      });
    } else {
      console.warn('Toggle reading mode button not found!');
    }

    if (this.toggleReadingModeBtnMobile) {
      this.toggleReadingModeBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleReadingMode();
        this.slideViewer.mobileManager.closeMobileMenu();
      });
    }
  }

  toggleReadingMode() {
    console.log('toggleReadingMode called, current mode:', this.slideViewer.isReadingMode);
    this.slideViewer.isReadingMode = !this.slideViewer.isReadingMode;
    console.log('new mode:', this.slideViewer.isReadingMode);
    
    // Clear heading cache when switching modes
    if (this.slideViewer.searchManager) {
      this.slideViewer.searchManager.headingPositionsCache = null;
    }
    
    this.applyReadingMode();
  }

  applyReadingMode() {
    const toggleBtn = this.toggleReadingModeBtn;
    
    if (this.slideViewer.isReadingMode) {
      // Reading mode: Show the entire original document content
      this.showOriginalDocument();
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M9 3v18M15 3v18"/>
          </svg>
          📽️ Slide Mode
        `;
        toggleBtn.title = 'Switch to slide mode';
      }
      // Hide navigation controls in reading mode
      this.slideViewer.prevBtn.style.display = 'none';
      this.slideViewer.nextBtn.style.display = 'none';
      this.slideViewer.slideCounter.style.display = 'none';
      if (this.slideViewer.prevBtnMobile) this.slideViewer.prevBtnMobile.style.display = 'none';
      if (this.slideViewer.nextBtnMobile) this.slideViewer.nextBtnMobile.style.display = 'none';
      if (this.slideViewer.slideCounterMobile) this.slideViewer.slideCounterMobile.style.display = 'none';
      // Set slide number indicator to 1 in reading mode
      this.slideViewer.slideNumberIndicator.textContent = '1';
      // Collapse the left sidebar in reading mode
      this.slideViewer.tocSidebar.classList.add('collapsed');
    } else {
      // Slide mode: Reset slide content styling and show current slide
      this.slideViewer.slideContent.classList.remove('fb-slide__content-reading-mode');
      this.slideViewer.showSlide(this.slideViewer.currentSlide);
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          📖 Reading Mode
        `;
        toggleBtn.title = 'Switch to reading mode';
      }
      // Show navigation controls in slide mode
      this.slideViewer.prevBtn.style.display = '';
      this.slideViewer.nextBtn.style.display = '';
      this.slideViewer.slideCounter.style.display = '';
      if (this.slideViewer.prevBtnMobile) this.slideViewer.prevBtnMobile.style.display = '';
      if (this.slideViewer.nextBtnMobile) this.slideViewer.nextBtnMobile.style.display = '';
      if (this.slideViewer.slideCounterMobile) this.slideViewer.slideCounterMobile.style.display = '';
      // Restore sidebar state in slide mode (don't force expand, keep user's preference)
    }
  }

  showOriginalDocument() {
    this.slideViewer.slideContent.innerHTML = '';
    this.slideViewer.slideContent.classList.add('fb-slide__content-reading-mode');
    
    // Get the original document content (before slide parsing)
    const articleContent = document.querySelector('.sl-markdown-content, main .content, article');
    if (!articleContent) {
      console.warn('Could not find original article content');
      return;
    }
    
    // Clone the original content
    const originalContent = articleContent.cloneNode(true);
    
    // Remove the slide viewer component itself from the clone
    const slideViewerTrigger = originalContent.querySelector('#slide-viewer-trigger');
    if (slideViewerTrigger) {
      slideViewerTrigger.remove();
    }
    
    // Remove any Starlight anchor links
    const anchorLinks = originalContent.querySelectorAll('.sl-anchor-link');
    if (anchorLinks.length > 0) {
      anchorLinks.forEach(link => link.remove());
    }
    
    // Create container for the original document
    const readingContainer = document.createElement('div');
    readingContainer.className = 'fb-slide__reading-mode-content';
    
    readingContainer.appendChild(originalContent);
    this.slideViewer.slideContent.appendChild(readingContainer);
  }
}