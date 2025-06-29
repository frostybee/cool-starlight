import Fuse from 'fuse.js';

export default class TelescopeSearch {
  constructor() {
    this.isOpen = false;
    this.searchQuery = '';
    this.allPages = [];
    this.filteredPages = [];
    this.selectedIndex = 0;
    this.fuseInstance = null;
    this.recentPages = this.loadRecentPages();
    this.pinnedPages = this.loadPinnedPages();
    this.currentTab = 'search';
    this.debounceTimeout = null;
    this.currentOrigin = null;

    // DOM elements
    this.modalElement = document.getElementById('telescope-modal-overlay');
    this.searchInputElement = document.getElementById('telescope-search-input');
    this.resultsContainerElement = document.getElementById('telescope-results');
    this.recentResultsContainerElement = document.getElementById('telescope-recent-results');
    this.tabs = document.querySelectorAll('.telescope-tab');
    this.closeButton = document.getElementById('telescope-close-button');

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSearchKeyDown = this.handleSearchKeyDown.bind(this);
    this.handleSearchInput = this.handleSearchInput.bind(this);
    this.close = this.close.bind(this);
    this.switchTab = this.switchTab.bind(this);
    this.togglePinPage = this.togglePinPage.bind(this);

    // Initialize
    this.fetchPages();
    this.setupListeners();
  }
  async fetchPages() {
    try {
       const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${basePath}/pages.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }
      this.allPages = await response.json();
      console.log('Fetched pages:', this.allPages);

      // Get the URL from the response object:
      this.currentOrigin = new URL(response.url).origin;
      // Initialize Fuse.js after fetching pages
      this.initializeFuse();
    } catch (error) {
      console.error('Error fetching pages:', error);
      this.allPages = [];
    }
  }

  loadRecentPages() {
    const recent = localStorage.getItem('telescopeRecentPages');
    return recent ? JSON.parse(recent) : [];
  }

  loadPinnedPages() {
    const pinned = localStorage.getItem('telescopePinnedPages');
    return pinned ? JSON.parse(pinned) : [];
  }

  saveRecentPage(page) {
    // Remove if already exists
    this.recentPages = this.recentPages.filter(p => p.path !== page.path);
    // Add to beginning
    this.recentPages.unshift(page);
    // Keep only last 5 items
    this.recentPages = this.recentPages.slice(0, 5);
    // Save to localStorage
    localStorage.setItem('telescopeRecentPages', JSON.stringify(this.recentPages));
  }

  savePinnedPages() {
    localStorage.setItem('telescopePinnedPages', JSON.stringify(this.pinnedPages));
  }

  isPagePinned(path) {
    return this.pinnedPages.some(page => page.path === path);
  }

  togglePinPage(page) {
    const pageIndex = this.pinnedPages.findIndex(p => p.path === page.path);

    if (pageIndex > -1) {
      // Remove from pinned
      this.pinnedPages.splice(pageIndex, 1);
    } else {
      // Add to pinned
      this.pinnedPages.push(page);
    }

    this.savePinnedPages();

    // Refresh the UI
    this.renderSearchResults();
    this.renderRecentResults();
  }

  initializeFuse() {
    // Only initialize if Fuse.js is available and we have pages
    if (typeof Fuse !== 'undefined' && this.allPages.length > 0) {
      const options = {
        keys: [
          { name: 'title', weight: 1.0 },
          { name: 'description', weight: 0.75 },
          { name: 'path', weight: 0.5 },
        ],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
        useExtendedSearch: true,
        includeMatches: true,
        minMatchCharLength: 2
      };

      this.fuseInstance = new Fuse(this.allPages, options);
    } else {
      console.warn('Fuse.js not available or no pages to index');
    }
  }

  // Debounce function to limit the rate at which a function can fire.
  // This is to limit the number of times the search function is called.
  debounce(callback, wait) {
    return (event) => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => callback.call(this, event), wait);
    };
  }

  setupListeners() {
    // Global keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown);

    // Add event listeners to the search input
    if (this.searchInputElement) {
      // Use debounced version of handleSearchInput to prevent excessive searches
      //TODO: this waiting time should be tested and changed to a better value.
      // 200ms is a good starting point for debouncing.
      const debouncedSearchInput = this.debounce(this.handleSearchInput, 200);
      this.searchInputElement.addEventListener('input', debouncedSearchInput);
      this.searchInputElement.addEventListener('keydown', this.handleSearchKeyDown);
    }

    // Add click handler to close when clicking overlay
    if (this.modalElement) {
      this.modalElement.addEventListener('click', (event) => {
        if (event.target === this.modalElement) {
          this.close();
        }
      });
    }

    // Button to open telescope search.
    const openButton = document.getElementById('open-telescope');
    if (openButton) {
      openButton.addEventListener('click', () => this.open());
    }

    // Add tab switching listeners
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Add close button listener
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.close());
    }
  }

  handleKeyDown(event) {
    // Ctrl+P or Cmd+P to open
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      this.open();
    }

    // Space to show recent
    if (event.key === ' ' && this.isOpen) {
      event.preventDefault();
      this.renderRecentResults();
    }

    // Escape to close
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  handleSearchKeyDown(event) {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        // Account for all items in the search view
        const pinnedCount = this.currentTab === 'search' ? this.pinnedPages.length : 0;
        const recentCount = this.currentTab === 'search'
          ? Math.min(this.recentPages.filter(p => !this.isPagePinned(p.path)).length, 5)
          : 0;

        // Use the same filtering approach as in renderSearchResults and selectCurrentItem
        const pinnedPaths = this.pinnedPages.map(p => p.path);
        const recentPaths = this.recentPages.map(p => p.path);
        const searchCount = this.currentTab === 'search'
          ? this.filteredPages.filter(p =>
            !pinnedPaths.includes(p.path) && !recentPaths.includes(p.path)
          ).length
          : this.filteredPages.length;

        const totalItems = pinnedCount + recentCount + searchCount;
        this.selectedIndex = (this.selectedIndex + 1) % (totalItems || 1);
        this.updateSelectedResult();
        break;

      case 'ArrowUp':
        event.preventDefault();
        // Similar calculation for up arrow
        const pCount = this.currentTab === 'search' ? this.pinnedPages.length : 0;
        const rCount = this.currentTab === 'search'
          ? Math.min(this.recentPages.filter(p => !this.isPagePinned(p.path)).length, 5)
          : 0;

        // Use the same filtering approach as in renderSearchResults and selectCurrentItem
        const pPaths = this.pinnedPages.map(p => p.path);
        const rPaths = this.recentPages.map(p => p.path);
        const sCount = this.currentTab === 'search'
          ? this.filteredPages.filter(p =>
            !pPaths.includes(p.path) && !rPaths.includes(p.path)
          ).length
          : this.filteredPages.length;

        const total = pCount + rCount + sCount;
        this.selectedIndex = (this.selectedIndex - 1 + (total || 1)) % (total || 1);
        this.updateSelectedResult();
        break;

      case 'Enter':
        event.preventDefault();
        this.selectCurrentItem();
        break;

      default:
        break;
    }
  }

  handleSearchInput(event) {
    this.searchQuery = event.target.value;
    if (this.currentTab === 'recent') {
      // Filter recent pages
      const filteredRecent = this.recentPages.filter(page =>
        page.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        page.path.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (page.description && page.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
      );
      this.filteredPages = filteredRecent;
      this.renderRecentResults();
    } else {
      // Filter all pages
      this.filterPages();
    }
  }

  filterPages() {
    const query = this.searchQuery.trim();

    if (!query) {
      this.filteredPages = [...this.allPages];
    } else if (this.fuseInstance) {
      // Fuse.js is available and initialized.
      // We now use it for fuzzy search.
      const searchResults = this.fuseInstance.search(query);

      // Sort results by score (lower score = better match)
      searchResults.sort((a, b) => a.score - b.score);

      // Extract just the items after sorting
      this.filteredPages = searchResults.map(result => {
        // You could also store the score on the item for display purposes if needed
        // result.item._searchScore = result.score;
        return result.item;
      });
    } else {
      // Fallback to basic filtering if Fuse.js is not available
      const lowerQuery = query.toLowerCase();
      this.filteredPages = this.allPages.filter(page => {
        const title = (page.title || '').toLowerCase();
        const path = (page.path || '').toLowerCase();
        const description = (page.description || '').toLowerCase();

        return title.includes(lowerQuery) ||
          path.includes(lowerQuery) ||
          description.includes(lowerQuery);
      });
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  updateSelectedResult() {
    // Remove selection from all items
    const items = document.querySelectorAll('.telescope-result-item');
    items.forEach(item => item.classList.remove('telescope-selected'));

    // Add selection to current item
    const selectedItem = document.querySelector(`[data-index="${this.selectedIndex}"]`);
    if (selectedItem) {
      selectedItem.classList.add('telescope-selected');

      // Scroll into view if needed
      selectedItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }

  /**
   * Get the full URI for a given path (aka slug).
   * This should include the protocol, domain, and base path.
   * @param {string} path  The partial resource path to resolve.
   * @returns {string} The full URI for the resource.
   */
  getCompletePath(path) {
    // This includes protocol, domain, and port
    const origin = this.currentOrigin || window.location.origin;

    // Get the base path from the config or use a default
    // This assumes your site is at the root or has a base path like '/cool-starlight'
    const basePath = import.meta.env.BASE_URL || '/';
    // return;
    // Ensure basePath has a trailing slash for concatenation
    const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return `${origin}${normalizedBasePath}${path}`;
  }

  navigateToPage(partialPath) {
    const page = this.allPages.find(p => p.path === partialPath);
    if (page) {
      this.saveRecentPage(page);
    }
    this.close();

    const path = this.getCompletePath(partialPath);
    window.location.href = path;
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.searchQuery = '';
    this.selectedIndex = 0;
    this.filteredPages = [...this.allPages];

    if (this.modalElement) {
      this.modalElement.classList.remove('hidden');
      // Hide cursor when modal opens
      this.modalElement.classList.add('hide-cursor');

      // Switch to search tab by default
      this.switchTab('search');

      // Show cursor on mouse movement
      const handleMouseMove = () => {
        this.modalElement.classList.remove('hide-cursor');
        this.modalElement.removeEventListener('mousemove', handleMouseMove);
      };

      this.modalElement.addEventListener('mousemove', handleMouseMove);
    }

    // Render initial content
    this.renderRecentResults();
    this.renderSearchResults();

    // Focus the search input - use multiple approaches to ensure focus
    if (this.searchInputElement) {
      // Immediate focus
      this.searchInputElement.focus();

      // Backup focus with short delay
      setTimeout(() => {
        this.searchInputElement.focus();
        this.searchInputElement.value = '';

        // One more attempt with longer delay as fallback
        setTimeout(() => {
          this.searchInputElement.focus();
        }, 100);
      }, 50);
    }
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Hide the modal by adding the hidden class
    if (this.modalElement) {
      this.modalElement.classList.add('hidden');
    }
  }

  renderResults() {
    if (!this.resultsContainerElement) return;

    // Clear current results
    this.resultsContainerElement.innerHTML = '';

    // Show recent pages if no search query
    if (!this.searchQuery.trim() && this.recentPages.length > 0) {
      const recentSection = document.createElement('div');
      recentSection.className = 'telescope-recent-section';

      const recentHeader = document.createElement('div');
      recentHeader.className = 'telescope-recent-header';
      recentHeader.textContent = 'Recently Visited';
      recentSection.appendChild(recentHeader);

      const recentList = document.createElement('ul');
      recentList.className = 'telescope-result-list';

      this.recentPages.forEach((page, index) => {
        const listItem = this.createResultItem(page, index, true);
        recentList.appendChild(listItem);
      });

      recentSection.appendChild(recentList);
      this.resultsContainerElement.appendChild(recentSection);
    }

    if (this.filteredPages.length === 0) {
      // Show no results message
      const noResults = document.createElement('div');
      noResults.className = 'telescope-no-results';
      noResults.textContent = 'No pages found matching your search';
      this.resultsContainerElement.appendChild(noResults);
      return;
    }

    // Create results list
    const resultsList = document.createElement('ul');
    resultsList.className = 'telescope-result-list';

    this.filteredPages.forEach((page, index) => {
      const listItem = this.createResultItem(page, index, false);
      resultsList.appendChild(listItem);
    });

    this.resultsContainerElement.appendChild(resultsList);
  }

  createResultItem(page, index, isRecent) {
    const listItem = document.createElement('li');
    listItem.className = `telescope-result-item ${index === this.selectedIndex ? 'telescope-selected' : ''}`;
    listItem.setAttribute('data-index', index);
    listItem.setAttribute('data-path', page.path);

    // Add pin button
    const isPinned = this.isPagePinned(page.path);
    const pinButton = document.createElement('button');
    pinButton.className = `telescope-pin-button ${isPinned ? 'pinned' : ''}`;
    pinButton.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"></path>
                </svg>`;
    pinButton.title = isPinned ? 'Unpin page' : 'Pin page';

    // Stop event propagation to prevent navigation and flickering
    pinButton.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.togglePinPage(page);
    });

    // Prevent hover events from bubbling and causing flickering
    pinButton.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
    });

    pinButton.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
    });

    // Single row content
    const contentRow = document.createElement('div');
    contentRow.className = 'telescope-result-content-row';

    // Title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'telescope-result-title';
    titleDiv.textContent = page.title || '';

    contentRow.appendChild(titleDiv);

    // Description (if available)
    if (page.description) {
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'telescope-result-description';
      descriptionDiv.textContent = page.description;
      contentRow.appendChild(descriptionDiv);
    }

    // Tags (if available)
    if (page.tags && page.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'telescope-result-tags';

      page.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'telescope-tag';
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });

      contentRow.appendChild(tagsDiv);
    }

    // Add content row to list item
    listItem.appendChild(contentRow);
    listItem.appendChild(pinButton);

    // Add event listeners
    listItem.addEventListener('click', () => {
      this.navigateToPage(page.path);
    });

    listItem.addEventListener('mouseenter', () => {
      this.selectedIndex = index;
      this.updateSelectedResult();
    });

    return listItem;
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update sections
    document.querySelectorAll('.telescope-section').forEach(section => {
      section.classList.toggle('active', section.id === `telescope-${tabName}-section`);
    });

    // Update search input placeholder
    this.searchInputElement.placeholder = tabName === 'recent' ? 'Filter recent pages...' : 'Search pages...';

    // Render appropriate content
    if (tabName === 'recent') {
      this.renderRecentResults();
    } else {
      this.renderSearchResults();
    }
  }

  renderRecentResults() {
    if (!this.recentResultsContainerElement) return;

    this.recentResultsContainerElement.innerHTML = '';

    if (this.recentPages.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'telescope-no-results';
      noResults.textContent = 'No recently visited pages';
      this.recentResultsContainerElement.appendChild(noResults);
      return;
    }

    const resultsList = document.createElement('ul');
    resultsList.className = 'telescope-result-list';

    this.recentPages.forEach((page, index) => {
      const listItem = this.createResultItem(page, index, true);
      resultsList.appendChild(listItem);
    });

    this.recentResultsContainerElement.appendChild(resultsList);
  }

  renderSearchResults() {
    if (!this.resultsContainerElement) return;

    this.resultsContainerElement.innerHTML = '';

    // Show pinned pages section
    if (this.pinnedPages.length > 0) {
      const pinnedSection = document.createElement('div');
      pinnedSection.className = 'telescope-pinned-section';

      const pinnedHeader = document.createElement('div');
      pinnedHeader.className = 'telescope-section-separator';
      pinnedHeader.textContent = 'Pinned Pages';
      pinnedSection.appendChild(pinnedHeader);

      const pinnedList = document.createElement('ul');
      pinnedList.className = 'telescope-result-list';

      this.pinnedPages.forEach((page, index) => {
        const listItem = this.createResultItem(page, index, false);
        pinnedList.appendChild(listItem);
      });

      pinnedSection.appendChild(pinnedList);
      this.resultsContainerElement.appendChild(pinnedSection);
    }

    // Always show recent pages section at the top
    if (this.recentPages.length > 0) {
      // Add a separator before recent if we have pinned pages
      if (this.pinnedPages.length > 0) {
        const separator = document.createElement('div');
        separator.className = 'telescope-section-separator';
        separator.textContent = 'Recently Visited';
        this.resultsContainerElement.appendChild(separator);
      } else {
        // Otherwise add a normal header
        const recentSection = document.createElement('div');
        recentSection.className = 'telescope-recent-section';

        const recentHeader = document.createElement('div');
        recentHeader.className = 'telescope-recent-header';
        recentHeader.textContent = 'Recently Visited';
        recentSection.appendChild(recentHeader);

        this.resultsContainerElement.appendChild(recentSection);
      }

      const recentList = document.createElement('ul');
      recentList.className = 'telescope-result-list';

      // Get recent pages that aren't pinned
      const nonPinnedRecent = this.recentPages.filter(
        page => !this.isPagePinned(page.path)
      );

      // Change from 3 to 5 recent items
      const pinnedCount = this.pinnedPages.length;
      nonPinnedRecent.slice(0, 5).forEach((page, index) => {
        // Calculate real index to account for pinned pages
        const realIndex = pinnedCount + index;
        const listItem = this.createResultItem(page, realIndex, true);
        recentList.appendChild(listItem);
      });

      this.resultsContainerElement.appendChild(recentList);
    }

    // Add a separator if we have both recent/pinned pages and search results
    if ((this.recentPages.length > 0 || this.pinnedPages.length > 0) &&
      this.filteredPages.length > 0) {
      const separator = document.createElement('div');
      separator.className = 'telescope-section-separator';
      separator.textContent = 'Search Results';
      this.resultsContainerElement.appendChild(separator);
    }

    // Show search results
    if (this.filteredPages.length === 0) {
      // Show no results message
      const noResults = document.createElement('div');
      noResults.className = 'telescope-no-results';
      noResults.textContent = 'No pages found matching your search';
      this.resultsContainerElement.appendChild(noResults);
      return;
    }

    const resultsList = document.createElement('ul');
    resultsList.className = 'telescope-result-list';

    // Filter out pinned and recent pages from search results to avoid duplicates
    const pinnedPaths = this.pinnedPages.map(p => p.path);
    const recentPaths = this.recentPages.map(p => p.path);
    const filteredResults = this.filteredPages.filter(
      page => !pinnedPaths.includes(page.path) && !recentPaths.includes(page.path)
    );

    filteredResults.forEach((page, index) => {
      // Calculate real index to account for pinned and recent items
      const pinnedCount = this.pinnedPages.length;
      const recentCount = Math.min(
        this.recentPages.filter(p => !this.isPagePinned(p.path)).length,
        5
      );

      const realIndex = pinnedCount + recentCount + index;
      const listItem = this.createResultItem(page, realIndex, false);
      resultsList.appendChild(listItem);
    });

    this.resultsContainerElement.appendChild(resultsList);
  }

  selectCurrentItem() {
    // Get the currently selected item directly from the DOM
    const selectedItem = document.querySelector('.telescope-result-item.telescope-selected');

    if (selectedItem && selectedItem.hasAttribute('data-path')) {
      // Navigate to the page using the path stored in the data-path attribute
      const path = selectedItem.getAttribute('data-path');
      this.navigateToPage(path);
    }
  }
}

// Initialize the TelescopeSearch when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new TelescopeSearch();
});
