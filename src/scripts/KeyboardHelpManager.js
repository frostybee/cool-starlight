export class KeyboardHelpManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.helpModal = null;
    this.helpButton = null;
    this.init();
  }

  init() {
    this.createHelpModal();
    this.createHelpButton();
    this.bindEvents();
  }

  createHelpModal() {
    this.helpModal = document.createElement('div');
    this.helpModal.id = 'keyboard-help-modal';
    this.helpModal.className = 'fb-slide__help-modal hidden';
    this.helpModal.innerHTML = `
      <div class="fb-slide__help-content">
        <div class="fb-slide__modal-header">
          <h3 class="fb-slide__modal-title">Keyboard Shortcuts</h3>
          <button class="fb-slide__close-btn" id="close-help-modal">✕</button>
        </div>
        <div class="fb-slide__help-body">
          <div class="fb-slide__help-section">
            <h4>Navigation</h4>
            <div class="fb-slide__help-shortcuts">
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>←</kbd><kbd>→</kbd>
                </span>
                <span class="fb-slide__help-description">Previous/Next slide</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>Page Up</kbd><kbd>Page Down</kbd>
                </span>
                <span class="fb-slide__help-description">Previous/Next slide</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>Home</kbd>
                </span>
                <span class="fb-slide__help-description">Go to first slide</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>End</kbd>
                </span>
                <span class="fb-slide__help-description">Go to last slide</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>G</kbd>
                </span>
                <span class="fb-slide__help-description">Go to specific slide</span>
              </div>
            </div>
          </div>

          <div class="fb-slide__help-section">
            <h4>Search & Tools</h4>
            <div class="fb-slide__help-shortcuts">
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>/</kbd><kbd>F</kbd>
                </span>
                <span class="fb-slide__help-description">Search slides</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>L</kbd>
                </span>
                <span class="fb-slide__help-description">Toggle laser pointer</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>T</kbd>
                </span>
                <span class="fb-slide__help-description">Cycle themes</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>S</kbd>
                </span>
                <span class="fb-slide__help-description">Laser pointer settings</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>B</kbd>
                </span>
                <span class="fb-slide__help-description">Bookmark current slide</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>Shift</kbd><kbd>B</kbd>
                </span>
                <span class="fb-slide__help-description">Toggle bookmarks panel</span>
              </div>
            </div>
          </div>

          <div class="fb-slide__help-section">
            <h4>General</h4>
            <div class="fb-slide__help-shortcuts">
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>Esc</kbd>
                </span>
                <span class="fb-slide__help-description">Close slideshow/modal</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>Shift</kbd><kbd>?</kbd>
                </span>
                <span class="fb-slide__help-description">Show this help</span>
              </div>
            </div>
          </div>

          <div class="fb-slide__help-section">
            <h4>Search Modal</h4>
            <div class="fb-slide__help-shortcuts">
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>↑</kbd><kbd>↓</kbd>
                </span>
                <span class="fb-slide__help-description">Navigate results</span>
              </div>
              <div class="fb-slide__help-shortcut">
                <span class="fb-slide__help-keys">
                  <kbd>Enter</kbd>
                </span>
                <span class="fb-slide__help-description">Select result</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append to the slideshow modal to ensure proper z-index stacking
    const slideshowModal = this.slideViewer.modal;
    if (slideshowModal) {
      slideshowModal.appendChild(this.helpModal);
    } else {
      document.body.appendChild(this.helpModal);
    }
  }

  createHelpButton() {
    // Add help button to the slide viewer modal navigation
    const slideViewer = document.getElementById('slide-viewer-modal');
    if (slideViewer) {
      const navDesktop = slideViewer.querySelector('.fb-slide__nav-desktop');
      if (navDesktop) {
        this.helpButton = document.createElement('button');
        this.helpButton.className = 'fb-slide__nav-btn fb-slide__compact-btn fb-slide__help-btn';
        this.helpButton.title = 'Keyboard shortcuts (Shift + ?)';
        this.helpButton.innerHTML = '?';
        
        // Insert before the close button
        const closeBtn = navDesktop.querySelector('#close-slideshow');
        if (closeBtn) {
          navDesktop.insertBefore(this.helpButton, closeBtn);
        } else {
          navDesktop.appendChild(this.helpButton);
        }
      }
    }
  }

  bindEvents() {
    // Help button click
    if (this.helpButton) {
      this.helpButton.addEventListener('click', () => {
        this.openHelpModal();
      });
    }

    // Close button click
    const closeBtn = this.helpModal.querySelector('#close-help-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeHelpModal();
      });
    }

    // Close modal when clicking outside
    this.helpModal.addEventListener('click', (event) => {
      if (event.target === this.helpModal) {
        this.closeHelpModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Shift + ? to open help modal
      if (event.shiftKey && event.key === '?') {
        if (!this.slideViewer.modal.classList.contains('hidden')) {
          event.preventDefault();
          this.openHelpModal();
        }
      }
      
      // Escape to close help modal
      if (event.key === 'Escape' && !this.helpModal.classList.contains('hidden')) {
        event.preventDefault();
        event.stopPropagation();
        this.closeHelpModal();
      }
    });
  }

  openHelpModal() {
    if (this.helpModal) {
      this.helpModal.classList.remove('hidden');
    }
  }

  closeHelpModal() {
    if (this.helpModal) {
      this.helpModal.classList.add('hidden');
    }
  }
}