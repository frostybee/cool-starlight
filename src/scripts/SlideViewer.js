class SlideViewer {
  constructor() {
    this.slides = [];
    this.currentSlide = 0;
    this.fontSize = this.loadFontSize(); // Load saved font size or use default


    this.modal = document.getElementById('slide-viewer-modal');
    this.slideContent = document.getElementById('slide-content');
    this.totalSlidesEl = document.getElementById('total-slides');
    this.slideNumberIndicator = document.getElementById('slide-number-indicator');
    this.prevBtn = document.getElementById('prev-slide');
    this.nextBtn = document.getElementById('next-slide');
    this.closeBtn = document.getElementById('close-slideshow');
    this.fullscreenBtn = document.getElementById('toggle-fullscreen');
    this.startBtn = document.getElementById('start-slideshow');
    this.decreaseFontBtn = document.getElementById('slide-decrease-font');
    this.resetFontBtn = document.getElementById('slide-reset-font');
    this.increaseFontBtn = document.getElementById('slide-increase-font');
    this.tocSidebar = document.getElementById('slide-toc-sidebar');
    this.tocContent = document.getElementById('slide-toc-content');
    this.tocToggleBtn = document.getElementById('toggle-toc');
    this.slideCounter = document.getElementById('slide-counter');
    this.slideInput = document.getElementById('slide-input');
    this.gotoModal = document.getElementById('goto-slide-modal');
    this.gotoInput = document.getElementById('goto-slide-input');
    this.gotoConfirm = document.getElementById('goto-confirm');
    this.gotoCancel = document.getElementById('goto-cancel');

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

    // Create and insert preview slide as the first slide
    if (this.slides.length > 0) {
      const previewSlide = this.createPreviewSlide();
      this.slides.unshift(previewSlide);
    }
    
    this.totalSlidesEl.textContent = this.slides.length.toString();
    
    // Update input max values
    this.slideInput.setAttribute('max', this.slides.length.toString());
    this.gotoInput.setAttribute('max', this.slides.length.toString());
    
    this.createTableOfContents();
  }

  createPreviewSlide() {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'slide-preview-container';
    
    // Create title for preview slide
    const title = document.createElement('h1');
    title.textContent = 'Slide Overview';
    previewContainer.appendChild(title);
    
    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'slide-preview-grid';
    
    // Ensure grid layout with inline styles as fallback
    grid.style.cssText = `
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
      gap: 20px !important;
      margin: 2rem 0 !important;
      padding: 1rem !important;
      width: 100% !important;
    `;
    
    // Create thumbnails for each slide (excluding the preview slide itself)
    // Since preview slide will be inserted at index 0, content slides will be at indices 1, 2, 3...
    this.slides.forEach((slide, index) => {
      const thumbnail = this.createSlideThumbnail(slide, index + 1); // This will be the slide index after preview insertion
      grid.appendChild(thumbnail);
    });
    
    previewContainer.appendChild(grid);
    return previewContainer;
  }

  createSlideThumbnail(slide, slideNumber) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'slide-thumbnail';
    thumbnail.setAttribute('data-slide-number', slideNumber);
    
    // Store reference to the slide viewer instance
    const slideViewer = this;
    
    // Add inline styles to ensure proper display
    thumbnail.style.cssText = `
      border: 2px solid var(--sl-color-gray-5);
      border-radius: 8px;
      padding: 15px;
      background: var(--sl-color-bg);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      min-height: 200px;
      display: flex !important;
      flex-direction: column !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;
    
    // Add slide number badge
    const badge = document.createElement('div');
    badge.className = 'slide-thumbnail-badge';
    badge.textContent = slideNumber;
    badge.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      width: 30px;
      height: 30px;
      background: var(--sl-color-accent);
      color: var(--sl-color-accent-text);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
    thumbnail.appendChild(badge);
    
    // Create content preview
    const content = document.createElement('div');
    content.className = 'slide-thumbnail-content';
    content.style.cssText = `
      flex: 1;
      overflow: hidden;
      font-size: 0.7rem;
      line-height: 1.3;
      color: var(--sl-color-text);
    `;
    
    // Clone and scale down the slide content
    const slideClone = slide.cloneNode(true);
    
    // Remove or simplify complex elements for thumbnail
    const codeBlocks = slideClone.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      const placeholder = document.createElement('div');
      placeholder.textContent = '[Code Block]';
      placeholder.className = 'code-placeholder';
      block.parentNode.replaceChild(placeholder, block);
    });
    
    // Limit content length for thumbnail
    const textContent = slideClone.textContent || '';
    if (textContent.length > 200) {
      slideClone.textContent = textContent.substring(0, 200) + '...';
    }
    
    content.appendChild(slideClone);
    thumbnail.appendChild(content);
    
    
    // Add click handler for navigation
    const clickHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      slideViewer.goToSlide(slideNumber);
    };
    
    // Try multiple event binding methods
    thumbnail.addEventListener('click', clickHandler);
    thumbnail.onclick = clickHandler;
    
    // Also try binding to the badge and content separately
    badge.addEventListener('click', clickHandler);
    content.addEventListener('click', clickHandler);
    
    // Ensure clickability with CSS
    thumbnail.style.pointerEvents = 'auto';
    thumbnail.style.cursor = 'pointer';
    thumbnail.style.userSelect = 'none';
    thumbnail.style.webkitUserSelect = 'none';
    
    
    // Add hover effects
    thumbnail.addEventListener('mouseenter', () => {
      thumbnail.style.transform = 'translateY(-5px)';
      thumbnail.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
      thumbnail.style.borderColor = 'var(--sl-color-accent)';
    });
    
    thumbnail.addEventListener('mouseleave', () => {
      thumbnail.style.transform = 'translateY(0)';
      thumbnail.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      thumbnail.style.borderColor = 'var(--sl-color-gray-5)';
    });
    
    return thumbnail;
  }

  createTableOfContents() {
    console.log('Creating table of contents...');
    this.tocContent.innerHTML = '';

    this.slides.forEach((slide, index) => {
      // Extract the first heading from each slide
      const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
      let title = `Slide ${index + 1}`;
      let headingLevel = 'h2';

      // Special handling for the preview slide (first slide)
      if (index === 0 && slide.className && slide.className.includes('slide-preview-container')) {
        title = 'Slide Overview';
        headingLevel = 'h1';
      } else if (heading) {
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
        width: 32px;
        height: 32px;
        background: var(--sl-color-accent);
        border-radius: 50%;
        font-size: 1rem;
        font-weight: 700;
        color: var(--sl-color-accent-text);
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
        
        // Auto-scroll the TOC to show the active item
        this.scrollTocToActiveItem(item);
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

  scrollTocToActiveItem(activeItem) {
    if (!activeItem) {
      return;
    }

    // Always calculate and store the scroll position for the active item
    const tocContainer = this.tocContent;
    const containerHeight = tocContainer.offsetHeight || 300; // Fallback height
    const itemHeight = activeItem.offsetHeight || 60; // Fallback height
    const scrollOffset = activeItem.offsetTop - (containerHeight / 2) + (itemHeight / 2);
    
    // Store the calculated scroll position
    this.pendingTocScrollPosition = Math.max(0, scrollOffset);

    // Only perform the actual scroll if TOC is expanded
    if (this.tocSidebar.classList.contains('collapsed')) {
      return;
    }

    // Use a small delay to ensure the DOM has updated after any transitions
    setTimeout(() => {
      // Double-check that TOC is still expanded
      if (this.tocSidebar.classList.contains('collapsed')) {
        return;
      }
      
      const containerRect = tocContainer.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      // Calculate if the item is visible in the container
      const isVisible = itemRect.top >= containerRect.top && 
                       itemRect.bottom <= containerRect.bottom;
      
      if (!isVisible) {
        // Smooth scroll to the calculated position
        tocContainer.scrollTo({
          top: this.pendingTocScrollPosition,
          behavior: 'smooth'
        });
      }
    }, 50);
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

    this.fullscreenBtn.addEventListener('click', (e) => {
      console.log('Fullscreen button clicked');
      // Prevent if this was triggered by ESC key somehow
      if (e.detail === 0 && (e.key === 'Escape' || e.code === 'Escape')) {
        return;
      }
      this.toggleFullscreen();
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
            if (!this.isFullscreen()) {
              this.requestFullscreen();
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

    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (!this.modal.classList.contains('hidden')) {
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
        }
      }
    });

    // Close modal when clicking outside
    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal) {
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
      const wasCollapsed = this.tocSidebar.classList.contains('collapsed');
      this.tocSidebar.classList.toggle('collapsed');
      
      // If expanding and we have a pending scroll position, apply it
      if (wasCollapsed && this.pendingTocScrollPosition !== undefined) {
        setTimeout(() => {
          this.tocContent.scrollTo({
            top: this.pendingTocScrollPosition,
            behavior: 'smooth'
          });
        }, 300); // Wait for expansion animation
      }
    });

    // Click on collapsed sidebar to expand
    this.tocSidebar.addEventListener('click', (event) => {
      if (this.tocSidebar.classList.contains('collapsed')) {
        // Don't toggle if clicking on the toggle button itself (prevent double toggle)
        if (!this.tocToggleBtn.contains(event.target)) {
          this.tocSidebar.classList.remove('collapsed');
          
          // Apply pending scroll position when expanding
          if (this.pendingTocScrollPosition !== undefined) {
            setTimeout(() => {
              this.tocContent.scrollTo({
                top: this.pendingTocScrollPosition,
                behavior: 'smooth'
              });
            }, 300); // Wait for expansion animation
          }
        }
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
    this.gotoConfirm.addEventListener('click', () => {
      this.goToSlideFromInput(this.gotoInput);
    });

    this.gotoCancel.addEventListener('click', () => {
      this.closeGotoModal();
    });

    this.gotoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.goToSlideFromInput(this.gotoInput);
      } else if (e.key === 'Escape') {
        this.closeGotoModal();
      }
    });

    // Close goto modal when clicking outside
    this.gotoModal.addEventListener('click', (event) => {
      if (event.target === this.gotoModal) {
        this.closeGotoModal();
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

    // Re-bind click events for thumbnails after slideshow opens
    setTimeout(() => {
      this.rebindThumbnailEvents();
    }, 500);

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
      this.slideInput.value = (index + 1).toString();
      this.slideNumberIndicator.textContent = (index + 1).toString();
      
      // If this is the preview slide (index 0), rebind thumbnail events
      if (index === 0) {
        setTimeout(() => {
          this.rebindThumbnailEvents();
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

  toggleFullscreen() {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
  }

  isFullscreen() {
    return !!(document.fullscreenElement || 
              document.mozFullScreenElement || 
              document.webkitFullscreenElement || 
              document.msFullscreenElement);
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
    // Only attempt to exit fullscreen if we're actually in fullscreen mode
    if (!this.isFullscreen()) {
      return;
    }
    
    try {
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
    } catch (error) {
      console.log('Fullscreen exit not available or failed:', error);
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
      inputElement.style.borderColor = '#ef4444';
      inputElement.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
      
      // Show tooltip with error message
      const existingTooltip = inputElement.parentElement.querySelector('.error-tooltip');
      if (existingTooltip) existingTooltip.remove();
      
      const tooltip = document.createElement('div');
      tooltip.className = 'error-tooltip';
      tooltip.textContent = `Enter a number between 1 and ${this.slides.length}`;
      tooltip.style.cssText = `
        position: absolute;
        top: -35px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
      `;
      inputElement.parentElement.style.position = 'relative';
      inputElement.parentElement.appendChild(tooltip);
      
      setTimeout(() => {
        inputElement.style.borderColor = '';
        inputElement.style.boxShadow = '';
        if (tooltip.parentElement) {
          tooltip.remove();
        }
      }, 2000);
      
      inputElement.select();
      return;
    }
    
    // Valid input - proceed with navigation
    if (this.goToSlideNumber(slideNumber)) {
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
    this.gotoModal.classList.remove('hidden');
    this.gotoInput.value = this.currentSlide + 1;
    this.gotoInput.focus();
    this.gotoInput.select();
  }

  closeGotoModal() {
    this.gotoModal.classList.add('hidden');
    this.gotoInput.value = '';
  }

  rebindThumbnailEvents() {
    const thumbnails = document.querySelectorAll('.slide-thumbnail');
    
    thumbnails.forEach((thumbnail) => {
      const slideNumber = parseInt(thumbnail.getAttribute('data-slide-number'));
      
      // Remove existing listeners by cloning the element
      const newThumbnail = thumbnail.cloneNode(true);
      thumbnail.parentNode.replaceChild(newThumbnail, thumbnail);
      
      // Add fresh click handler
      const clickHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.goToSlide(slideNumber);
      };
      
      newThumbnail.addEventListener('click', clickHandler);
      newThumbnail.onclick = clickHandler;
      
      // Add hover effects
      newThumbnail.addEventListener('mouseenter', () => {
        newThumbnail.style.transform = 'translateY(-5px)';
        newThumbnail.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        newThumbnail.style.borderColor = 'var(--sl-color-accent)';
      });
      
      newThumbnail.addEventListener('mouseleave', () => {
        newThumbnail.style.transform = 'translateY(0)';
        newThumbnail.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        newThumbnail.style.borderColor = 'var(--sl-color-gray-5)';
      });
    });
  }

}

// Initialize the SlideViewer
function initSlideViewer() {
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