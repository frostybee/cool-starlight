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
  }

  createTableOfContents() {
    console.log('Creating table of contents...');
    this.tocContent.innerHTML = '';

    this.slideViewer.slides.forEach((slide, index) => {
      // Extract the first heading from each slide
      const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
      let title = `Slide ${index + 1}`;
      let headingLevel = 'h2';

      // Special handling for the preview slide (first slide)
      if (index === 0 && slide.className && slide.className.includes('fb-slide__preview-container')) {
        title = 'Slide Overview';
        headingLevel = 'h1';
      } else if (heading) {
        title = heading.textContent.trim();
        headingLevel = heading.tagName.toLowerCase();
      }

      // Create container for number + item
      const tocItemContainer = document.createElement('div');
      tocItemContainer.className = `fb-slide__toc-item-container ${headingLevel}`;

      // Create the clickable item
      const tocItem = document.createElement('button');
      tocItem.className = `fb-slide__toc-item ${headingLevel}`;
      tocItem.setAttribute('data-slide-index', index);

      // Create number element (inside the button)
      const numberElement = document.createElement('span');
      numberElement.className = 'fb-slide__toc-item-number';
      numberElement.textContent = (index + 1).toString();

      // Create title element
      const titleElement = document.createElement('span');
      titleElement.className = 'fb-slide__toc-item-title';
      titleElement.textContent = title;

      tocItem.appendChild(numberElement);
      tocItem.appendChild(titleElement);

      tocItem.addEventListener('click', () => {
        this.slideViewer.goToSlide(index);
      });

      // Hover effects are now handled by global CSS

      tocItemContainer.appendChild(tocItem);

      this.tocContent.appendChild(tocItemContainer);
      console.log('Added TOC item:', title, 'with classes:', tocItemContainer.className);
    });

    console.log('TOC items created, total:', this.slideViewer.slides.length);
    this.updateTocSelection();
  }

  updateTocSelection() {
    const tocItems = this.tocContent.querySelectorAll('.fb-slide__toc-item');
    tocItems.forEach((item, index) => {
      const isActive = index === this.slideViewer.currentSlide;
      item.classList.toggle('active', isActive);

      if (isActive) {
        // Auto-scroll the TOC to show the active item
        this.scrollTocToActiveItem(item);
      }
      // Active/inactive styling is now handled by global CSS
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
}