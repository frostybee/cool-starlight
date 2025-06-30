export class TOCManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.tocSidebar = document.getElementById('slide-toc-sidebar');
    this.tocContent = document.getElementById('slide-toc-content');
    this.tocToggleBtn = document.getElementById('toggle-toc');
    this.pendingTocScrollPosition = undefined;

    this.bindEvents();
  }

  bindEvents() {
    // TOC toggle functionality.
    this.tocToggleBtn.addEventListener('click', () => {
      const wasCollapsed = this.tocSidebar.classList.contains('collapsed');
      this.tocSidebar.classList.toggle('collapsed');

      // If expanding and we have a pending scroll position, apply it.
      if (wasCollapsed && this.pendingTocScrollPosition !== undefined) {
        setTimeout(() => {
          this.tocContent.scrollTo({
            top: this.pendingTocScrollPosition,
            behavior: 'smooth'
          });
        }, 300); // Wait for expansion animation.
      }
    });

    // Click on collapsed sidebar to expand.
    this.tocSidebar.addEventListener('click', (event) => {
      if (this.tocSidebar.classList.contains('collapsed')) {
        // Don't toggle if clicking on the toggle button itself (prevent double toggle).
        if (!this.tocToggleBtn.contains(event.target)) {
          this.tocSidebar.classList.remove('collapsed');

          // Apply pending scroll position when expanding.
          if (this.pendingTocScrollPosition !== undefined) {
            setTimeout(() => {
              this.tocContent.scrollTo({
                top: this.pendingTocScrollPosition,
                behavior: 'smooth'
              });
            }, 300); // Wait for expansion animation.
          }
        }
      }
    });
  }

  createTableOfContents() {
    console.log('Creating table of contents...');
    this.tocContent.innerHTML = '';

    if (this.slideViewer.isReadingMode) {
      this.createReadingModeTOC();
    } else {
      this.createSlideModeTOC();
    }
  }

  createSlideModeTOC() {
    this.slideViewer.slides.forEach((slide, index) => {
      // Extract the first heading from each slide.
      const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
      let title = `Slide ${index + 1}`;
      let headingLevel = 'h2';

      // Special handling for the preview slide (first slide).
      if (index === 0 && slide.className && slide.className.includes('fb-slide__preview-container')) {
        // Extract title from the preview slide's h1 heading
        const previewHeading = slide.querySelector('h1');
        if (previewHeading && previewHeading.textContent.trim()) {
          title = previewHeading.textContent.trim();
        } else {
          title = 'Slide Overview'; // Fallback
        }
        headingLevel = 'h1';
      } else if (heading) {
        title = heading.textContent.trim();
        headingLevel = heading.tagName.toLowerCase();
      }

      // Create container for number + item.
      const tocItemContainer = document.createElement('div');
      tocItemContainer.className = `fb-slide__toc-item-container ${headingLevel}`;

      // Create the clickable item.
      const tocItem = document.createElement('button');
      tocItem.className = `fb-slide__toc-item ${headingLevel}`;
      tocItem.setAttribute('data-slide-index', index);

      // Create number element (inside the button).
      const numberElement = document.createElement('span');
      numberElement.className = 'fb-slide__toc-item-number';
      numberElement.textContent = (index + 1).toString();

      // Create title element with enhanced structure.
      const titleElement = document.createElement('div');
      titleElement.className = 'fb-slide__toc-item-title';
      
      // Main title
      const mainTitle = document.createElement('div');
      mainTitle.className = 'fb-slide__toc-item-main-title';
      mainTitle.textContent = title;
      
      // Meta information
      const metaElement = document.createElement('div');
      metaElement.className = 'fb-slide__toc-item-meta';
      
      // Reading time estimate
      const readingTime = document.createElement('span');
      readingTime.className = 'fb-slide__toc-reading-time';
      const wordCount = this.estimateWordCount(slide);
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
      readingTime.textContent = `${readingTimeMinutes} min`;
      
      // Bookmark indicator (if slide is bookmarked)
      const bookmarkIndicator = document.createElement('span');
      bookmarkIndicator.className = 'fb-slide__toc-bookmark-indicator';
      bookmarkIndicator.style.display = 'none'; // Hidden by default, shown when bookmarked
      bookmarkIndicator.textContent = 'Bookmarked';
      
      metaElement.appendChild(readingTime);
      metaElement.appendChild(bookmarkIndicator);
      
      titleElement.appendChild(mainTitle);
      titleElement.appendChild(metaElement);

      // Create hover preview
      const previewElement = document.createElement('div');
      previewElement.className = 'fb-slide__toc-item-preview';
      
      const previewContent = document.createElement('div');
      previewContent.className = 'fb-slide__toc-preview-content';
      
      // Extract preview text from slide content
      const slideClone = slide.cloneNode(true);
      // Remove headings from preview
      const headings = slideClone.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(h => h.remove());
      
      const previewText = slideClone.textContent?.trim() || 'No content preview available';
      previewContent.textContent = previewText.length > 200 ? 
        previewText.substring(0, 200) + '...' : previewText;
      
      previewElement.appendChild(previewContent);

      tocItem.appendChild(numberElement);
      tocItem.appendChild(titleElement);
      tocItem.appendChild(previewElement);

      tocItem.addEventListener('click', () => {
        this.slideViewer.goToSlide(index);
        tocItem.blur();
      });

      // Hover effects are now handled by global CSS.

      tocItemContainer.appendChild(tocItem);

      this.tocContent.appendChild(tocItemContainer);
      console.log('Added TOC item:', title, 'with classes:', tocItemContainer.className);
    });

    console.log('TOC items created, total:', this.slideViewer.slides.length);
    this.updateTocSelection();
    // Update bookmark indicators after TOC creation
    setTimeout(() => this.updateBookmarkIndicators(), 100);
  }

  createReadingModeTOC() {
    // Find all headings in the reading mode content.
    const readingContent = document.querySelector('.fb-slide__reading-mode-content');
    if (!readingContent) {
      console.warn('No reading mode content found for TOC generation');
      return;
    }

    const headings = readingContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log('Found headings in reading mode:', headings.length);

    headings.forEach((heading, index) => {
      const title = heading.textContent.trim();
      const headingLevel = heading.tagName.toLowerCase();

      // Create unique ID for heading if it doesn't have one.
      if (!heading.id) {
        // Create a more descriptive ID based on the heading text.
        const cleanTitle = title.toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters.
          .replace(/\s+/g, '-') // Replace spaces with hyphens.
          .slice(0, 50); // Limit length.
        heading.id = `reading-${cleanTitle}-${index}`;
      }

      console.log('Processing heading:', title, 'with ID:', heading.id);

      // Create container for number + item.
      const tocItemContainer = document.createElement('div');
      tocItemContainer.className = `fb-slide__toc-item-container ${headingLevel}`;

      // Create the clickable item.
      const tocItem = document.createElement('button');
      tocItem.className = `fb-slide__toc-item ${headingLevel}`;
      tocItem.setAttribute('data-heading-id', heading.id);

      // Create number element (inside the button).
      const numberElement = document.createElement('span');
      numberElement.className = 'fb-slide__toc-item-number';
      numberElement.textContent = (index + 1).toString();

      // Create title element with enhanced structure.
      const titleElement = document.createElement('div');
      titleElement.className = 'fb-slide__toc-item-title';
      
      // Main title
      const mainTitle = document.createElement('div');
      mainTitle.className = 'fb-slide__toc-item-main-title';
      mainTitle.textContent = title;
      
      // Meta information
      const metaElement = document.createElement('div');
      metaElement.className = 'fb-slide__toc-item-meta';
      
      // Reading time estimate for section
      const readingTime = document.createElement('span');
      readingTime.className = 'fb-slide__toc-reading-time';
      const sectionWordCount = this.estimateHeadingSectionWordCount(heading);
      const readingTimeMinutes = Math.max(1, Math.ceil(sectionWordCount / 200));
      readingTime.textContent = `${readingTimeMinutes} min`;
      
      metaElement.appendChild(readingTime);
      titleElement.appendChild(mainTitle);
      titleElement.appendChild(metaElement);

      // Create hover preview for reading mode
      const previewElement = document.createElement('div');
      previewElement.className = 'fb-slide__toc-item-preview';
      
      const previewContent = document.createElement('div');
      previewContent.className = 'fb-slide__toc-preview-content';
      
      // Extract preview text from section content
      const sectionContent = this.getSectionContentAfterHeading(heading);
      const previewText = sectionContent || 'No content preview available';
      previewContent.textContent = previewText.length > 200 ? 
        previewText.substring(0, 200) + '...' : previewText;
      
      previewElement.appendChild(previewContent);

      tocItem.appendChild(numberElement);
      tocItem.appendChild(titleElement);
      tocItem.appendChild(previewElement);

      tocItem.addEventListener('click', () => {
        this.scrollToHeading(heading.id);
        tocItem.blur();
      });

      tocItemContainer.appendChild(tocItem);
      this.tocContent.appendChild(tocItemContainer);
      console.log('Added reading mode TOC item:', title, 'with ID:', heading.id);
    });

    console.log('Reading mode TOC items created, total:', headings.length);
  }

  scrollToHeading(headingId) {
    console.log('Attempting to scroll to heading:', headingId);
    const heading = document.getElementById(headingId);

    if (heading) {
      console.log('Found heading element:', heading);

      // Find the scrollable container (the slide content area).
      const slideContent = document.querySelector('.fb-slide__content');

      if (slideContent) {
        // Get the heading's position relative to the document.
        const headingOffsetTop = this.getElementOffsetTop(heading, slideContent);
        const targetPosition = headingOffsetTop - 20; // 20px offset from top.

        console.log('Current scroll position:', slideContent.scrollTop);
        console.log('Target scroll position:', targetPosition);
        console.log('Heading offset from container:', headingOffsetTop);

        slideContent.scrollTo({
          top: Math.max(0, targetPosition), // Ensure we don't scroll to negative position.
          behavior: 'smooth'
        });
      } else {
        // Fallback to default scrollIntoView.
        console.log('Using fallback scrollIntoView');
        heading.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }

      // Update active state.
      this.updateReadingModeTocSelection(headingId);
    } else {
      console.warn('Heading not found with ID:', headingId);
    }
  }

  // Helper function to calculate element's offset relative to a container.
  getElementOffsetTop(element, container) {
    let offsetTop = 0;
    let currentElement = element;

    while (currentElement && currentElement !== container) {
      offsetTop += currentElement.offsetTop;
      currentElement = currentElement.offsetParent;
    }

    return offsetTop;
  }

  updateReadingModeTocSelection(activeHeadingId) {
    const tocItems = this.tocContent.querySelectorAll('.fb-slide__toc-item');
    tocItems.forEach(item => {
      const headingId = item.getAttribute('data-heading-id');
      const isActive = headingId === activeHeadingId;
      item.classList.toggle('active', isActive);

      if (isActive) {
        this.scrollTocToActiveItem(item);
      }
    });
  }

  updateTocSelection() {
    const tocItems = this.tocContent.querySelectorAll('.fb-slide__toc-item');
    tocItems.forEach((item, index) => {
      const isActive = index === this.slideViewer.currentSlide;
      item.classList.toggle('active', isActive);

      if (isActive) {
        // Auto-scroll the TOC to show the active item.
        this.scrollTocToActiveItem(item);
      }
      // Active/inactive styling is now handled by global CSS.
    });
  }

  scrollTocToActiveItem(activeItem) {
    if (!activeItem) {
      return;
    }

    // Always calculate and store the scroll position for the active item.
    const tocContainer = this.tocContent;
    const containerHeight = tocContainer.offsetHeight || 300; // Fallback height.
    const itemHeight = activeItem.offsetHeight || 60; // Fallback height.
    const scrollOffset = activeItem.offsetTop - (containerHeight / 2) + (itemHeight / 2);

    // Store the calculated scroll position.
    this.pendingTocScrollPosition = Math.max(0, scrollOffset);

    // Only perform the actual scroll if TOC is expanded.
    if (this.tocSidebar.classList.contains('collapsed')) {
      return;
    }

    // Use a small delay to ensure the DOM has updated after any transitions.
    setTimeout(() => {
      // Double-check that TOC is still expanded.
      if (this.tocSidebar.classList.contains('collapsed')) {
        return;
      }

      const containerRect = tocContainer.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // Calculate if the item is visible in the container.
      const isVisible = itemRect.top >= containerRect.top &&
                       itemRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        // Smooth scroll to the calculated position.
        tocContainer.scrollTo({
          top: this.pendingTocScrollPosition,
          behavior: 'smooth'
        });
      }
    }, 50);
  }

  // Helper function to estimate word count in a slide
  estimateWordCount(slide) {
    const textContent = slide.textContent || '';
    // Simple word count: split by whitespace and filter empty strings
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  // Helper function to estimate word count for a heading section
  estimateHeadingSectionWordCount(heading) {
    let wordCount = 0;
    let currentElement = heading.nextElementSibling;
    
    // Count words until we reach another heading of the same or higher level
    const headingLevel = parseInt(heading.tagName.charAt(1));
    
    while (currentElement) {
      const isHeading = /^H[1-6]$/.test(currentElement.tagName);
      
      if (isHeading) {
        const currentLevel = parseInt(currentElement.tagName.charAt(1));
        if (currentLevel <= headingLevel) {
          break; // Stop at same or higher level heading
        }
      }
      
      if (currentElement.textContent) {
        const words = currentElement.textContent.trim().split(/\s+/).filter(word => word.length > 0);
        wordCount += words.length;
      }
      
      currentElement = currentElement.nextElementSibling;
    }
    
    return wordCount;
  }

  // Helper function to get section content after a heading for preview
  getSectionContentAfterHeading(heading) {
    let content = '';
    let currentElement = heading.nextElementSibling;
    
    // Get content until we reach another heading of the same or higher level
    const headingLevel = parseInt(heading.tagName.charAt(1));
    
    while (currentElement && content.length < 300) {
      const isHeading = /^H[1-6]$/.test(currentElement.tagName);
      
      if (isHeading) {
        const currentLevel = parseInt(currentElement.tagName.charAt(1));
        if (currentLevel <= headingLevel) {
          break; // Stop at same or higher level heading
        }
      }
      
      if (currentElement.textContent) {
        const elementText = currentElement.textContent.trim();
        if (elementText) {
          content += (content ? ' ' : '') + elementText;
        }
      }
      
      currentElement = currentElement.nextElementSibling;
    }
    
    return content;
  }

  // Method to update bookmark indicators for TOC items
  updateBookmarkIndicators() {
    if (!this.slideViewer.bookmarkManager) return;
    
    const tocItems = this.tocContent.querySelectorAll('.fb-slide__toc-item-container');
    tocItems.forEach((container, index) => {
      const bookmarkIndicator = container.querySelector('.fb-slide__toc-bookmark-indicator');
      if (bookmarkIndicator) {
        const isBookmarked = this.slideViewer.bookmarkManager.bookmarks.has(index);
        bookmarkIndicator.style.display = isBookmarked ? 'flex' : 'none';
      }
    });
  }
}