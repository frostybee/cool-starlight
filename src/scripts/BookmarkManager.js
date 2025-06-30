export class BookmarkManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.bookmarks = new Set();
    this.storageKey = `slide-bookmarks-${window.location.pathname}`;
    
    this.bookmarkBtn = null;
    this.bookmarkPanel = null;
    this.bookmarkList = null;
    this.bookmarkToggle = null;
    
    this.init();
  }

  init() {
    this.loadBookmarks();
    this.createBookmarkUI();
    this.bindEvents();
  }

  createBookmarkUI() {
    // Create bookmark toggle button for toolbar
    this.bookmarkToggle = document.createElement('button');
    this.bookmarkToggle.className = 'fb-slide__bookmark-toggle';
    this.bookmarkToggle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="fb-slide__bookmark-count">0</span>
    `;
    this.bookmarkToggle.setAttribute('aria-label', 'Toggle bookmarks panel');
    this.bookmarkToggle.setAttribute('title', 'Bookmarks (Shift+B)');

    // Create bookmark star button for current slide
    this.bookmarkBtn = document.createElement('button');
    this.bookmarkBtn.className = 'fb-slide__bookmark-btn';
    this.bookmarkBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </svg>
    `;
    this.bookmarkBtn.setAttribute('aria-label', 'Bookmark this slide');
    this.bookmarkBtn.setAttribute('title', 'Bookmark slide (B)');

    // Create bookmark panel
    this.bookmarkPanel = document.createElement('div');
    this.bookmarkPanel.className = 'fb-slide__bookmark-panel hidden';
    this.bookmarkPanel.innerHTML = `
      <div class="fb-slide__bookmark-header">
        <h3>Bookmarks</h3>
        <button class="fb-slide__bookmark-close" aria-label="Close bookmarks panel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="fb-slide__bookmark-content">
        <div class="fb-slide__bookmark-list"></div>
        <div class="fb-slide__bookmark-empty hidden">
          <p>No bookmarks yet. Press 'B' to bookmark the current slide.</p>
        </div>
      </div>
    `;

    this.bookmarkList = this.bookmarkPanel.querySelector('.fb-slide__bookmark-list');
    this.bookmarkEmpty = this.bookmarkPanel.querySelector('.fb-slide__bookmark-empty');

    // Insert bookmark elements into the DOM
    const modal = this.slideViewer.modal;
    const slideControls = modal.querySelector('.fb-slide__controls');
    const slideHeader = modal.querySelector('.fb-slide__header');
    
    if (slideControls) {
      slideControls.insertBefore(this.bookmarkToggle, slideControls.firstChild);
    }
    
    if (slideHeader) {
      slideHeader.appendChild(this.bookmarkBtn);
    }
    
    modal.appendChild(this.bookmarkPanel);
  }

  bindEvents() {
    // Bookmark toggle button
    this.bookmarkToggle.addEventListener('click', () => {
      this.togglePanel();
    });

    // Bookmark current slide button
    this.bookmarkBtn.addEventListener('click', () => {
      this.toggleBookmark(this.slideViewer.currentSlide);
    });

    // Close panel button
    const closeBtn = this.bookmarkPanel.querySelector('.fb-slide__bookmark-close');
    closeBtn.addEventListener('click', () => {
      this.closePanel();
    });

    // Close panel when clicking outside
    this.bookmarkPanel.addEventListener('click', (event) => {
      if (event.target === this.bookmarkPanel) {
        this.closePanel();
      }
    });
  }

  loadBookmarks() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.bookmarks = new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Could not load bookmarks:', error);
      this.bookmarks = new Set();
    }
  }

  saveBookmarks() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.bookmarks]));
    } catch (error) {
      console.warn('Could not save bookmarks:', error);
    }
  }

  toggleBookmark(slideIndex) {
    if (this.bookmarks.has(slideIndex)) {
      this.removeBookmark(slideIndex);
    } else {
      this.addBookmark(slideIndex);
    }
  }

  addBookmark(slideIndex) {
    this.bookmarks.add(slideIndex);
    this.saveBookmarks();
    this.updateUI();
    this.updateBookmarksList();
    
    // Announce to screen readers
    this.slideViewer.ariaLiveRegion.textContent = `Slide ${slideIndex + 1} bookmarked`;
    setTimeout(() => {
      this.slideViewer.ariaLiveRegion.textContent = '';
    }, 1000);
  }

  removeBookmark(slideIndex) {
    this.bookmarks.delete(slideIndex);
    this.saveBookmarks();
    this.updateUI();
    this.updateBookmarksList();
    
    // Announce to screen readers
    this.slideViewer.ariaLiveRegion.textContent = `Slide ${slideIndex + 1} bookmark removed`;
    setTimeout(() => {
      this.slideViewer.ariaLiveRegion.textContent = '';
    }, 1000);
  }

  updateUI() {
    const currentSlide = this.slideViewer.currentSlide;
    const isBookmarked = this.bookmarks.has(currentSlide);
    
    // Update bookmark button
    this.bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
    this.bookmarkBtn.setAttribute('aria-label', 
      isBookmarked ? 'Remove bookmark from this slide' : 'Bookmark this slide'
    );
    
    // Update bookmark count
    const count = this.bookmarks.size;
    const countEl = this.bookmarkToggle.querySelector('.fb-slide__bookmark-count');
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'inline' : 'none';
    
    this.bookmarkToggle.setAttribute('aria-label', 
      `Toggle bookmarks panel (${count} bookmark${count !== 1 ? 's' : ''})`
    );
  }

  updateBookmarksList() {
    const sortedBookmarks = [...this.bookmarks].sort((a, b) => a - b);
    
    if (sortedBookmarks.length === 0) {
      this.bookmarkList.innerHTML = '';
      this.bookmarkEmpty.classList.remove('hidden');
      return;
    }
    
    this.bookmarkEmpty.classList.add('hidden');
    
    this.bookmarkList.innerHTML = sortedBookmarks.map(slideIndex => {
      const slide = this.slideViewer.slides[slideIndex];
      const slideNumber = slideIndex + 1;
      
      // Get preview text from slide content
      let previewText = '';
      if (slide) {
        const textContent = slide.textContent || '';
        const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
          previewText = heading.textContent.trim();
        } else {
          previewText = textContent.slice(0, 100).trim();
          if (textContent.length > 100) previewText += '...';
        }
      }
      
      return `
        <div class="fb-slide__bookmark-item" data-slide="${slideIndex}">
          <div class="fb-slide__bookmark-info">
            <div class="fb-slide__bookmark-number">Slide ${slideNumber}</div>
            <div class="fb-slide__bookmark-preview">${previewText}</div>
          </div>
          <button class="fb-slide__bookmark-remove" aria-label="Remove bookmark from slide ${slideNumber}" data-slide="${slideIndex}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    }).join('');
    
    // Bind click events for bookmark items
    this.bookmarkList.querySelectorAll('.fb-slide__bookmark-item').forEach(item => {
      const slideIndex = parseInt(item.dataset.slide);
      
      item.addEventListener('click', (event) => {
        // Don't navigate if clicking the remove button
        if (event.target.closest('.fb-slide__bookmark-remove')) {
          return;
        }
        
        this.slideViewer.goToSlide(slideIndex);
        this.closePanel();
      });
    });
    
    // Bind remove buttons
    this.bookmarkList.querySelectorAll('.fb-slide__bookmark-remove').forEach(btn => {
      const slideIndex = parseInt(btn.dataset.slide);
      
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        this.removeBookmark(slideIndex);
      });
    });
  }

  togglePanel() {
    if (this.bookmarkPanel.classList.contains('hidden')) {
      this.openPanel();
    } else {
      this.closePanel();
    }
  }

  openPanel() {
    this.bookmarkPanel.classList.remove('hidden');
    this.updateBookmarksList();
    
    // Focus first bookmark or close button
    setTimeout(() => {
      const firstBookmark = this.bookmarkList.querySelector('.fb-slide__bookmark-item');
      const closeBtn = this.bookmarkPanel.querySelector('.fb-slide__bookmark-close');
      
      if (firstBookmark) {
        firstBookmark.focus();
      } else {
        closeBtn.focus();
      }
    }, 100);
    
    // Announce panel opening
    this.slideViewer.ariaLiveRegion.textContent = 'Bookmarks panel opened';
    setTimeout(() => {
      this.slideViewer.ariaLiveRegion.textContent = '';
    }, 1000);
  }

  closePanel() {
    this.bookmarkPanel.classList.add('hidden');
    
    // Return focus to bookmark toggle
    this.bookmarkToggle.focus();
    
    // Announce panel closing
    this.slideViewer.ariaLiveRegion.textContent = 'Bookmarks panel closed';
    setTimeout(() => {
      this.slideViewer.ariaLiveRegion.textContent = '';
    }, 1000);
  }

  // Handle keyboard shortcuts
  handleKeyPress(event) {
    // 'B' key to toggle bookmark for current slide
    if (event.key === 'b' || event.key === 'B') {
      if (!event.shiftKey) {
        event.preventDefault();
        this.toggleBookmark(this.slideViewer.currentSlide);
        return true;
      }
    }
    
    // 'Shift+B' to toggle bookmarks panel
    if ((event.key === 'b' || event.key === 'B') && event.shiftKey) {
      event.preventDefault();
      this.togglePanel();
      return true;
    }
    
    return false;
  }

  // Called when slide changes to update bookmark button state
  onSlideChange() {
    this.updateUI();
  }

  // Get bookmarks for export
  exportBookmarks() {
    return {
      url: window.location.pathname,
      bookmarks: [...this.bookmarks],
      timestamp: new Date().toISOString()
    };
  }

  // Import bookmarks
  importBookmarks(data) {
    if (data.bookmarks && Array.isArray(data.bookmarks)) {
      this.bookmarks = new Set(data.bookmarks);
      this.saveBookmarks();
      this.updateUI();
      this.updateBookmarksList();
    }
  }
}