export class LaserPointerManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.highlights = [];
    this.currentTrail = null;
    this.isDrawing = false;
    this.lastPoint = null;
    this.animationFrame = null;
    
    // Customizable settings with localStorage support
    this.settings = this.loadSettings();
    
    this.settingsModal = null;
    
    this.init();
  }

  init() {
    this.createCanvas();
    this.createSettingsModal();
    this.bindEvents();
  }

  loadSettings() {
    const defaultSettings = {
      color: '#ff6b35',
      glowColor: '#ffaa44',
      thickness: 3,
      glowThickness: 6,
      duration: 1500, // milliseconds
      reverseFade: false
    };

    try {
      const saved = localStorage.getItem('laser-pointer-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new settings added in updates
        const settings = { ...defaultSettings, ...parsed };
        // Recalculate dependent values
        settings.glowThickness = settings.thickness * 2;
        settings.glowColor = this.adjustColor(settings.color, 30);
        return settings;
      }
    } catch (error) {
      console.warn('Failed to load laser pointer settings from localStorage:', error);
    }

    return defaultSettings;
  }

  saveSettings() {
    try {
      localStorage.setItem('laser-pointer-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save laser pointer settings to localStorage:', error);
    }
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'laser-pointer-canvas';
    
    this.ctx = this.canvas.getContext('2d');
    
    // Make sure we're adding to the slide content wrapper, not the main container
    const slideContentWrapper = this.slideViewer.slideContent.parentElement;
    slideContentWrapper.appendChild(this.canvas);
  }

  createSettingsModal() {
    this.settingsModal = document.createElement('div');
    this.settingsModal.className = 'laser-pointer-settings-modal';
    this.settingsModal.innerHTML = `
      <div class="laser-pointer-settings-content">
        <div class="laser-pointer-settings-header">
          <h3 class="laser-pointer-settings-title">🔴 Laser Pointer Settings</h3>
          <button class="laser-pointer-settings-close">✕</button>
        </div>
        
        <div class="laser-pointer-setting-group">
          <label class="laser-pointer-setting-label">Color</label>
          <input type="color" class="laser-pointer-color-picker" value="${this.settings.color}">
          <div class="laser-pointer-setting-description">Choose the laser pointer color</div>
        </div>
        
        <div class="laser-pointer-setting-group">
          <label class="laser-pointer-setting-label">Thickness</label>
          <input type="range" class="laser-pointer-slider laser-pointer-thickness-slider" 
                 min="1" max="10" step="1" value="${this.settings.thickness}">
          <span class="laser-pointer-slider-value">${this.settings.thickness}px</span>
          <div class="laser-pointer-setting-description">Adjust the line thickness</div>
        </div>
        
        <div class="laser-pointer-setting-group">
          <label class="laser-pointer-setting-label">Fade Duration</label>
          <input type="range" class="laser-pointer-slider laser-pointer-duration-slider" 
                 min="500" max="5000" step="100" value="${this.settings.duration}">
          <span class="laser-pointer-slider-value">${this.settings.duration / 1000}s</span>
          <div class="laser-pointer-setting-description">How long lines stay visible</div>
        </div>
        
        <div class="laser-pointer-setting-group">
          <label class="laser-pointer-setting-label">Reverse Fade</label>
          <label class="laser-pointer-toggle">
            <input type="checkbox" class="laser-pointer-reverse-fade" ${this.settings.reverseFade ? 'checked' : ''}>
            <span class="laser-pointer-toggle-slider"></span>
          </label>
          <div class="laser-pointer-setting-description">Lines undraw from end to start</div>
        </div>
        
        <div class="laser-pointer-preview">
          <div>Preview:</div>
          <div class="laser-pointer-preview-line" style="background: ${this.settings.color}; height: ${this.settings.thickness}px; width: 200px;"></div>
        </div>
      </div>
    `;
    
    // Append to the slideshow modal to ensure proper z-index stacking
    const slideshowModal = this.slideViewer.modal;
    if (slideshowModal) {
      slideshowModal.appendChild(this.settingsModal);
    } else {
      document.body.appendChild(this.settingsModal);
    }
    this.bindSettingsEvents();
  }

  bindSettingsEvents() {
    const colorPicker = this.settingsModal.querySelector('.laser-pointer-color-picker');
    const thicknessSlider = this.settingsModal.querySelector('.laser-pointer-thickness-slider');
    const durationSlider = this.settingsModal.querySelector('.laser-pointer-duration-slider');
    const reverseFadeToggle = this.settingsModal.querySelector('.laser-pointer-reverse-fade');
    const closeBtn = this.settingsModal.querySelector('.laser-pointer-settings-close');
    const previewLine = this.settingsModal.querySelector('.laser-pointer-preview-line');

    // Color picker
    colorPicker.addEventListener('change', (e) => {
      this.settings.color = e.target.value;
      this.settings.glowColor = this.adjustColor(e.target.value, 30);
      this.updatePreview();
      this.saveSettings();
    });

    // Thickness slider
    thicknessSlider.addEventListener('input', (e) => {
      this.settings.thickness = parseInt(e.target.value);
      this.settings.glowThickness = this.settings.thickness * 2;
      const valueSpan = thicknessSlider.nextElementSibling;
      valueSpan.textContent = `${this.settings.thickness}px`;
      this.updatePreview();
      this.saveSettings();
    });

    // Duration slider
    durationSlider.addEventListener('input', (e) => {
      this.settings.duration = parseInt(e.target.value);
      const valueSpan = durationSlider.nextElementSibling;
      valueSpan.textContent = `${this.settings.duration / 1000}s`;
      this.saveSettings();
    });

    // Reverse fade toggle
    reverseFadeToggle.addEventListener('change', (e) => {
      this.settings.reverseFade = e.target.checked;
      this.saveSettings();
    });

    // Close button
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.closeSettingsModal();
    });

    // Close on outside click
    this.settingsModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === this.settingsModal) {
        this.closeSettingsModal();
      }
    });

    // Prevent laser pointer drawing when interacting with settings
    const settingsContent = this.settingsModal.querySelector('.laser-pointer-settings-content');
    settingsContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    settingsContent.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    settingsContent.addEventListener('mousemove', (e) => {
      e.stopPropagation();
    });
  }

  updatePreview() {
    const previewLine = this.settingsModal.querySelector('.laser-pointer-preview-line');
    previewLine.style.background = this.settings.color;
    previewLine.style.height = `${this.settings.thickness}px`;
  }

  adjustColor(hex, amount) {
    // Convert hex to RGB, adjust brightness, return hex
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  openSettingsModal() {
    this.settingsModal.classList.add('visible');
    
    // Add escape key handler
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.settingsModal.classList.contains('visible')) {
        e.preventDefault();
        e.stopPropagation();
        this.closeSettingsModal();
      }
    };
    document.addEventListener('keydown', this.escapeHandler, true);
  }

  closeSettingsModal() {
    this.settingsModal.classList.remove('visible');
    
    // Remove escape key handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler, true);
      this.escapeHandler = null;
    }
  }

  bindEvents() {
    // Use the content wrapper for mouse events to capture the entire area
    const contentWrapper = this.slideViewer.slideContent.parentElement;
    
    // Click to start drawing
    contentWrapper.addEventListener('mousedown', (e) => {
      if (!this.isActive || this.settingsModal.classList.contains('visible')) return;
      e.preventDefault();
      e.stopPropagation();
      this.startDrawing(e);
    });

    // Continue drawing while mouse is pressed and moving
    contentWrapper.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.isDrawing || this.settingsModal.classList.contains('visible')) return;
      e.preventDefault();
      this.updateTrail(e);
    });

    // Stop drawing when mouse is released
    contentWrapper.addEventListener('mouseup', (e) => {
      if (!this.isActive || this.settingsModal.classList.contains('visible')) return;
      e.preventDefault();
      this.stopDrawing();
    });

    // Stop drawing when mouse leaves the area
    contentWrapper.addEventListener('mouseleave', () => {
      if (!this.isActive) return;
      this.stopDrawing();
    });

    // Prevent context menu when laser pointer is active
    contentWrapper.addEventListener('contextmenu', (e) => {
      if (this.isActive) {
        e.preventDefault();
      }
    });
  }

  toggle() {
    this.isActive = !this.isActive;
    
    if (this.isActive) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  activate() {
    this.canvas.classList.add('active');
    this.slideViewer.slideContent.parentElement.classList.add('laser-pointer-mode');
    this.resizeCanvas();
    
    // Show visual indicator
    this.showModeIndicator();
  }

  deactivate() {
    this.canvas.classList.remove('active');
    this.slideViewer.slideContent.parentElement.classList.remove('laser-pointer-mode');
    this.isDrawing = false;
    this.lastPoint = null;
    
    // Stop animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Hide visual indicator
    this.hideModeIndicator();
  }

  resizeCanvas() {
    const rect = this.slideViewer.slideContent.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.redrawHighlights();
  }

  redrawHighlights() {
    if (!this.ctx) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Redraw all existing highlights
    this.highlights.forEach(segment => {
      this.drawTrailSegment(segment);
    });
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.slideViewer.slideContent.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.lastPoint = {x, y};
    
    // Start continuous rendering if not already running
    if (!this.animationFrame) {
      this.startContinuousRender();
    }
  }

  stopDrawing() {
    this.isDrawing = false;
    this.lastPoint = null;
  }

  updateTrail(e) {
    const rect = this.slideViewer.slideContent.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const currentTime = Date.now();
    
    // Check if mouse moved enough to add a new point (for performance)
    if (this.lastPoint) {
      const distance = Math.sqrt(
        Math.pow(x - this.lastPoint.x, 2) + Math.pow(y - this.lastPoint.y, 2)
      );
      if (distance < 3) return; // Skip if movement is too small
    }
    
    // Create new trail segment
    const trailSegment = {
      type: 'trail',
      points: this.lastPoint ? [this.lastPoint, {x, y}] : [{x, y}],
      timestamp: currentTime,
      alpha: 1.0
    };
    
    this.highlights.push(trailSegment);
    this.lastPoint = {x, y};
    
    // Start continuous rendering if not already running
    if (!this.animationFrame) {
      this.startContinuousRender();
    }
  }


  drawTrailSegment(segment) {
    if (!segment.points || segment.points.length < 2) return;
    
    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Calculate age-based alpha for fading effect
    const age = Date.now() - segment.timestamp;
    const fadeTime = this.settings.duration;
    
    let alpha = 1;
    let drawPoints = segment.points;
    
    if (this.settings.reverseFade) {
      // Reverse disappear: progressively shorten line from end to start
      const progress = Math.min(1, age / fadeTime);
      if (progress >= 1) return; // Completely disappeared
      
      // Calculate how much of the line to draw (1 = full line, 0 = no line)
      const drawRatio = 1 - progress;
      
      if (segment.points.length === 2) {
        // For simple line segments, interpolate between start and end
        const start = segment.points[0];
        const end = segment.points[1];
        const newEnd = {
          x: start.x + (end.x - start.x) * drawRatio,
          y: start.y + (end.y - start.y) * drawRatio
        };
        drawPoints = [start, newEnd];
      } else {
        // For curves, trim the points array
        const pointsToKeep = Math.max(2, Math.floor(segment.points.length * drawRatio));
        drawPoints = segment.points.slice(0, pointsToKeep);
      }
    } else {
      // Normal fade
      alpha = Math.max(0, 1 - (age / fadeTime));
      if (alpha <= 0) return;
    }
    
    // Draw main laser line
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.thickness;
    this.ctx.globalAlpha = alpha * 0.9;
    
    this.ctx.beginPath();
    if (drawPoints.length === 2) {
      // Simple line for trail segments
      this.ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
      this.ctx.lineTo(drawPoints[1].x, drawPoints[1].y);
    } else {
      // Smooth curve for longer paths
      this.drawSmoothCurve(drawPoints);
    }
    this.ctx.stroke();
    
    // Add glow effect
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.glowThickness;
    this.ctx.globalAlpha = alpha * 0.4;
    
    this.ctx.beginPath();
    if (drawPoints.length === 2) {
      this.ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
      this.ctx.lineTo(drawPoints[1].x, drawPoints[1].y);
    } else {
      this.drawSmoothCurve(drawPoints);
    }
    this.ctx.stroke();
    
    // Add bright center line
    this.ctx.strokeStyle = this.settings.glowColor;
    this.ctx.lineWidth = Math.max(1, this.settings.thickness / 3);
    this.ctx.globalAlpha = alpha;
    
    this.ctx.beginPath();
    if (drawPoints.length === 2) {
      this.ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
      this.ctx.lineTo(drawPoints[1].x, drawPoints[1].y);
    } else {
      this.drawSmoothCurve(drawPoints);
    }
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawSmoothCurve(points) {
    if (points.length < 2) return;
    
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      const controlX = (currentPoint.x + nextPoint.x) / 2;
      const controlY = (currentPoint.y + nextPoint.y) / 2;
      
      this.ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
    }
    
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
    }
  }

  startContinuousRender() {
    const render = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      const currentTime = Date.now();
      
      // Filter out old segments and draw remaining ones
      this.highlights = this.highlights.filter(segment => {
        const age = currentTime - segment.timestamp;
        if (age > this.settings.duration) return false; // Remove after custom duration
        
        this.drawTrailSegment(segment);
        return true;
      });
      
      // Continue animation if there are highlights or if laser is active
      if (this.highlights.length > 0 || this.isActive) {
        this.animationFrame = requestAnimationFrame(render);
      } else {
        this.animationFrame = null;
      }
    };
    
    this.animationFrame = requestAnimationFrame(render);
  }

  clearHighlights() {
    this.highlights = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  showModeIndicator() {
    let indicator = document.getElementById('laser-pointer-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'laser-pointer-indicator';
      indicator.innerHTML = '🔴 Laser Pointer Active<br><small>Press S for settings</small>';
      document.body.appendChild(indicator);
      
      // Add click handler for settings
      indicator.addEventListener('click', () => {
        this.openSettingsModal();
      });
    }
    indicator.classList.add('visible');
  }

  hideModeIndicator() {
    const indicator = document.getElementById('laser-pointer-indicator');
    if (indicator) {
      indicator.classList.remove('visible');
    }
  }

  // Called when slide changes
  onSlideChange() {
    this.clearHighlights();
    this.stopDrawing();
    if (this.isActive) {
      // Small delay to ensure slide content has updated
      setTimeout(() => {
        this.resizeCanvas();
      }, 200);
    }
  }
}