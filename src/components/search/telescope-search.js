export default class TelescopeSearch {
	constructor() {
		this.isOpen = false;
		this.searchQuery = '';
		this.allPages = [];
		this.filteredPages = [];
		this.selectedIndex = 0;
		this.modalElement = null;
		this.searchInputElement = null;
		this.resultsContainerElement = null;

		// Bind methods to maintain 'this' context
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleSearchKeyDown = this.handleSearchKeyDown.bind(this);
		this.handleSearchInput = this.handleSearchInput.bind(this);
		this.close = this.close.bind(this);

		// Initialize
		this.fetchPages();
		this.setupListeners();
	}

	async fetchPages() {
		try {
			const response = await fetch('/pages.json');
			if (!response.ok) {
				throw new Error(`Failed to fetch pages: ${response.status}`);
			}
			this.allPages = await response.json();
			console.log('Fetched pages:', this.allPages);
		} catch (error) {
			console.error('Error fetching pages:', error);
			this.allPages = [];
		}
	}

	setupListeners() {
		// Global keyboard shortcut
		document.addEventListener('keydown', this.handleKeyDown);
	}

	handleKeyDown(event) {
		// Ctrl+P or Cmd+P to open
		if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
			event.preventDefault();
			this.open();
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
				this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredPages.length - 1);
				this.updateSelectedResult();
				break;

			case 'ArrowUp':
				event.preventDefault();
				this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
				this.updateSelectedResult();
				break;

			case 'Enter':
				event.preventDefault();
				if (this.filteredPages[this.selectedIndex]) {
					this.navigateToPage(this.filteredPages[this.selectedIndex].path);
				}
				break;

			default:
				break;
		}
	}

	handleSearchInput(event) {
		this.searchQuery = event.target.value;
		this.filterPages();
	}

	filterPages() {
		const query = this.searchQuery.toLowerCase().trim();

		if (!query) {
			this.filteredPages = [...this.allPages];
		} else {
			this.filteredPages = this.allPages.filter((page) => {
				const title = (page.title || '').toLowerCase();
				const path = (page.path || '').toLowerCase();

				return title.includes(query) || path.includes(query);
			});
		}

		this.selectedIndex = 0;
		this.renderResults();
	}

	updateSelectedResult() {
		// Remove selection from all items
		const items = this.modalElement.querySelectorAll('.telescope-result-item');
		items.forEach((item) => item.classList.remove('telescope-selected'));

		// Add selection to current item
		const selectedItem = this.modalElement.querySelector(`[data-index="${this.selectedIndex}"]`);
		if (selectedItem) {
			selectedItem.classList.add('telescope-selected');

			// Scroll into view if needed
			selectedItem.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}

	navigateToPage(path) {
		this.close();
		window.location.href = path;
	}

	open() {
		if (this.isOpen) return;

		this.isOpen = true;
		this.searchQuery = '';
		this.selectedIndex = 0;
		this.filteredPages = [...this.allPages];

		this.createModal();
		this.renderResults();

		// Focus the search input
		setTimeout(() => {
			if (this.searchInputElement) {
				this.searchInputElement.focus();
			}
		}, 10);
	}

	close() {
		if (!this.isOpen) return;

		this.isOpen = false;

		// Remove the modal from DOM
		if (this.modalElement && this.modalElement.parentNode) {
			this.modalElement.parentNode.removeChild(this.modalElement);
			this.modalElement = null;
			this.searchInputElement = null;
			this.resultsContainerElement = null;
		}
	}

	createModal() {
		// Create modal overlay
		this.modalElement = document.createElement('div');
		this.modalElement.className = 'telescope-modal-overlay';

		// Create modal content
		const modalContent = document.createElement('div');
		modalContent.className = 'telescope-modal';

		// Create search header
		const searchHeader = document.createElement('div');
		searchHeader.className = 'telescope-search-header';

		// Create search input
		this.searchInputElement = document.createElement('input');
		this.searchInputElement.className = 'telescope-search-input';
		this.searchInputElement.type = 'text';
		this.searchInputElement.placeholder = 'Search pages...';
		this.searchInputElement.addEventListener('input', this.handleSearchInput);
		this.searchInputElement.addEventListener('keydown', this.handleSearchKeyDown);

		// Create results container
		this.resultsContainerElement = document.createElement('div');
		this.resultsContainerElement.className = 'telescope-results';

		// Create footer
		const footer = document.createElement('div');
		footer.className = 'telescope-footer';

		const shortcuts = document.createElement('div');
		shortcuts.className = 'telescope-shortcuts';
		shortcuts.innerHTML = `
    <span>↑↓ to navigate</span>
    <span>↵ to select</span>
    <span>Esc to close</span>
  `;

		// Assemble the modal
		searchHeader.appendChild(this.searchInputElement);
		footer.appendChild(shortcuts);

		modalContent.appendChild(searchHeader);
		modalContent.appendChild(this.resultsContainerElement);
		modalContent.appendChild(footer);

		this.modalElement.appendChild(modalContent);

		// Add click handler to close when clicking overlay
		this.modalElement.addEventListener('click', (event) => {
			if (event.target === this.modalElement) {
				this.close();
			}
		});

		// Add to DOM
		document.body.appendChild(this.modalElement);
	}

	renderResults() {
		if (!this.resultsContainerElement) return;

		// Clear current results
		this.resultsContainerElement.innerHTML = '';

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
			const listItem = document.createElement('li');
			listItem.className = `telescope-result-item ${index === this.selectedIndex ? 'telescope-selected' : ''}`;
			listItem.setAttribute('data-index', index);

			const titleDiv = document.createElement('div');
			titleDiv.className = 'telescope-result-title';
			titleDiv.textContent = page.title || '';

			const pathDiv = document.createElement('div');
			pathDiv.className = 'telescope-result-path';
			pathDiv.textContent = page.path || '';

			listItem.appendChild(titleDiv);
			listItem.appendChild(pathDiv);

			// Add event listeners
			listItem.addEventListener('click', () => {
				this.navigateToPage(page.path);
			});

			listItem.addEventListener('mouseenter', () => {
				this.selectedIndex = index;
				this.updateSelectedResult();
			});

			resultsList.appendChild(listItem);
		});

		this.resultsContainerElement.appendChild(resultsList);
	}
}

// Initialize the TelescopeSearch when the module is imported
let telescopeInstance = null;

// Wait until the DOM is loaded
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		telescopeInstance = new TelescopeSearch();
	});
} else {
	telescopeInstance = new TelescopeSearch();
}
