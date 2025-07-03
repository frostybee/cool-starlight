export class FullscreenManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.fullscreenBtn = document.getElementById('toggle-fullscreen');

    this.bindEvents();
  }

  bindEvents() {
    this.fullscreenBtn.addEventListener('click', (e) => {
      console.log('Fullscreen button clicked');
      // Prevent if this was triggered by ESC key somehow.
      if (e.detail === 0 && (e.key === 'Escape' || e.code === 'Escape')) {
        return;
      }
      this.toggleFullscreen();
    });
  }

  toggleFullscreen() {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
  }

  isFullscreen() {
    return !!(document.fullscreenElement ||
              document.mozFullScreenElement ||
              document.webkitFullscreenElement ||
              document.msFullscreenElement);
  }

  requestFullscreen() {
    const element = document.documentElement;

    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    }
  }

  exitFullscreen() {
    // Only attempt to exit fullscreen if we're actually in fullscreen mode.
    if (!this.isFullscreen()) {
      return;
    }

    try {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.log('Error attempting to exit fullscreen:', err);
        });
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen().catch(err => {
          console.log('Error attempting to exit fullscreen:', err);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(err => {
          console.log('Error attempting to exit fullscreen:', err);
        });
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen().catch(err => {
          console.log('Error attempting to exit fullscreen:', err);
        });
      }
    } catch (error) {
      console.log('Fullscreen exit not available or failed:', error);
    }
  }
}