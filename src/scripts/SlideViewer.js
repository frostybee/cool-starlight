class SlideViewer {
  constructor() {
    this.slides = [];
    this.currentSlide = 0;
    this.fontSize = this.loadFontSize(); // Load saved font size or use default

    this.modal = document.getElementById('slide-viewer-modal');
    this.slideContent = document.getElementById('slide-content');
    this.currentSlideEl = document.getElementById('current-slide');
    this.totalSlidesEl = document.getElementById('total-slides');
    this.slideNumberIndicator = document.getElementById('slide-number-indicator');
    this.prevBtn = document.getElementById('prev-slide');
    this.nextBtn = document.getElementById('next-slide');
    this.closeBtn = document.getElementById('close-slideshow');
    this.startBtn = document.getElementById('start-slideshow');
    this.decreaseFontBtn = document.getElementById('slide-decrease-font');
    this.resetFontBtn = document.getElementById('slide-reset-font');
    this.increaseFontBtn = document.getElementById('slide-increase-font');
    this.tocSidebar = document.getElementById('slide-toc-sidebar');
    this.tocContent = document.getElementById('slide-toc-content');
    this.tocToggleBtn = document.getElementById('toggle-toc');

    console.log('SlideViewer elements found:', {
      modal: !!this.modal,
      slideContent: !!this.slideContent,
      prevBtn: !!this.prevBtn,
      nextBtn: !!this.nextBtn,
      closeBtn: !!this.closeBtn,
      startBtn: !!this.startBtn,
      decreaseFontBtn: !!this.decreaseFontBtn,
      resetFontBtn: !!this.resetFontBtn,
      increaseFontBtn: !!this.increaseFontBtn,
    });

    this.init();
  }

  init() {
    this.parseSlides();
    this.bindEvents();

    if (this.slides.length === 0) {
      this.startBtn.style.display = 'none';
    }
  }

  parseSlides() {
    const articleContent = document.querySelector('.sl-markdown-content, main .content, article');

    if (!articleContent) {
      console.warn('SlideViewer: Could not find article content');
      return;
    }

    const content = articleContent.cloneNode(true);

    // Remove the slide viewer component itself
    const slideViewerTrigger = content.querySelector('#slide-viewer-trigger');
    if (slideViewerTrigger) {
      slideViewerTrigger.remove();
    }

    const hrElements = content.querySelectorAll('hr');
    const headingElements = content.querySelectorAll('h2, h3');
    console.log('Found HR elements:', hrElements.length);
    console.log('Found H2/H3 elements:', headingElements.length);

    if (hrElements.length === 0 && headingElements.length === 0) {
      // No separators found, treat entire content as one slide
      this.slides = [content];
    } else {
      // Split content by both HR elements and H2/H3 headings
      this.slides = [];
      let currentSlideContent = document.createElement('div');

      Array.from(content.childNodes).forEach((node) => {
        const isSlideBreak = (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'HR') ||
                            (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'H2' || node.tagName === 'H3'));

        if (isSlideBreak) {
          // Save previous slide if it has content (but not for HR elements as they're just separators)
          if (currentSlideContent.children.length > 0 || (currentSlideContent.textContent && currentSlideContent.textContent.trim())) {
            this.slides.push(currentSlideContent);
          }

          // Start new slide
          currentSlideContent = document.createElement('div');

          // For headings, include them in the new slide; for HR, don't include them
          if (node.tagName === 'H2' || node.tagName === 'H3') {
            currentSlideContent.appendChild(node.cloneNode(true));
          }
        } else {
          currentSlideContent.appendChild(node.cloneNode(true));
        }
      });

      // Add the last slide if it has content
      if (currentSlideContent.children.length > 0 || (currentSlideContent.textContent && currentSlideContent.textContent.trim())) {
        this.slides.push(currentSlideContent);
      }
    }

    console.log('Parsed slides:', this.slides.length);
    console.log('Slides content preview:', this.slides.map((slide, index) => ({
      index: index,
      childCount: slide.children.length,
      textLength: slide.textContent ? slide.textContent.length : 0,
      firstChild: slide.children[0] ? slide.children[0].tagName : 'none'
    })));
    this.totalSlidesEl.textContent = this.slides.length.toString();
    this.createTableOfContents();
  }

  createTableOfContents() {
    console.log('Creating table of contents...');
    this.tocContent.innerHTML = '';

    this.slides.forEach((slide, index) => {
      // Extract the first heading from each slide
      const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
      let title = `Slide ${index + 1}`;
      let headingLevel = 'h2';

      if (heading) {
        title = heading.textContent.trim();
        headingLevel = heading.tagName.toLowerCase();
      }

      // Create container for number + item
      const tocItemContainer = document.createElement('div');
      tocItemContainer.className = `toc-item-container ${headingLevel}`;

      // Create the clickable item
      const tocItem = document.createElement('button');
      tocItem.className = `toc-item ${headingLevel}`;
      tocItem.setAttribute('data-slide-index', index);
      
      // Apply card styling directly
      Object.assign(tocItem.style, {
        background: 'var(--toc-bg)',
        border: '2px solid var(--toc-border)',
        borderRadius: '8px',
        margin: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        width: 'calc(100% - 16px)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'var(--toc-text)',
        textAlign: 'left',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        gap: '12px'
      });

      // Create number element (inside the button)
      const numberElement = document.createElement('span');
      numberElement.className = 'toc-item-number-inline';
      numberElement.textContent = (index + 1).toString();
      numberElement.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 50%;
        font-size: 0.75rem;
        font-weight: 700;
        color: #ffffff;
        flex-shrink: 0;
      `;

      // Create title element
      const titleElement = document.createElement('span');
      titleElement.className = 'toc-item-title';
      titleElement.textContent = title;

      tocItem.appendChild(numberElement);
      tocItem.appendChild(titleElement);

      tocItem.addEventListener('click', () => {
        this.goToSlide(index);
      });
      
      // Add hover effects using CSS variables
      tocItem.addEventListener('mouseenter', () => {
        if (!tocItem.classList.contains('active')) {
          Object.assign(tocItem.style, {
            background: 'var(--toc-hover-bg)',
            borderColor: 'var(--toc-hover-border)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px var(--toc-hover-shadow)'
          });
        }
      });
      
      tocItem.addEventListener('mouseleave', () => {
        if (!tocItem.classList.contains('active')) {
          Object.assign(tocItem.style, {
            background: 'var(--toc-bg)',
            borderColor: 'var(--toc-border)',
            transform: 'translateY(0)',
            boxShadow: 'none'
          });
        }
      });

      tocItemContainer.appendChild(tocItem);

      this.tocContent.appendChild(tocItemContainer);
      console.log('Added TOC item:', title, 'with classes:', tocItemContainer.className);
    });

    console.log('TOC items created, total:', this.slides.length);
    this.updateTocSelection();
  }

  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
      this.showSlide(index);
      this.updateTocSelection();
    }
  }

  updateTocSelection() {
    const tocItems = this.tocContent.querySelectorAll('.toc-item');
    tocItems.forEach((item, index) => {
      const isActive = index === this.currentSlide;
      item.classList.toggle('active', isActive);
      
      if (isActive) {
        Object.assign(item.style, {
          background: 'var(--toc-active-bg)',
          color: 'var(--toc-active-text)',
          borderColor: 'var(--toc-active-border)',
          transform: 'translateY(0)',
          boxShadow: '0 4px 12px var(--toc-active-shadow)'
        });
      } else {
        Object.assign(item.style, {
          background: 'var(--toc-bg)',
          color: 'var(--toc-text)',
          borderColor: 'var(--toc-border)',
          transform: 'translateY(0)',
          boxShadow: 'none'
        });
      }
    });
  }

  bindEvents() {
    console.log('Binding events to buttons...');

    this.startBtn.addEventListener('click', () => {
      console.log('Start button clicked');
      this.openSlideshow();
    });

    this.closeBtn.addEventListener('click', () => {
      console.log('Close button clicked');
      this.closeSlideshow();
    });

    this.prevBtn.addEventListener('click', (e) => {
      console.log('Prev button clicked');
      e.preventDefault();
      e.stopPropagation();
      this.previousSlide();
    });

    this.nextBtn.addEventListener('click', (e) => {
      console.log('Next button clicked');
      e.preventDefault();
      e.stopPropagation();
      this.nextSlide();
    });

    // Fallback: Also add event listener using direct onclick
    this.nextBtn.onclick = (e) => {
      console.log('Next button onclick fired');
      e.preventDefault();
      e.stopPropagation();
      this.nextSlide();
    };

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('hidden')) {
        switch(e.key) {
          case 'Escape':
            e.preventDefault();
            this.closeSlideshow();
            break;
          case 'ArrowLeft':
          case 'PageUp':
            e.preventDefault();
            this.previousSlide();
            break;
          case 'ArrowRight':
          case 'PageDown':
            e.preventDefault();
            this.nextSlide();
            break;
        }
      }
    });

    // Close modal when clicking outside
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeSlideshow();
      }
    });

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

    // TOC toggle functionality
    this.tocToggleBtn.addEventListener('click', () => {
      this.tocSidebar.classList.toggle('collapsed');
    });

    // Click on collapsed sidebar to expand
    this.tocSidebar.addEventListener('click', (e) => {
      if (this.tocSidebar.classList.contains('collapsed')) {
        // Don't toggle if clicking on the toggle button itself (prevent double toggle)
        if (!this.tocToggleBtn.contains(e.target)) {
          this.tocSidebar.classList.remove('collapsed');
        }
      }
    });
  }

  openSlideshow() {
    if (this.slides.length === 0) return;

    this.currentSlide = 0;
    // Move modal to document body to escape stacking context
    document.body.appendChild(this.modal);
    this.modal.classList.remove('hidden');
    this.showSlide(0);
    document.body.style.overflow = 'hidden';

    // Apply saved font size when slideshow opens
    this.applyFontSize();

    // Request fullscreen mode
    this.requestFullscreen();

    // Small delay to ensure DOM is ready for interactions
    setTimeout(() => {
      this.nextBtn.style.pointerEvents = 'auto';
      this.prevBtn.style.pointerEvents = 'auto';
    }, 200);
  }

  closeSlideshow() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = '';
    
    // Exit fullscreen if currently in fullscreen
    this.exitFullscreen();
  }

  showSlide(index) {
    this.slideContent.classList.add('transitioning');

    setTimeout(() => {
      this.slideContent.innerHTML = '';
      const slideClone = this.slides[index].cloneNode(true);
      
      // Remove Starlight anchor links from headings
      const anchorLinks = slideClone.querySelectorAll('.sl-anchor-link');
      if (anchorLinks.length > 0) {
        anchorLinks.forEach(link => link.remove());
      }
      
      this.slideContent.appendChild(slideClone);
      this.currentSlideEl.textContent = (index + 1).toString();
      this.slideNumberIndicator.textContent = (index + 1).toString();

      // Update navigation buttons
      this.prevBtn.disabled = index === 0;
      this.nextBtn.disabled = index === this.slides.length - 1;

      // Scroll to top of slide
      const slideWrapper = this.slideContent.parentElement;
      slideWrapper.scrollTop = 0;

      this.slideContent.classList.remove('transitioning');
      this.updateTocSelection();
    }, 150);
  }

  nextSlide() {
    console.log('nextSlide called, current:', this.currentSlide, 'total:', this.slides.length);
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.showSlide(this.currentSlide);
    } else {
      console.log('Cannot go to next slide - already at last slide');
    }
  }

  previousSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.showSlide(this.currentSlide);
    }
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
    const slideContainer = this.modal.querySelector('.slide-content');
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

  requestFullscreen() {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen().catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen().catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen().catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    }
  }
}

// Initialize the SlideViewer
function initSlideViewer() {
  console.log('Initializing SlideViewer...');
  try {
    const viewer = new SlideViewer();
    console.log('SlideViewer initialized successfully');
  } catch (error) {
    console.error('SlideViewer initialization failed:', error);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSlideViewer);
} else {
  // DOM is already loaded, initialize immediately
  initSlideViewer();
}