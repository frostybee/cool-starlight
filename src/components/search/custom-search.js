export default class TelescopeSearch {
  constructor() {
    this.isOpen = false;
    this.searchQuery = '';
    this.allPages = [];
    this.filteredPages = [];
    this.selectedIndex = 0;
    this.fuseInstance = null;
    this.recentPages = this.loadRecentPages();
    this.currentTab = 'search';

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

    // Initialize
    this.fetchPages();
    // this.initializeFuse();
    this.setupListeners();
  }
    async fetchPages() {
    try {
      const response = await fetch('/pages.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }
      this.allPages = await response.json();

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

  initializeFuse() {
    // Only initialize if Fuse.js is available and we have pages
    if (typeof Fuse !== 'undefined' && this.allPages.length > 0) {
      const options = {
        keys: [
          { name: 'title', weight: 1.0 },
          { name: 'headings', weight: 0.75 },
          { name: 'description', weight: 0.5 },
          { name: 'content', weight: 0.3 },
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

  setupListeners() {
    // Global keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown);

    // Add event listeners to the search input
    if (this.searchInputElement) {
      this.searchInputElement.addEventListener('input', this.handleSearchInput);
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

    // Button to open telescope
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
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
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
        // Account for potential recent items at the top when calculating total length
        const totalItems = (this.currentTab === 'search' && this.recentPages.length > 0)
          ? this.filteredPages.length + Math.min(this.recentPages.length, 5)
          : this.filteredPages.length;
        this.selectedIndex = (this.selectedIndex + 1) % totalItems;
        this.updateSelectedResult();
        break;

      case 'ArrowUp':
        event.preventDefault();
        // Account for potential recent items at the top
        const total = (this.currentTab === 'search' && this.recentPages.length > 0)
          ? this.filteredPages.length + Math.min(this.recentPages.length, 5)
          : this.filteredPages.length;
        this.selectedIndex = (this.selectedIndex - 1 + total) % total;
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
      // Use Fuse.js for fuzzy search if available
      const searchResults = this.fuseInstance.search(query);
      this.filteredPages = searchResults.map(result => result.item);
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

  navigateToPage(path) {
    const page = this.allPages.find(p => p.path === path);
    if (page) {
      this.saveRecentPage(page);
    }
    this.close();
    // For demo, just alert instead of navigating
    alert(`Navigating to: ${path}`);
    // In a real app: window.location.href = path;
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

    // Title Column
    const titleColumn = document.createElement('div');
    titleColumn.className = 'telescope-result-title-column';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'telescope-result-title';
    titleDiv.textContent = page.title || '';

    const pathDiv = document.createElement('div');
    pathDiv.className = 'telescope-result-path';
    pathDiv.textContent = page.path || '';

    titleColumn.appendChild(titleDiv);
    titleColumn.appendChild(pathDiv);

    // Preview Column
    const previewColumn = document.createElement('div');
    previewColumn.className = 'telescope-result-preview-column';

    if (page.description) {
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'telescope-result-description';
      descriptionDiv.textContent = page.description;
      previewColumn.appendChild(descriptionDiv);
    }

    if (page.tags && page.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'telescope-result-tags';

      page.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'telescope-tag';
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });

      previewColumn.appendChild(tagsDiv);
    }

    // Add columns to list item
    listItem.appendChild(titleColumn);
    listItem.appendChild(previewColumn);

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

    // Always show recent pages section at the top
    if (this.recentPages.length > 0) {
      const recentSection = document.createElement('div');
      recentSection.className = 'telescope-recent-section';

      const recentHeader = document.createElement('div');
      recentHeader.className = 'telescope-recent-header';
      recentHeader.textContent = 'Recently Visited';
      recentSection.appendChild(recentHeader);

      const recentList = document.createElement('ul');
      recentList.className = 'telescope-result-list';

      // Change from 3 to 5 recent items
      this.recentPages.slice(0, 5).forEach((page, index) => {
        const listItem = this.createResultItem(page, index, true);
        recentList.appendChild(listItem);
      });

      recentSection.appendChild(recentList);
      this.resultsContainerElement.appendChild(recentSection);
    }

    // Add a separator if we have both recent pages and search results
    if (this.recentPages.length > 0 && this.filteredPages.length > 0) {
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

    this.filteredPages.forEach((page, index) => {
      // Calculate real index to account for recent items, now up to 5
      const realIndex = this.recentPages.length > 0 ? index + Math.min(this.recentPages.length, 5) : index;
      const listItem = this.createResultItem(page, realIndex, false);
      resultsList.appendChild(listItem);
    });

    this.resultsContainerElement.appendChild(resultsList);
  }

  selectCurrentItem() {
    if (this.currentTab === 'search' && this.recentPages.length > 0 && this.selectedIndex < 5) {
      // Selected a recent item
      if (this.selectedIndex < this.recentPages.length) {
        this.navigateToPage(this.recentPages[this.selectedIndex].path);
      }
    } else {
      // Selected a regular search result
      const adjustedIndex = this.currentTab === 'search' ?
        this.selectedIndex - Math.min(this.recentPages.length, 5) :
        this.selectedIndex;

      if (this.filteredPages[adjustedIndex]) {
        this.navigateToPage(this.filteredPages[adjustedIndex].path);
      }
    }
  }
}

// Initialize the TelescopeSearch when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing TelescopeSearch');

  new TelescopeSearch();
});
