export class MobileMenuManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    
    // Mobile navigation elements
    this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    this.mobileDropdownMenu = document.getElementById('mobile-dropdown-menu');
    this.prevBtnMobile = document.getElementById('prev-slide-mobile');
    this.nextBtnMobile = document.getElementById('next-slide-mobile');
    this.slideCounterMobile = document.getElementById('slide-counter-mobile');
    this.slideInputMobile = document.getElementById('slide-input-mobile');
    this.totalSlidesMobile = document.getElementById('total-slides-mobile');
    
    // Mobile dropdown buttons
    this.decreaseFontBtnMobile = document.getElementById('slide-decrease-font-mobile');
    this.resetFontBtnMobile = document.getElementById('slide-reset-font-mobile');
    this.increaseFontBtnMobile = document.getElementById('slide-increase-font-mobile');
    this.closeBtnMobile = document.getElementById('close-slideshow-mobile');
    
    // Timeouts
    this.slideInputMobileTimeout = null;
    
    this.bindEvents();
  }

  bindEvents() {
    // Mobile navigation events
    if (this.mobileMenuToggle && this.mobileDropdownMenu) {
      this.mobileMenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleMobileMenu();
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.mobileMenuToggle.contains(e.target) && 
            !this.mobileDropdownMenu.contains(e.target)) {
          this.closeMobileMenu();
        }
      });
    }

    // Mobile navigation buttons
    if (this.prevBtnMobile) {
      this.prevBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.slideViewer.previousSlide();
      });
    }

    if (this.nextBtnMobile) {
      this.nextBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.slideViewer.nextSlide();
      });
    }

    // Mobile slide counter
    if (this.slideCounterMobile) {
      this.slideCounterMobile.addEventListener('click', (e) => {
        if (e.target === this.slideCounterMobile || this.slideCounterMobile.contains(e.target)) {
          this.activateSlideInputMobile();
        }
      });

      this.slideCounterMobile.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.slideViewer.openGotoModal();
      });
    }

    // Mobile slide input
    if (this.slideInputMobile) {
      this.slideInputMobile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.slideViewer.goToSlideFromInput(this.slideInputMobile);
        } else if (e.key === 'Escape') {
          this.deactivateSlideInputMobile();
        }
      });

      this.slideInputMobile.addEventListener('input', () => {
        if (!this.slideInputMobile.hasAttribute('readonly')) {
          clearTimeout(this.slideInputMobileTimeout);
          this.slideInputMobileTimeout = setTimeout(() => {
            this.slideViewer.goToSlideFromInput(this.slideInputMobile);
          }, 500);
        }
      });

      this.slideInputMobile.addEventListener('change', () => {
        if (!this.slideInputMobile.hasAttribute('readonly')) {
          clearTimeout(this.slideInputMobileTimeout);
          this.slideViewer.goToSlideFromInput(this.slideInputMobile);
        }
      });

      this.slideInputMobile.addEventListener('blur', () => {
        clearTimeout(this.slideInputMobileTimeout);
        this.deactivateSlideInputMobile();
      });
    }

    // Mobile dropdown buttons
    if (this.decreaseFontBtnMobile) {
      this.decreaseFontBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        this.slideViewer.fontManager.adjustFontSize(-20);
        this.closeMobileMenu();
      });
    }

    if (this.resetFontBtnMobile) {
      this.resetFontBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        this.slideViewer.fontManager.resetFontSize();
        this.closeMobileMenu();
      });
    }

    if (this.increaseFontBtnMobile) {
      this.increaseFontBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        this.slideViewer.fontManager.adjustFontSize(20);
        this.closeMobileMenu();
      });
    }

    if (this.closeBtnMobile) {
      this.closeBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        this.slideViewer.closeSlideshow();
      });
    }
  }

  // Mobile menu methods
  toggleMobileMenu() {
    if (this.mobileDropdownMenu.classList.contains('hidden')) {
      this.openMobileMenu();
    } else {
      this.closeMobileMenu();
    }
  }

  openMobileMenu() {
    this.mobileDropdownMenu.classList.remove('hidden');
  }

  closeMobileMenu() {
    this.mobileDropdownMenu.classList.add('hidden');
  }

  // Mobile slide input methods
  activateSlideInputMobile() {
    if (this.slideInputMobile) {
      this.slideInputMobile.removeAttribute('readonly');
      this.slideInputMobile.value = this.slideViewer.currentSlide + 1;
      this.slideInputMobile.focus();
      this.slideInputMobile.select();
    }
  }

  deactivateSlideInputMobile() {
    if (this.slideInputMobile) {
      this.slideInputMobile.setAttribute('readonly', 'true');
      this.slideInputMobile.value = this.slideViewer.currentSlide + 1;
    }
  }

  updateMobileElements() {
    if (this.totalSlidesMobile) {
      this.totalSlidesMobile.textContent = this.slideViewer.slides.length.toString();
    }

    // Update input max values
    if (this.slideInputMobile) {
      this.slideInputMobile.setAttribute('max', this.slideViewer.slides.length.toString());
    }
  }

  updateSlideNumber(slideNumber) {
    if (this.slideInputMobile) {
      this.slideInputMobile.value = slideNumber.toString();
    }
  }
}