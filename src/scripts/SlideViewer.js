import { SearchManager } from './SearchManager.js';
import { ReadingModeManager } from './ReadingModeManager.js';
import { ThumbnailManager } from './ThumbnailManager.js';
import { MobileMenuManager } from './MobileMenuManager.js';
import { FullscreenManager } from './FullscreenManager.js';
import { FontManager } from './FontManager.js';
import { TOCManager } from './TOCManager.js';
import { LaserPointerManager } from './LaserPointerManager.js';
import { KeyboardHelpManager } from './KeyboardHelpManager.js';
import { ThemeManager } from './ThemeManager.js';
import { ThemeUIController } from './ThemeUIController.js';
import { BookmarkManager } from './BookmarkManager.js';

export class SlideViewer {
  constructor() {
    this.slides = [];
    this.currentSlide = 0;
    this.isReadingMode = false; // Toggle between slide mode and reading mode in modal
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    this.previousActiveElement = null;

    // Core UI elements
    this.modal = document.getElementById('slide-viewer-modal');
    this.slideContent = document.getElementById('slide-content');
    this.totalSlidesEl = document.getElementById('total-slides');
    this.slideNumberIndicator = document.getElementById('slide-number-indicator');
    this.prevBtn = document.getElementById('prev-slide');
    this.nextBtn = document.getElementById('next-slide');
    this.closeBtn = document.getElementById('close-slideshow');
    this.startBtn = document.getElementById('start-slideshow');
    this.slideCounter = document.getElementById('slide-counter');
    this.slideInput = document.getElementById('slide-input');
    this.gotoModal = document.getElementById('goto-slide-modal');
    this.gotoInput = document.getElementById('goto-slide-input');
    this.gotoConfirm = document.getElementById('goto-confirm');
    this.gotoCancel = document.getElementById('goto-cancel');
    this.progressFill = document.getElementById('slide-progress-fill');

    // Create ARIA live region for announcements
    this.ariaLiveRegion = this.createAriaLiveRegion();
    
    // Create skip links
    this.skipLinks = this.createSkipLinks();

    // Initialize managers
    this.searchManager = new SearchManager(this);
    this.readingModeManager = new ReadingModeManager(this);
    this.thumbnailManager = new ThumbnailManager(this);
    this.mobileManager = new MobileMenuManager(this);
    this.fullscreenManager = new FullscreenManager(this);
    this.fontManager = new FontManager(this);
    this.tocManager = new TOCManager(this);
    this.laserPointerManager = new LaserPointerManager(this);
    this.keyboardHelpManager = new KeyboardHelpManager(this);
    this.themeManager = new ThemeManager(this);
    this.themeUIController = new ThemeUIController(this);
    this.bookmarkManager = new BookmarkManager(this);

    // Expose manager properties for backward compatibility
    this.tocSidebar = this.tocManager.tocSidebar;
    this.tocContent = this.tocManager.tocContent;
    this.prevBtnMobile = this.mobileManager.prevBtnMobile;
    this.nextBtnMobile = this.mobileManager.nextBtnMobile;
    this.slideCounterMobile = this.mobileManager.slideCounterMobile;

    console.log('SlideViewer elements found:', {
      modal: !!this.modal,
      slideContent: !!this.slideContent,
      prevBtn: !!this.prevBtn,
      nextBtn: !!this.nextBtn,
      closeBtn: !!this.closeBtn,
      startBtn: !!this.startBtn,
      slideInput: !!this.slideInput,
      gotoModal: !!this.gotoModal,
      gotoInput: !!this.gotoInput,
      gotoConfirm: !!this.gotoConfirm,
      gotoCancel: !!this.gotoCancel,
    });

    this.init();
    this.setupAccessibility();
  }

  createAriaLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('aria-relevant', 'additions text');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'slide-announcements';
    document.body.appendChild(liveRegion);
    return liveRegion;
  }

  createSkipLinks() {
    const skipContainer = document.createElement('div');
    skipContainer.className = 'skip-links';
    skipContainer.innerHTML = `
      <a href="#slide-content" class="skip-link">Skip to slide content</a>
      <a href="#slide-controls" class="skip-link">Skip to slide controls</a>
    `;
    
    // Add skip links to modal
    if (this.modal) {
      this.modal.insertBefore(skipContainer, this.modal.firstChild);
    }
    
    return skipContainer;
  }

  setupAccessibility() {
    // Set up modal ARIA attributes
    if (this.modal) {
      this.modal.setAttribute('role', 'dialog');
      this.modal.setAttribute('aria-modal', 'true');
      this.modal.setAttribute('aria-labelledby', 'slideshow-title');
      this.modal.setAttribute('aria-describedby', 'slideshow-description');
    }

    // Add hidden title and description for screen readers
    if (!document.getElementById('slideshow-title')) {
      const title = document.createElement('h2');
      title.id = 'slideshow-title';
      title.className = 'sr-only';
      title.textContent = 'Slideshow Viewer';
      this.modal.appendChild(title);
    }

    if (!document.getElementById('slideshow-description')) {
      const description = document.createElement('div');
      description.id = 'slideshow-description';
      description.className = 'sr-only';
      description.textContent = 'Interactive slideshow viewer. Use arrow keys to navigate, Escape to close.';
      this.modal.appendChild(description);
    }

    // Set up button ARIA labels
    if (this.prevBtn) {
      this.prevBtn.setAttribute('aria-label', 'Previous slide');
    }
    if (this.nextBtn) {
      this.nextBtn.setAttribute('aria-label', 'Next slide');
    }
    if (this.closeBtn) {
      this.closeBtn.setAttribute('aria-label', 'Close slideshow');
    }
    if (this.startBtn) {
      this.startBtn.setAttribute('aria-label', 'Start slideshow presentation');
    }

    // Set up slide content region
    if (this.slideContent) {
      this.slideContent.setAttribute('role', 'region');
      this.slideContent.setAttribute('aria-label', 'Slide content');
      this.slideContent.setAttribute('aria-live', 'polite');
      this.slideContent.id = 'slide-content'; // Ensure ID for skip links
    }

    // Set up slide controls region
    const controlsContainer = this.modal.querySelector('.slide-controls, .fb-slide__controls');
    if (controlsContainer) {
      controlsContainer.setAttribute('role', 'region');
      controlsContainer.setAttribute('aria-label', 'Slide navigation controls');
      controlsContainer.id = 'slide-controls'; // Ensure ID for skip links
    }

    // Set up goto modal accessibility
    if (this.gotoModal) {
      this.gotoModal.setAttribute('role', 'dialog');
      this.gotoModal.setAttribute('aria-modal', 'true');
      this.gotoModal.setAttribute('aria-labelledby', 'goto-modal-title');
      
      // Add hidden title for goto modal
      if (!document.getElementById('goto-modal-title')) {
        const gotoTitle = document.createElement('h3');
        gotoTitle.id = 'goto-modal-title';
        gotoTitle.className = 'sr-only';
        gotoTitle.textContent = 'Go to slide';
        this.gotoModal.appendChild(gotoTitle);
      }
    }

    // Set up slide input accessibility
    if (this.slideInput) {
      this.slideInput.setAttribute('aria-label', 'Current slide number');
      this.slideInput.setAttribute('role', 'spinbutton');
    }

    if (this.gotoInput) {
      this.gotoInput.setAttribute('aria-label', 'Enter slide number to navigate to');
      this.gotoInput.setAttribute('role', 'spinbutton');
    }

    // Set up progress indicator
    if (this.progressFill && this.progressFill.parentElement) {
      this.progressFill.parentElement.setAttribute('role', 'progressbar');
      this.progressFill.parentElement.setAttribute('aria-label', 'Slide progress');
      this.progressFill.parentElement.setAttribute('aria-valuemin', '0');
      this.progressFill.parentElement.setAttribute('aria-valuemax', '100');
    }

  }

  updateFocusableElements() {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    this.focusableElements = Array.from(
      this.modal.querySelectorAll(focusableSelectors.join(', '))
    ).filter(el => {
      return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.closest('.hidden');
    });
    
    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
  }

  trapFocus(event) {
    if (event.key !== 'Tab') return;
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement.focus();
      }
    }
  }

  announceSlideChange(slideNumber, totalSlides) {
    const message = `Slide ${slideNumber} of ${totalSlides}`;
    this.ariaLiveRegion.textContent = message;
    
    // Clear the message after announcement to allow repeated announcements
    setTimeout(() => {
      this.ariaLiveRegion.textContent = '';
    }, 1000);
  }

  updateGotoModalFocusableElements() {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    this.gotoModalFocusableElements = Array.from(
      this.gotoModal.querySelectorAll(focusableSelectors.join(', '))
    ).filter(el => {
      return el.offsetWidth > 0 && el.offsetHeight > 0;
    });
    
    this.gotoModalFirstFocusable = this.gotoModalFocusableElements[0];
    this.gotoModalLastFocusable = this.gotoModalFocusableElements[this.gotoModalFocusableElements.length - 1];
  }

  trapGotoModalFocus(event) {
    if (event.key !== 'Tab') return;
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.gotoModalFirstFocusable) {
        event.preventDefault();
        this.gotoModalLastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.gotoModalLastFocusable) {
        event.preventDefault();
        this.gotoModalFirstFocusable.focus();
      }
    }
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

    // Remove the slide viewer component itself.
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

    // Create and insert preview slide as the first slide
    if (this.slides.length > 0) {
      const previewSlide = this.thumbnailManager.createPreviewSlide();
      this.slides.unshift(previewSlide);
    }

    this.totalSlidesEl.textContent = this.slides.length.toString();
    this.mobileManager.updateMobileElements();

    // Update input max values
    this.slideInput.setAttribute('max', this.slides.length.toString());
    this.gotoInput.setAttribute('max', this.slides.length.toString());

    this.tocManager.createTableOfContents();
  }

  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
      this.showSlide(index);
      this.tocManager.updateTocSelection();
      this.updateProgress();
    }
  }

  updateProgress() {
    if (!this.progressFill || this.slides.length === 0) return;

    let progress = 0;

    if (this.isReadingMode) {
      // For reading mode, calculate based on scroll position
      const slideContent = this.slideContent;
      if (slideContent) {
        const scrollTop = slideContent.scrollTop;
        const scrollHeight = slideContent.scrollHeight;
        const clientHeight = slideContent.clientHeight;
        progress = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
      }
    } else {
      // For slide mode, calculate based on current slide
      progress = ((this.currentSlide + 1) / this.slides.length) * 100;
    }

    const progressValue = Math.min(100, Math.max(0, progress));
    this.progressFill.style.width = `${progressValue}%`;
    
    // Update ARIA attributes for progress bar
    if (this.progressFill.parentElement) {
      this.progressFill.parentElement.setAttribute('aria-valuenow', Math.round(progressValue));
      this.progressFill.parentElement.setAttribute('aria-valuetext', 
        this.isReadingMode ? 
          `${Math.round(progressValue)}% through current slide` : 
          `Slide ${this.currentSlide + 1} of ${this.slides.length}`
      );
    }
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

    this.prevBtn.addEventListener('click', (event) => {
      console.log('Prev button clicked');
      event.preventDefault();
      event.stopPropagation();
      this.previousSlide();
    });

    this.nextBtn.addEventListener('click', (event) => {
      console.log('Next button clicked');
      event.preventDefault();
      event.stopPropagation();
      this.nextSlide();
    });

    // Fallback: Also add event listener using direct onclick
    this.nextBtn.onclick = (event) => {
      console.log('Next button onclick fired');
      event.preventDefault();
      event.stopPropagation();
      this.nextSlide();
    };

    // Try to intercept ESC key at document level before any other handlers
    const escHandler = (event) => {
      if (event.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        const gotoModalOpen = !this.gotoModal.classList.contains('hidden');
        const slideInputActive = !this.slideInput.hasAttribute('readonly');

        if (gotoModalOpen || slideInputActive) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          // Close the modal/input
          if (gotoModalOpen) {
            this.closeGotoModal();
          } else if (slideInputActive) {
            this.deactivateSlideInput();
          }

          // Immediately re-enter fullscreen if it was exited
          setTimeout(() => {
            if (!this.fullscreenManager.isFullscreen()) {
              this.fullscreenManager.requestFullscreen();
            }
          }, 100);

          return false;
        }
      }
    };

    // Add multiple event listeners with different priorities
    document.addEventListener('keydown', escHandler, true);
    window.addEventListener('keydown', escHandler, true);
    document.documentElement.addEventListener('keydown', escHandler, true);

    // Emergency escape for goto modal
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.gotoModal.classList.contains('hidden')) {
        console.log('Emergency escape for goto modal');
        this.closeGotoModal();
        return;
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (!this.modal.classList.contains('hidden')) {
        // Don't trigger shortcuts when search input, goto input, or search modal input is focused
        if ((this.searchManager.searchInput && document.activeElement === this.searchManager.searchInput) ||
            (this.gotoInput && document.activeElement === this.gotoInput) ||
            (this.searchManager.searchModalInput && document.activeElement === this.searchManager.searchModalInput)) {
          return;
        }

        // Don't trigger navigation shortcuts when in reading mode
        if (this.isReadingMode) {
          // Allow Escape and search shortcuts in reading mode
          if (event.key === 'Escape') {
            // Only close slideshow if no goto inputs are open
            if (this.gotoModal.classList.contains('hidden') &&
                this.slideInput.hasAttribute('readonly')) {
              event.preventDefault();
              this.closeSlideshow();
            }
          } else if ((event.key === '/' || event.key === 'f' || event.key === 'F') &&
                     this.searchManager.searchModal.classList.contains('hidden') && this.gotoModal.classList.contains('hidden')) {
            event.preventDefault();
            this.searchManager.openSearchModal();
          } else if ((event.key === 'l' || event.key === 'L') &&
                     this.searchManager.searchModal.classList.contains('hidden') && this.gotoModal.classList.contains('hidden')) {
            event.preventDefault();
            this.laserPointerManager.toggle();
          } else if ((event.key === 's' || event.key === 'S') &&
                     this.searchManager.searchModal.classList.contains('hidden') && this.gotoModal.classList.contains('hidden') &&
                     this.laserPointerManager.isActive) {
            event.preventDefault();
            this.laserPointerManager.openSettingsModal();
          } else if ((event.key === 'b' || event.key === 'B') &&
                     this.searchManager.searchModal.classList.contains('hidden') && this.gotoModal.classList.contains('hidden')) {
            if (this.bookmarkManager.handleKeyPress(event)) {
              // Event was handled by bookmark manager
            }
          }
          return;
        }

        switch(event.key) {
          case 'Escape':
            // Only close slideshow if no goto inputs are open
            if (this.gotoModal.classList.contains('hidden') &&
                this.slideInput.hasAttribute('readonly')) {
              event.preventDefault();
              this.closeSlideshow();
            }
            break;
          case 'ArrowLeft':
          case 'PageUp':
            if (this.gotoModal.classList.contains('hidden')) {
              event.preventDefault();
              this.previousSlide();
            }
            break;
          case 'ArrowRight':
          case 'PageDown':
            if (this.gotoModal.classList.contains('hidden')) {
              event.preventDefault();
              this.nextSlide();
            }
            break;
          case 'g':
          case 'G':
            if (this.gotoModal.classList.contains('hidden')) {
              event.preventDefault();
              this.openGotoModal();
            }
            break;
          case '/':
          case 'f':
          case 'F':
            if (this.searchManager.searchModal.classList.contains('hidden') && this.gotoModal.classList.contains('hidden')) {
              event.preventDefault();
              this.searchManager.openSearchModal();
            }
            break;
          case 'Home':
            if (this.gotoModal.classList.contains('hidden')) {
              event.preventDefault();
              this.goToSlide(0); // Go to slide overview (first slide)
            }
            break;
          case 'End':
            if (this.gotoModal.classList.contains('hidden')) {
              event.preventDefault();
              this.goToSlide(this.slides.length - 1); // Go to last slide
            }
            break;
          case 'l':
          case 'L':
            if (this.gotoModal.classList.contains('hidden') && this.searchManager.searchModal.classList.contains('hidden')) {
              event.preventDefault();
              this.laserPointerManager.toggle();
            }
            break;
          case 's':
          case 'S':
            if (this.gotoModal.classList.contains('hidden') && this.searchManager.searchModal.classList.contains('hidden') &&
                this.laserPointerManager.isActive) {
              event.preventDefault();
              this.laserPointerManager.openSettingsModal();
            }
            break;
          case 'b':
          case 'B':
            if (this.gotoModal.classList.contains('hidden') && this.searchManager.searchModal.classList.contains('hidden')) {
              if (this.bookmarkManager.handleKeyPress(event)) {
                // Event was handled by bookmark manager
              }
            }
            break;
        }
      }
    });

    // Close modal when clicking outside
    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.closeSlideshow();
      }
    });

    // Clickable counter functionality
    this.slideCounter.addEventListener('click', (event) => {
      if (event.target === this.slideCounter || this.slideCounter.contains(event.target)) {
        this.activateSlideInput();
      }
    });

    // Right-click context menu for counter
    this.slideCounter.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.openGotoModal();
    });

    // Slide input functionality
    this.slideInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.goToSlideFromInput(this.slideInput);
      } else if (e.key === 'Escape') {
        this.deactivateSlideInput();
      }
    });

    // Handle spinner buttons and direct input changes
    this.slideInput.addEventListener('input', () => {
      if (!this.slideInput.hasAttribute('readonly')) {
        // Small delay to allow for rapid clicking of spinner buttons
        clearTimeout(this.slideInputTimeout);
        this.slideInputTimeout = setTimeout(() => {
          this.goToSlideFromInput(this.slideInput);
        }, 500);
      }
    });

    this.slideInput.addEventListener('change', () => {
      if (!this.slideInput.hasAttribute('readonly')) {
        clearTimeout(this.slideInputTimeout);
        this.goToSlideFromInput(this.slideInput);
      }
    });

    this.slideInput.addEventListener('blur', () => {
      clearTimeout(this.slideInputTimeout);
      this.deactivateSlideInput();
    });

    // Goto modal functionality
    if (this.gotoConfirm) {
      this.gotoConfirm.addEventListener('click', () => {
        console.log('Goto confirm clicked');
        this.goToSlideFromInput(this.gotoInput);
      });
    } else {
      console.error('gotoConfirm button not found!');
    }

    if (this.gotoCancel) {
      this.gotoCancel.addEventListener('click', () => {
        console.log('Goto cancel clicked');
        this.closeGotoModal();
      });
    } else {
      console.error('gotoCancel button not found!');
    }

    this.gotoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.goToSlideFromInput(this.gotoInput);
      } else if (e.key === 'Escape') {
        this.closeGotoModal();
      }
    });

    // Close goto modal when clicking outside OR on the modal itself
    this.gotoModal.addEventListener('click', (event) => {
      console.log('Goto modal clicked', event.target);
      if (event.target === this.gotoModal || event.target.closest('.fb-slide__goto-modal') === this.gotoModal) {
        this.closeGotoModal();
      }
    });
  }

    openSlideshow() {
    if (this.slides.length === 0) return;

    // Store the currently focused element to restore later
    this.previousActiveElement = document.activeElement;

    this.currentSlide = 0;
    // Move modal to document body to escape stacking context
    document.body.appendChild(this.modal);
    this.modal.classList.remove('hidden');
    
    // If reading mode was active when modal was closed, reapply it
    if (this.isReadingMode) {
      this.readingModeManager.applyReadingMode();
    } else {
      this.showSlide(0);
    }
    
    this.updateProgress();
    document.body.style.overflow = 'hidden';

    // Apply saved font size when slideshow opens
    this.fontManager.applyFontSize();

    // Apply saved theme when slideshow opens
    this.themeManager.applyTheme();

    // Re-bind click events for thumbnails after slideshow opens
    setTimeout(() => {
      this.thumbnailManager.rebindThumbnailEvents();
    }, 500);

    // Request fullscreen mode
    this.fullscreenManager.requestFullscreen();

    // Setup focus management
    this.updateFocusableElements();
    
    // Add focus trap event listener
    this.modal.addEventListener('keydown', this.trapFocus.bind(this));
    
    // Focus the first focusable element or close button
    setTimeout(() => {
      this.nextBtn.style.pointerEvents = 'auto';
      this.prevBtn.style.pointerEvents = 'auto';
      
      // Set initial focus to close button for immediate accessibility
      if (this.closeBtn) {
        this.closeBtn.focus();
      } else if (this.firstFocusableElement) {
        this.firstFocusableElement.focus();
      }
    }, 200);

    // Announce slideshow opening
    this.announceSlideChange(1, this.slides.length);
  }

  closeSlideshow() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = '';

    // Remove focus trap event listener
    this.modal.removeEventListener('keydown', this.trapFocus.bind(this));

    // Restore focus to the element that was focused before opening
    if (this.previousActiveElement && this.previousActiveElement.focus) {
      this.previousActiveElement.focus();
    }

    // Clear search when closing slideshow
    if (this.searchManager.searchInput && this.searchManager.searchInput.value.trim()) {
      this.searchManager.clearSearch();
    }

    // Deactivate laser pointer when closing slideshow
    if (this.laserPointerManager.isActive) {
      this.laserPointerManager.deactivate();
    }

    // Exit fullscreen if currently in fullscreen
    this.fullscreenManager.exitFullscreen();

    // Announce slideshow closing
    this.ariaLiveRegion.textContent = 'Slideshow closed';
    setTimeout(() => {
      this.ariaLiveRegion.textContent = '';
    }, 1000);
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
      this.slideInput.value = (index + 1).toString();
      this.mobileManager.updateSlideNumber(index + 1);
      this.slideNumberIndicator.textContent = (index + 1).toString();
      
      // Hide/show slide number indicator based on mode
      if (this.isReadingMode) {
        this.slideNumberIndicator.style.display = 'none';
      } else {
        this.slideNumberIndicator.style.display = '';
      }

      // If this is the preview slide (index 0), rebind thumbnail events
      if (index === 0) {
        setTimeout(() => {
          this.thumbnailManager.rebindThumbnailEvents();
        }, 100);
      }

      // Animate the slide counter
      const slideCounter = this.slideInput.parentElement;
      slideCounter.classList.add('animating');
      setTimeout(() => {
        slideCounter.classList.remove('animating');
      }, 2000);

      // Animate the slide number indicator
      this.slideNumberIndicator.classList.add('animating');
      setTimeout(() => {
        this.slideNumberIndicator.classList.remove('animating');
      }, 600);

      // Update navigation buttons
      this.prevBtn.disabled = index === 0;
      this.nextBtn.disabled = index === this.slides.length - 1;

      // Scroll to top of slide
      const slideWrapper = this.slideContent.parentElement;
      slideWrapper.scrollTop = 0;

      this.slideContent.classList.remove('transitioning');
      this.tocManager.updateTocSelection();
      this.laserPointerManager.onSlideChange();
      this.bookmarkManager.onSlideChange();
      
      // Announce slide change for screen readers
      this.announceSlideChange(index + 1, this.slides.length);
      
      // Update focusable elements as slide content may have changed
      this.updateFocusableElements();
    }, 150);
  }

  nextSlide() {
    console.log('nextSlide called, current:', this.currentSlide, 'total:', this.slides.length);
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.showSlide(this.currentSlide);
      this.updateProgress();
    } else {
      console.log('Cannot go to next slide - already at last slide');
      // Announce when at last slide
      this.ariaLiveRegion.textContent = 'Already at last slide';
      setTimeout(() => {
        this.ariaLiveRegion.textContent = '';
      }, 1000);
    }
  }

  previousSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.showSlide(this.currentSlide);
      this.updateProgress();
    } else {
      // Announce when at first slide
      this.ariaLiveRegion.textContent = 'Already at first slide';
      setTimeout(() => {
        this.ariaLiveRegion.textContent = '';
      }, 1000);
    }
  }

  // Go to slide functionality
  goToSlideNumber(slideNumber) {
    const index = parseInt(slideNumber) - 1; // Convert to 0-based index
    if (index >= 0 && index < this.slides.length) {
      this.goToSlide(index);
      return true;
    }
    return false;
  }

  goToSlideFromInput(inputElement) {
    const slideNumber = parseInt(inputElement.value);

    // Custom validation
    if (isNaN(slideNumber) || slideNumber < 1 || slideNumber > this.slides.length) {
      // Show error feedback with helpful message
      console.log(`Invalid slide number: ${inputElement.value}. Must be between 1 and ${this.slides.length}`);

      // Add error styling using CSS classes
      const isSlideInput = inputElement.classList.contains('fb-slide__input');
      const errorClass = isSlideInput ? 'fb-slide__input-error' : 'fb-slide__goto-input-error';
      inputElement.classList.add(errorClass);

      // Show tooltip with error message
      const existingTooltip = inputElement.parentElement.querySelector('.error-tooltip');
      if (existingTooltip) existingTooltip.remove();

      const tooltip = document.createElement('div');
      tooltip.className = 'fb-slide__error-tooltip';
      tooltip.textContent = `Enter a number between 1 and ${this.slides.length}`;
      tooltip.setAttribute('role', 'alert');
      tooltip.setAttribute('aria-live', 'assertive');
      tooltip.id = `error-tooltip-${Date.now()}`;

      // Link tooltip to input for screen readers
      inputElement.setAttribute('aria-describedby', tooltip.id);
      inputElement.setAttribute('aria-invalid', 'true');

      // Ensure parent container has relative positioning
      inputElement.parentElement.classList.add('fb-slide__error-tooltip-container');
      inputElement.parentElement.appendChild(tooltip);

      setTimeout(() => {
        inputElement.classList.remove(errorClass);
        inputElement.removeAttribute('aria-describedby');
        inputElement.removeAttribute('aria-invalid');
        if (tooltip.parentElement) {
          tooltip.remove();
        }
        inputElement.parentElement.classList.remove('fb-slide__error-tooltip-container');
      }, 2000);

      inputElement.select();
      return;
    }

    // Valid input - proceed with navigation
    if (this.goToSlideNumber(slideNumber)) {
      // Announce successful navigation
      this.ariaLiveRegion.textContent = `Navigated to slide ${slideNumber}`;
      setTimeout(() => {
        this.ariaLiveRegion.textContent = '';
      }, 1000);
      
      this.deactivateSlideInput();
      this.closeGotoModal();
    }
  }

  activateSlideInput() {
    this.slideInput.removeAttribute('readonly');
    this.slideInput.value = this.currentSlide + 1;
    this.slideInput.focus();
    this.slideInput.select();
  }

  deactivateSlideInput() {
    this.slideInput.setAttribute('readonly', 'true');
    this.slideInput.value = this.currentSlide + 1;
  }

  openGotoModal() {
    // Store current focus for restoration
    this.gotoModalPreviousFocus = document.activeElement;
    
    this.gotoModal.classList.remove('hidden');
    this.gotoInput.value = this.currentSlide + 1;
    
    // Update focusable elements for goto modal
    this.updateGotoModalFocusableElements();
    
    // Add focus trap for goto modal
    this.gotoModal.addEventListener('keydown', this.trapGotoModalFocus.bind(this));
    
    this.gotoInput.focus();
    this.gotoInput.select();
    
    // Announce modal opening
    this.ariaLiveRegion.textContent = 'Go to slide dialog opened';
    setTimeout(() => {
      this.ariaLiveRegion.textContent = '';
    }, 1000);
  }

  closeGotoModal() {
    this.gotoModal.classList.add('hidden');
    this.gotoInput.value = '';
    
    // Remove focus trap
    this.gotoModal.removeEventListener('keydown', this.trapGotoModalFocus.bind(this));
    
    // Restore focus
    if (this.gotoModalPreviousFocus && this.gotoModalPreviousFocus.focus) {
      this.gotoModalPreviousFocus.focus();
    }
    
    // Announce modal closing
    this.ariaLiveRegion.textContent = 'Go to slide dialog closed';
    setTimeout(() => {
      this.ariaLiveRegion.textContent = '';
    }, 1000);
  }
}

// Initialize the SlideViewer
export function initSlideViewer() {
  console.log('Initializing SlideViewer...');
  try {
    new SlideViewer();
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
