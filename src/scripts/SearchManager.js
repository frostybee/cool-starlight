export class SearchManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.searchTimeout = null;
    this.headingPositionsCache = null;
    this.selectedResultIndex = -1;
    
    // DOM elements
    this.searchInput = document.getElementById('slide-search-input');
    this.clearSearchBtn = document.getElementById('clear-search');
    this.searchModal = document.getElementById('search-modal');
    this.searchModalInput = document.getElementById('search-modal-input');
    this.searchModalClose = document.getElementById('search-modal-close');
    this.searchModalClear = document.getElementById('search-modal-clear');
    this.searchResultsCount = document.getElementById('search-results-count');
    this.searchResultsList = document.getElementById('search-results-list');
    
    this.bindEvents();
  }

  bindEvents() {
    // Search functionality
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.performSearch(e.target.value);
      });
    }

    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Search modal functionality
    if (this.searchModalClose) {
      this.searchModalClose.addEventListener('click', () => {
        this.closeSearchModal();
      });
    }

    if (this.searchModalClear) {
      this.searchModalClear.addEventListener('click', () => {
        this.clearSearchModal();
      });
    }

    if (this.searchModalInput) {
      this.searchModalInput.addEventListener('input', (e) => {
        // Clear previous timeout
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
        }
        
        // Debounce search to avoid excessive DOM operations
        this.searchTimeout = setTimeout(() => {
          this.performSearchModal(e.target.value);
        }, 300); // Wait 300ms after user stops typing
      });

      this.searchModalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeSearchModal();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.navigateResults(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.navigateResults(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.selectCurrentResult();
        }
      });
    }

    // Close search modal when clicking outside
    if (this.searchModal) {
      this.searchModal.addEventListener('click', (event) => {
        if (event.target === this.searchModal) {
          this.closeSearchModal();
        }
      });
    }
  }

  performSearch(query) {
    // Only search if slideshow is open
    if (this.slideViewer.modal.classList.contains('hidden')) {
      return;
    }

    const trimmedQuery = query.trim().toLowerCase();

    // Show/hide clear button based on query
    if (this.clearSearchBtn) {
      if (trimmedQuery) {
        this.clearSearchBtn.classList.add('visible');
      } else {
        this.clearSearchBtn.classList.remove('visible');
      }
    }

    if (!trimmedQuery) {
      // Clear search results and show all TOC items
      this.clearSearchResults();
      return;
    }

    // Search across all slides
    this.searchAllSlides(trimmedQuery);
  }

  searchAllSlides(query) {
    const matchingSlides = [];

    // Search through all slides
    this.slideViewer.slides.forEach((slide, index) => {
      const slideText = slide.textContent.toLowerCase();
      if (slideText.includes(query)) {
        matchingSlides.push(index);
      }
    });

    console.log(`Found ${matchingSlides.length} slides matching "${query}":`, matchingSlides);

    // Update TOC to show only matching slides
    this.updateTOCWithSearchResults(matchingSlides, query);

    // If we have matches and user is not on a matching slide, go to first match
    if (matchingSlides.length > 0 && !matchingSlides.includes(this.slideViewer.currentSlide)) {
      this.slideViewer.goToSlide(matchingSlides[0]);
    }
  }

  updateTOCWithSearchResults(matchingSlides, query) {
    // Filter TOC items
    const tocItems = this.slideViewer.tocContent.querySelectorAll('.fb-slide__toc-item-container');
    console.log('Found TOC items for filtering:', tocItems.length);

    tocItems.forEach((item, index) => {
      const isMatch = matchingSlides.includes(index);

      if (isMatch) {
        // Show matching slides and add search match class
        item.style.display = '';
        item.classList.add('fb-slide__search-match');

        // Highlight the search term in the title
        const titleElement = item.querySelector('.fb-slide__toc-item-title');
        if (titleElement) {
          this.highlightText(titleElement, query);
        }
      } else {
        // Hide non-matching slides
        item.style.display = 'none';
        item.classList.remove('fb-slide__search-match');
      }
    });

    // Also filter thumbnail grid if it exists
    this.updateThumbnailGridWithSearchResults(matchingSlides);
  }

  updateThumbnailGridWithSearchResults(matchingSlides) {
    // Find thumbnail grid (usually in the first slide if it's a preview slide)
    const thumbnailGrid = this.slideViewer.slideContent.querySelector('.fb-slide__preview-grid');
    if (!thumbnailGrid) {
      console.log('No thumbnail grid found to filter');
      return;
    }

    const thumbnails = thumbnailGrid.querySelectorAll('.fb-slide__thumbnail');
    console.log('Found thumbnails for filtering:', thumbnails.length);

    thumbnails.forEach((thumbnail, index) => {
      // Note: thumbnail index might be offset by 1 if there's a preview slide
      // Check if this thumbnail corresponds to a matching slide
      const slideIndex = index + 1; // Adjust for preview slide offset
      const isMatch = matchingSlides.includes(slideIndex);

      if (isMatch) {
        // Show matching thumbnail and add search match class
        thumbnail.style.display = '';
        thumbnail.classList.add('fb-slide__search-match');
        console.log(`Thumbnail ${index} highlighted as match`);
      } else {
        // Hide non-matching thumbnail
        thumbnail.style.display = 'none';
        thumbnail.classList.remove('fb-slide__search-match');
        console.log(`Thumbnail ${index} hidden`);
      }
    });
  }

  clearThumbnailGridSearchResults() {
    const thumbnailGrid = this.slideViewer.slideContent.querySelector('.fb-slide__preview-grid');
    if (!thumbnailGrid) return;

    const thumbnails = thumbnailGrid.querySelectorAll('.fb-slide__thumbnail');
    thumbnails.forEach(thumbnail => {
      // Clear search state
      thumbnail.style.display = '';
      thumbnail.classList.remove('fb-slide__search-match');
    });
  }

  clearSearchResults() {
    const tocItems = this.slideViewer.tocContent.querySelectorAll('.fb-slide__toc-item-container');

    tocItems.forEach(item => {
      // Clear search state
      item.style.display = '';
      item.classList.remove('fb-slide__search-match');

      // Remove highlights from title
      const titleElement = item.querySelector('.fb-slide__toc-item-title');
      if (titleElement) {
        this.removeHighlights(item);
      }
    });

    // Also clear thumbnail grid
    this.clearThumbnailGridSearchResults();
  }

  highlightText(element, query) {
    if (!query) return;

    const originalText = element.dataset.originalText || element.textContent;
    element.dataset.originalText = originalText;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    const highlightedText = originalText.replace(regex, '<span class="fb-slide__search-highlight">$1</span>');
    element.innerHTML = highlightedText;
  }

  removeHighlights(container) {
    const titleElement = container.querySelector('.fb-slide__toc-item-title');
    if (!titleElement) return;

    if (titleElement.dataset.originalText) {
      titleElement.textContent = titleElement.dataset.originalText;
      delete titleElement.dataset.originalText;
    }
  }

  clearSearch() {
    this.searchInput.value = '';
    this.clearSearchBtn.classList.remove('visible');
    this.clearSearchResults();
    this.searchInput.focus();
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Search modal methods
  openSearchModal() {
    if (!this.searchModal) return;
    
    this.searchModal.classList.remove('hidden');
    this.searchModalInput.value = '';
    this.searchModalInput.focus();
    this.clearSearchModalResults();
    this.searchResultsCount.textContent = this.slideViewer.isReadingMode ? 
      'Enter a search keyword to find content' : 'Enter a search keyword to find slides';
  }

  closeSearchModal() {
    if (!this.searchModal) return;
    
    this.searchModal.classList.add('hidden');
    this.searchModalInput.value = '';
    this.clearSearchModalResults();
  }

  clearSearchModal() {
    if (!this.searchModalInput) return;
    
    this.searchModalInput.value = '';
    this.searchModalInput.focus();
    this.clearSearchModalResults();
    this.searchResultsCount.textContent = 'Enter a search keyword to find slides';
  }

  performSearchModal(query) {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      this.clearSearchModalResults();
      this.searchResultsCount.textContent = this.slideViewer.isReadingMode ? 
        'Enter a search keyword to find content' : 'Enter a search keyword to find slides';
      return;
    }

    if (this.slideViewer.isReadingMode) {
      this.performReadingModeSearch(trimmedQuery);
    } else {
      this.performSlideSearch(trimmedQuery);
    }
  }

  performSlideSearch(query) {
    // Search across all slides (original functionality)
    const matchingSlides = [];
    this.slideViewer.slides.forEach((slide, index) => {
      const slideText = slide.textContent.toLowerCase();
      if (slideText.includes(query)) {
        // Extract heading for display
        const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
        let title = `Slide ${index + 1}`;
        
        if (index === 0 && slide.className && slide.className.includes('fb-slide__preview-container')) {
          title = 'Slide Overview';
        } else if (heading) {
          title = heading.textContent.trim();
        }

        // Get a snippet of matching content
        const snippet = this.extractSearchSnippet(slideText, query);
        
        matchingSlides.push({
          index,
          title,
          snippet
        });
      }
    });

    this.displaySearchModalResults(matchingSlides, query);
  }

  performReadingModeSearch(query) {
    const readingContent = this.slideViewer.slideContent.querySelector('.fb-slide__reading-mode-content');
    
    if (!readingContent) {
      this.searchResultsCount.textContent = 'Reading mode content not found';
      this.searchResultsList.innerHTML = '';
      return;
    }

    // Clear previous highlights
    this.clearReadingModeHighlights();

    // Find all text nodes containing the query
    const matches = this.findTextMatches(readingContent, query);
    
    if (matches.length === 0) {
      this.searchResultsCount.textContent = `No matches found for "${query}"`;
      this.searchResultsList.innerHTML = '';
      const noResults = document.createElement('div');
      noResults.className = 'fb-slide__search-no-results';
      noResults.textContent = 'No content found matching your search.';
      this.searchResultsList.appendChild(noResults);
      return;
    }

    // Highlight all matches in the document
    this.highlightReadingModeMatches(matches, query);

    // Display results summary
    this.displayReadingModeResults(matches, query);
  }

  extractSearchSnippet(text, query, maxLength = 150) {
    const queryIndex = text.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex === -1) return text.substring(0, maxLength) + '...';

    // Try to center the query in the snippet
    const start = Math.max(0, queryIndex - Math.floor(maxLength / 2));
    const end = Math.min(text.length, start + maxLength);
    
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  }

  displaySearchModalResults(matchingSlides, query) {
    this.searchResultsCount.textContent = `Found ${matchingSlides.length} slide${matchingSlides.length === 1 ? '' : 's'} matching "${query}"`;
    
    this.searchResultsList.innerHTML = '';
    this.selectedResultIndex = -1;
    
    if (matchingSlides.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'fb-slide__search-no-results';
      noResults.textContent = 'No slides found matching your search.';
      this.searchResultsList.appendChild(noResults);
      return;
    }

    matchingSlides.forEach(({ index, title, snippet }, resultIndex) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'fb-slide__search-result-item';
      resultItem.dataset.resultIndex = resultIndex;
      resultItem.dataset.slideIndex = index;
      
      const titleElement = document.createElement('div');
      titleElement.className = 'fb-slide__search-result-title';
      titleElement.textContent = title;
      
      const snippetElement = document.createElement('div');
      snippetElement.className = 'fb-slide__search-result-snippet';
      snippetElement.innerHTML = this.highlightQueryInText(snippet, query);
      
      const slideNumber = document.createElement('div');
      slideNumber.className = 'fb-slide__search-result-number';
      slideNumber.textContent = `Slide ${index + 1}`;
      
      resultItem.appendChild(slideNumber);
      resultItem.appendChild(titleElement);
      resultItem.appendChild(snippetElement);
      
      // Add click handler to navigate to slide
      resultItem.addEventListener('click', () => {
        this.slideViewer.goToSlide(index);
        this.closeSearchModal();
      });
      
      this.searchResultsList.appendChild(resultItem);
    });
  }

  highlightQueryInText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="fb-slide__search-highlight">$1</mark>');
  }

  findTextMatches(container, query) {
    const matches = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip empty text nodes and nodes within script/style elements
          if (!node.textContent.trim() || 
              ['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
      const text = currentNode.textContent.toLowerCase();
      let index = 0;
      
      while ((index = text.indexOf(query, index)) !== -1) {
        matches.push({
          node: currentNode,
          index: index,
          text: currentNode.textContent
        });
        index += query.length;
      }
    }

    return matches;
  }

  highlightReadingModeMatches(matches, query) {
    // Process matches in reverse order to avoid index shifting
    const processedNodes = new Set();
    
    matches.reverse().forEach((match, matchIndex) => {
      if (processedNodes.has(match.node)) return;
      
      const originalText = match.node.textContent;
      const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
      
      // Create highlighted HTML
      const highlightedHTML = originalText.replace(regex, (matched) => {
        return `<mark class="fb-slide__reading-mode-highlight" data-match-id="${matchIndex}">${matched}</mark>`;
      });
      
      // Replace text node with highlighted content
      const span = document.createElement('span');
      span.innerHTML = highlightedHTML;
      match.node.parentNode.replaceChild(span, match.node);
      
      processedNodes.add(match.node);
    });
  }

  displayReadingModeResults(matches, query) {
    this.searchResultsCount.textContent = `Found ${matches.length} match${matches.length === 1 ? '' : 'es'} for "${query}"`;
    
    this.searchResultsList.innerHTML = '';
    this.selectedResultIndex = -1;
    
    // Create simple results for each match
    matches.forEach((match, index) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'fb-slide__search-result-item fb-slide__reading-mode-result';
      resultItem.dataset.resultIndex = index;
      
      // Find the section heading for this match
      const sectionInfo = this.findSectionHeading(match.node);
      
      const titleElement = document.createElement('div');
      titleElement.className = 'fb-slide__search-result-title';
      titleElement.textContent = sectionInfo.heading || `Match ${index + 1}`;
      
      // Create a snippet around the match
      const start = Math.max(0, match.index - 50);
      const end = Math.min(match.text.length, match.index + 100);
      const snippet = match.text.substring(start, end);
      
      const snippetElement = document.createElement('div');
      snippetElement.className = 'fb-slide__search-result-snippet';
      snippetElement.innerHTML = this.highlightQueryInText(snippet, query);
      
      const matchCountElement = document.createElement('div');
      matchCountElement.className = 'fb-slide__search-result-number';
      matchCountElement.textContent = sectionInfo.level || 'Content';
      
      resultItem.appendChild(matchCountElement);
      resultItem.appendChild(titleElement);
      resultItem.appendChild(snippetElement);
      
      // Add click handler to scroll to first match
      resultItem.addEventListener('click', () => {
        this.scrollToReadingModeMatch();
        this.closeSearchModal();
      });
      
      this.searchResultsList.appendChild(resultItem);
    });
  }

  buildHeadingCache() {
    // Build a cache of all headings with their positions for efficient lookup
    const readingContent = document.querySelector('.fb-slide__reading-mode-content');
    if (!readingContent) return [];
    
    const allHeadings = Array.from(readingContent.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return allHeadings.map(heading => ({
      element: heading,
      text: heading.textContent.trim(),
      level: heading.tagName,
      position: heading.offsetTop
    }));
  }

  findSectionHeading(textNode) {
    // Build cache if not exists or if it's stale
    if (!this.headingPositionsCache) {
      this.headingPositionsCache = this.buildHeadingCache();
    }
    
    // Start from the text node and work our way up and back to find the nearest heading
    let currentElement = textNode.parentElement;
    
    // First, check if we're inside a heading element
    while (currentElement) {
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentElement.tagName)) {
        return {
          heading: currentElement.textContent.trim(),
          level: currentElement.tagName
        };
      }
      currentElement = currentElement.parentElement;
    }
    
    // If not inside a heading, look for previous sibling headings (fast DOM traversal)
    currentElement = textNode.parentElement;
    while (currentElement) {
      // Check previous siblings for headings
      let sibling = currentElement.previousElementSibling;
      while (sibling) {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(sibling.tagName)) {
          return {
            heading: sibling.textContent.trim(),
            level: sibling.tagName
          };
        }
        sibling = sibling.previousElementSibling;
      }
      
      // Move up to parent and continue search
      currentElement = currentElement.parentElement;
    }
    
    // If no heading found in siblings, use cached heading positions
    if (this.headingPositionsCache.length === 0) {
      return { heading: 'Content', level: 'DIV' };
    }
    
    // Get text node position using efficient method
    const textNodePosition = textNode.parentElement ? textNode.parentElement.offsetTop : 0;
    
    // Find the last heading that appears before this text node using cached positions
    let closestHeading = null;
    for (const headingInfo of this.headingPositionsCache) {
      if (headingInfo.position <= textNodePosition) {
        closestHeading = headingInfo;
      } else {
        break; // Headings are in document order, so we can stop here
      }
    }
    
    if (closestHeading) {
      return {
        heading: closestHeading.text,
        level: closestHeading.level
      };
    }
    
    // Fallback - use first heading
    const firstHeading = this.headingPositionsCache[0];
    if (firstHeading) {
      return {
        heading: firstHeading.text,
        level: firstHeading.level
      };
    }
    
    return { heading: 'Content', level: 'DIV' };
  }

  scrollToReadingModeMatch() {
    // Find the highlighted element
    const highlights = document.querySelectorAll('.fb-slide__reading-mode-highlight');
    if (highlights.length > 0) {
      highlights[0].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add temporary focus styling
      highlights[0].classList.add('fb-slide__highlight-focused');
      setTimeout(() => {
        highlights[0].classList.remove('fb-slide__highlight-focused');
      }, 2000);
    }
  }

  clearReadingModeHighlights() {
    const highlights = document.querySelectorAll('.fb-slide__reading-mode-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
  }

  clearSearchModalResults() {
    if (this.searchResultsList) {
      this.searchResultsList.innerHTML = '';
    }
    this.selectedResultIndex = -1;
    
    // Clear reading mode highlights when closing/clearing search
    if (this.slideViewer.isReadingMode) {
      this.clearReadingModeHighlights();
    }
  }

  navigateResults(direction) {
    const resultItems = this.searchResultsList.querySelectorAll('.fb-slide__search-result-item:not(.fb-slide__search-no-results)');
    if (resultItems.length === 0) return;

    // Remove current selection
    if (this.selectedResultIndex >= 0 && resultItems[this.selectedResultIndex]) {
      resultItems[this.selectedResultIndex].classList.remove('fb-slide__search-result-selected');
    }

    // Update selected index
    if (direction > 0) {
      this.selectedResultIndex = (this.selectedResultIndex + 1) % resultItems.length;
    } else {
      this.selectedResultIndex = this.selectedResultIndex <= 0 ? resultItems.length - 1 : this.selectedResultIndex - 1;
    }

    // Add selection to new item
    if (resultItems[this.selectedResultIndex]) {
      resultItems[this.selectedResultIndex].classList.add('fb-slide__search-result-selected');
      resultItems[this.selectedResultIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  selectCurrentResult() {
    const resultItems = this.searchResultsList.querySelectorAll('.fb-slide__search-result-item:not(.fb-slide__search-no-results)');
    if (this.selectedResultIndex >= 0 && resultItems[this.selectedResultIndex]) {
      const selectedItem = resultItems[this.selectedResultIndex];
      
      if (selectedItem.classList.contains('fb-slide__reading-mode-result')) {
        // Reading mode - scroll to match
        this.scrollToReadingModeMatch();
      } else {
        // Slide mode - navigate to slide
        const slideIndex = parseInt(selectedItem.dataset.slideIndex);
        if (!isNaN(slideIndex)) {
          this.slideViewer.goToSlide(slideIndex);
        }
      }
      
      this.closeSearchModal();
    }
  }
}