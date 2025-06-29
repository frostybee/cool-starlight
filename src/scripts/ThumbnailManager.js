export class ThumbnailManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.showThumbnailsBtn = document.getElementById('show-thumbnails');
    this.showThumbnailsBtnMobile = document.getElementById('show-thumbnails-mobile');
    
    this.bindEvents();
  }

  bindEvents() {
    // Show thumbnails button event
    if (this.showThumbnailsBtn) {
      console.log('Binding click event to show thumbnails button');
      this.showThumbnailsBtn.addEventListener('click', (e) => {
        console.log('Show thumbnails button clicked!', e);
        e.preventDefault();
        e.stopPropagation();
        this.slideViewer.goToSlide(0); // Go to the first slide (thumbnails overview)
      });
    } else {
      console.warn('Show thumbnails button not found!');
    }

    if (this.showThumbnailsBtnMobile) {
      this.showThumbnailsBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        this.slideViewer.goToSlide(0);
        this.slideViewer.mobileManager.closeMobileMenu();
      });
    }
  }

  createPreviewSlide() {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'fb-slide__preview-container';

    // Create title for preview slide
    const title = document.createElement('h1');
    title.textContent = 'Slide Overview';
    previewContainer.appendChild(title);

    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'fb-slide__preview-grid';

    // Grid layout is now handled by global CSS

    // Create thumbnails for each slide (excluding the preview slide itself)
    // Since preview slide will be inserted at index 0, content slides will be at indices 1, 2, 3...
    this.slideViewer.slides.forEach((slide, index) => {
      const thumbnail = this.createSlideThumbnail(slide, index + 1); // This will be the slide index after preview insertion
      grid.appendChild(thumbnail);
    });

    previewContainer.appendChild(grid);
    return previewContainer;
  }

  createSlideThumbnail(slide, slideNumber) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'fb-slide__thumbnail';
    thumbnail.setAttribute('data-slide-number', slideNumber);

    // Store reference to the slide viewer instance
    const slideViewer = this.slideViewer;

    // Class-based styling is now handled by global CSS

    // Add slide number badge
    const badge = document.createElement('div');
    badge.className = 'fb-slide__thumbnail-badge';
    badge.textContent = slideNumber;
    // Badge styling handled by global CSS
    thumbnail.appendChild(badge);

    // Create content preview
    const content = document.createElement('div');
    content.className = 'fb-slide__thumbnail-content';
    // Content styling handled by global CSS

    // Clone the slide content
    const slideClone = slide.cloneNode(true);

    // Extract the first heading for prominent display
    const heading = slideClone.querySelector('h1, h2, h3, h4, h5, h6');
    let headingText = '';
    if (heading) {
      headingText = heading.textContent.trim();
      heading.remove(); // Remove from cloned content
    }

    // Create heading element for thumbnail
    if (headingText) {
      const thumbnailHeading = document.createElement('div');
      thumbnailHeading.className = 'fb-slide__thumbnail-heading';
      thumbnailHeading.textContent = headingText;
      // Heading styling handled by global CSS
      content.appendChild(thumbnailHeading);
    }

    // Create body content container
    const bodyContent = document.createElement('div');
    bodyContent.className = 'fb-slide__thumbnail-body';
    // Body content styling handled by global CSS

    // Remove or simplify complex elements for thumbnail
    const codeBlocks = slideClone.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      const placeholder = document.createElement('div');
      placeholder.textContent = '[Code Block]';
      placeholder.className = 'fb-slide__code-placeholder';
      block.parentNode.replaceChild(placeholder, block);
    });

    // Limit content length for thumbnail body
    const remainingTextContent = slideClone.textContent || '';
    if (remainingTextContent.length > 150) {
      slideClone.textContent = remainingTextContent.substring(0, 150) + '...';
    }

    bodyContent.appendChild(slideClone);
    content.appendChild(bodyContent);
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

    // Clickability is now handled by global CSS

    // Hover effects are now handled by global CSS

    return thumbnail;
  }

  rebindThumbnailEvents() {
    const thumbnails = document.querySelectorAll('.fb-slide__thumbnail');

    thumbnails.forEach((thumbnail) => {
      const slideNumber = parseInt(thumbnail.getAttribute('data-slide-number'));

      // Remove existing listeners by cloning the element
      const newThumbnail = thumbnail.cloneNode(true);
      thumbnail.parentNode.replaceChild(newThumbnail, thumbnail);

      // Add fresh click handler
      const clickHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.slideViewer.goToSlide(slideNumber);
      };

      newThumbnail.addEventListener('click', clickHandler);
      newThumbnail.onclick = clickHandler;

      // Hover effects are now handled by global CSS
    });
  }
}