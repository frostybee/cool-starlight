export class LaserPointerManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.highlights = [];
    this.currentPath = null;
    this.isDrawing = false;
    this.lastPoint = null;
    this.animationFrame = null;

    // Shape drawing state.
    this.shapeStartPoint = null;
    this.previewShape = null;

    // Customizable settings with localStorage support.
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
      duration: 1500, // Milliseconds.
      reverseFade: false,
      shape: 'freehand' // Freehand, circle, rectangle, line.
    };

    try {
      const saved = localStorage.getItem('laser-pointer-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new settings added in updates.
        const settings = { ...defaultSettings, ...parsed };
        // Recalculate dependent values.
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

    // Make sure we're adding to the slide content wrapper, not the main container.
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
          <label class="laser-pointer-setting-label">Shape</label>
          <select class="laser-pointer-shape-select">
            <option value="freehand" ${this.settings.shape === 'freehand' ? 'selected' : ''}>✏️ Freehand</option>
            <option value="circle" ${this.settings.shape === 'circle' ? 'selected' : ''}>⭕ Circle</option>
            <option value="rectangle" ${this.settings.shape === 'rectangle' ? 'selected' : ''}>⬜ Rectangle</option>
            <option value="line" ${this.settings.shape === 'line' ? 'selected' : ''}>📏 Line</option>
          </select>
          <div class="laser-pointer-setting-description">Choose drawing tool</div>
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
          <div class="laser-pointer-setting-description">Lines undraw from end back to start</div>
        </div>

        <div class="laser-pointer-preview">
          <div>Preview:</div>
          <canvas class="laser-pointer-preview-canvas" width="200" height="60"></canvas>
        </div>
      </div>
    `;

    // Append to the slideshow modal to ensure proper z-index stacking.
    const slideshowModal = this.slideViewer.modal;
    if (slideshowModal) {
      slideshowModal.appendChild(this.settingsModal);
    } else {
      document.body.appendChild(this.settingsModal);
    }
    this.bindSettingsEvents();

    // Initialize preview.
    setTimeout(() => this.updatePreview(), 100);
  }

  bindSettingsEvents() {
    const shapeSelect = this.settingsModal.querySelector('.laser-pointer-shape-select');
    const colorPicker = this.settingsModal.querySelector('.laser-pointer-color-picker');
    const thicknessSlider = this.settingsModal.querySelector('.laser-pointer-thickness-slider');
    const durationSlider = this.settingsModal.querySelector('.laser-pointer-duration-slider');
    const reverseFadeToggle = this.settingsModal.querySelector('.laser-pointer-reverse-fade');
    const closeBtn = this.settingsModal.querySelector('.laser-pointer-settings-close');
    const previewLine = this.settingsModal.querySelector('.laser-pointer-preview-line');

    // Shape selector.
    shapeSelect.addEventListener('change', (e) => {
      this.settings.shape = e.target.value;
      this.updatePreview();
      this.saveSettings();
    });

    // Color picker.
    colorPicker.addEventListener('change', (e) => {
      this.settings.color = e.target.value;
      this.settings.glowColor = this.adjustColor(e.target.value, 30);
      this.updatePreview();
      this.saveSettings();
    });

    // Thickness slider.
    thicknessSlider.addEventListener('input', (e) => {
      this.settings.thickness = parseInt(e.target.value);
      this.settings.glowThickness = this.settings.thickness * 2;
      const valueSpan = thicknessSlider.nextElementSibling;
      valueSpan.textContent = `${this.settings.thickness}px`;
      this.updatePreview();
      this.saveSettings();
    });

    // Duration slider.
    durationSlider.addEventListener('input', (e) => {
      this.settings.duration = parseInt(e.target.value);
      const valueSpan = durationSlider.nextElementSibling;
      valueSpan.textContent = `${this.settings.duration / 1000}s`;
      this.saveSettings();
    });

    // Reverse fade toggle.
    reverseFadeToggle.addEventListener('change', (e) => {
      this.settings.reverseFade = e.target.checked;
      this.saveSettings();
    });

    // Close button.
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.closeSettingsModal();
    });

    // Close on outside click.
    this.settingsModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === this.settingsModal) {
        this.closeSettingsModal();
      }
    });

    // Prevent laser pointer drawing when interacting with settings.
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
    const previewCanvas = this.settingsModal.querySelector('.laser-pointer-preview-canvas');
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Set canvas styles.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw preview based on selected shape.
    const centerX = previewCanvas.width / 2;
    const centerY = previewCanvas.height / 2;

    if (this.settings.shape === 'freehand') {
      // Draw a curved line for freehand.
      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.thickness;
      ctx.globalAlpha = 0.9;

      ctx.beginPath();
      ctx.moveTo(20, centerY);
      ctx.quadraticCurveTo(centerX, centerY - 15, centerX + 50, centerY);
      ctx.quadraticCurveTo(centerX + 100, centerY + 15, 180, centerY);
      ctx.stroke();

      // Add glow.
      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.glowThickness;
      ctx.globalAlpha = 0.4;

      ctx.beginPath();
      ctx.moveTo(20, centerY);
      ctx.quadraticCurveTo(centerX, centerY - 15, centerX + 50, centerY);
      ctx.quadraticCurveTo(centerX + 100, centerY + 15, 180, centerY);
      ctx.stroke();
    } else if (this.settings.shape === 'line') {
      // Draw a straight line.
      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.thickness;
      ctx.globalAlpha = 0.9;

      ctx.beginPath();
      ctx.moveTo(30, centerY - 10);
      ctx.lineTo(170, centerY + 10);
      ctx.stroke();

      // Add glow.
      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.glowThickness;
      ctx.globalAlpha = 0.4;

      ctx.beginPath();
      ctx.moveTo(30, centerY - 10);
      ctx.lineTo(170, centerY + 10);
      ctx.stroke();
    } else if (this.settings.shape === 'rectangle') {
      // Draw a rectangle.
      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.thickness;
      ctx.globalAlpha = 0.9;

      ctx.beginPath();
      ctx.rect(40, centerY - 15, 120, 30);
      ctx.stroke();

      // Add glow.
      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.glowThickness;
      ctx.globalAlpha = 0.4;

      ctx.beginPath();
      ctx.rect(40, centerY - 15, 120, 30);
      ctx.stroke();
    } else if (this.settings.shape === 'circle') {
      // Draw a circle.
      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.thickness;
      ctx.globalAlpha = 0.9;

      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
      ctx.stroke();

      // Add glow.
      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.glowThickness;
      ctx.globalAlpha = 0.4;

      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  adjustColor(hex, amount) {
    // Convert hex to RGB, adjust brightness, return hex.
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

    // Add escape key handler.
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

    // Remove escape key handler.
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler, true);
      this.escapeHandler = null;
    }
  }

  bindEvents() {
    // Use the content wrapper for mouse events to capture the entire area.
    const contentWrapper = this.slideViewer.slideContent.parentElement;

    // Click to start drawing.
    contentWrapper.addEventListener('mousedown', (e) => {
      if (!this.isActive || this.settingsModal.classList.contains('visible')) return;
      e.preventDefault();
      e.stopPropagation();
      this.startDrawing(e);
    });

    // Continue drawing while mouse is pressed and moving.
    contentWrapper.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.isDrawing || this.settingsModal.classList.contains('visible')) return;
      e.preventDefault();
      this.updateTrail(e);
    });

    // Stop drawing when mouse is released.
    contentWrapper.addEventListener('mouseup', (e) => {
      if (!this.isActive || this.settingsModal.classList.contains('visible')) return;
      e.preventDefault();
      this.stopDrawing();
    });

    // Stop drawing when mouse leaves the area.
    contentWrapper.addEventListener('mouseleave', () => {
      if (!this.isActive) return;
      this.stopDrawing();
    });

    // Prevent context menu when laser pointer is active.
    contentWrapper.addEventListener('contextmenu', (e) => {
      if (this.isActive) {
        e.preventDefault();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.isActive) {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.resizeCanvas();
        }, 100);
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

    // Update button states
    this.updateButtonStates(true);

    // Show visual indicator.
    this.showModeIndicator();
  }

  deactivate() {
    this.canvas.classList.remove('active');
    this.slideViewer.slideContent.parentElement.classList.remove('laser-pointer-mode');
    this.isDrawing = false;
    this.lastPoint = null;

    // Update button states
    this.updateButtonStates(false);

    // Stop animation frame.
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Hide visual indicator.
    this.hideModeIndicator();
  }

  resizeCanvas() {
    // Size the canvas to match the entire content wrapper.
    const wrapperRect = this.slideViewer.slideContent.parentElement.getBoundingClientRect();

    // Position canvas to cover the entire wrapper.
    this.canvas.style.left = '0px';
    this.canvas.style.top = '0px';
    this.canvas.width = wrapperRect.width;
    this.canvas.height = wrapperRect.height;

    this.redrawHighlights();
  }

  redrawHighlights() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Redraw all existing paths.
    this.highlights.forEach(path => {
      this.drawPath(path);
    });

    // Draw current path being drawn.
    if (this.currentPath && this.currentPath.points.length >= 2) {
      this.drawPath(this.currentPath);
    }
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.lastPoint = {x, y};

    if (this.settings.shape === 'freehand') {
      // Start a new continuous path for freehand drawing.
      this.currentPath = {
        points: [{x, y}],
        timestamp: Date.now(),
        type: 'freehand'
      };
    } else {
      // For shapes, store the start point.
      this.shapeStartPoint = {x, y};
      this.previewShape = {
        type: this.settings.shape,
        startPoint: {x, y},
        endPoint: {x, y},
        timestamp: Date.now()
      };
    }

    // Start continuous rendering if not already running.
    if (!this.animationFrame) {
      this.startContinuousRender();
    }
  }

  stopDrawing() {
    this.isDrawing = false;
    this.lastPoint = null;

    if (this.settings.shape === 'freehand') {
      // Finish the current path and add it to highlights.
      if (this.currentPath && this.currentPath.points.length > 1) {
        this.highlights.push(this.currentPath);
      }
      this.currentPath = null;
    } else {
      // Finish the shape and add it to highlights.
      if (this.previewShape && this.shapeStartPoint) {
        this.highlights.push(this.previewShape);
      }
      this.previewShape = null;
      this.shapeStartPoint = null;
    }
  }

  updateTrail(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.settings.shape === 'freehand') {
      // Check if mouse moved enough to add a new point (for performance).
      if (this.lastPoint) {
        const distance = Math.sqrt(
          Math.pow(x - this.lastPoint.x, 2) + Math.pow(y - this.lastPoint.y, 2)
        );
        if (distance < 3) return; // Skip if movement is too small.
      }

      // Add point to current continuous path.
      if (this.currentPath) {
        this.currentPath.points.push({x, y});
      }
    } else {
      // Update shape preview.
      if (this.previewShape && this.shapeStartPoint) {
        this.previewShape.endPoint = {x, y};
      }
    }

    this.lastPoint = {x, y};

    // Start continuous rendering if not already running.
    if (!this.animationFrame) {
      this.startContinuousRender();
    }
  }


  drawPath(path) {
    // Handle different path types.
    if (path.type === 'freehand') {
      this.drawFreehandPath(path);
    } else if (path.type === 'circle' || path.type === 'rectangle' || path.type === 'line') {
      this.drawShape(path);
    }
  }

  drawFreehandPath(path) {
    if (!path.points || path.points.length < 1) return;

    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Calculate age-based alpha for fading effect.
    const age = Date.now() - path.timestamp;
    const fadeTime = this.settings.duration;

    let alpha = 1;
    let drawPoints = path.points;

    // Handle current drawing path (no aging effects).
    const isCurrentPath = (path === this.currentPath);

    if (!isCurrentPath && this.settings.reverseFade) {
      // Reverse disappear: undraw the path from end to start.
      const progress = Math.min(1, age / fadeTime);

      if (progress >= 1) return; // Completely disappeared.

      // Calculate how much of the path to draw (undraw from end to start).
      const drawRatio = 1 - progress;
      const totalLength = path.points.length - 1; // Number of segments.
      const targetLength = drawRatio * totalLength;

      // Get the whole points up to the target.
      const wholePoints = Math.floor(targetLength);
      const fraction = targetLength - wholePoints;

      if (wholePoints >= path.points.length - 1) {
        // Draw the full path.
        return;
      } else {
        // Create a smooth transition by interpolating the last point.
        drawPoints = path.points.slice(0, wholePoints + 1);

        if (fraction > 0 && wholePoints + 1 < path.points.length) {
          // Interpolate between the last kept point and the next point.
          const lastPoint = path.points[wholePoints];
          const nextPoint = path.points[wholePoints + 1];

          const interpolatedPoint = {
            x: lastPoint.x + (nextPoint.x - lastPoint.x) * fraction,
            y: lastPoint.y + (nextPoint.y - lastPoint.y) * fraction
          };

          drawPoints[drawPoints.length - 1] = interpolatedPoint;
        }
      }

      // Keep full alpha - no fading.
      alpha = 1;
    } else if (!isCurrentPath) {
      // Normal fade for completed paths.
      alpha = Math.max(0, 1 - (age / fadeTime));
      if (alpha <= 0) return;
    }

    // Need at least 2 points to draw a line.
    if (drawPoints.length < 2) return;

    // Draw main laser line.
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.thickness;
    this.ctx.globalAlpha = alpha * 0.9;

    this.ctx.beginPath();
    this.drawSmoothCurve(drawPoints);
    this.ctx.stroke();

    // Add glow effect.
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.glowThickness;
    this.ctx.globalAlpha = alpha * 0.4;

    this.ctx.beginPath();
    this.drawSmoothCurve(drawPoints);
    this.ctx.stroke();

    // Add bright center line.
    this.ctx.strokeStyle = this.settings.glowColor;
    this.ctx.lineWidth = Math.max(1, this.settings.thickness / 3);
    this.ctx.globalAlpha = alpha;

    this.ctx.beginPath();
    this.drawSmoothCurve(drawPoints);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawShape(shape) {
    if (!shape.startPoint || !shape.endPoint) return;

    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Calculate age-based alpha for fading effect.
    const age = Date.now() - shape.timestamp;
    const fadeTime = this.settings.duration;

    let alpha = 1;
    const isCurrentShape = (shape === this.previewShape);

    if (!isCurrentShape) {
      alpha = Math.max(0, 1 - (age / fadeTime));
      if (alpha <= 0) return;
    }

    const { startPoint, endPoint } = shape;

    // Draw shape based on type.
    if (shape.type === 'line') {
      this.drawLine(startPoint, endPoint, alpha);
    } else if (shape.type === 'rectangle') {
      this.drawRectangle(startPoint, endPoint, alpha);
    } else if (shape.type === 'circle') {
      this.drawCircle(startPoint, endPoint, alpha);
    }

    this.ctx.restore();
  }

  drawLine(start, end, alpha) {
    // Draw main laser line.
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.thickness;
    this.ctx.globalAlpha = alpha * 0.9;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();

    // Add glow effect.
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.glowThickness;
    this.ctx.globalAlpha = alpha * 0.4;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();

    // Add bright center line.
    this.ctx.strokeStyle = this.settings.glowColor;
    this.ctx.lineWidth = Math.max(1, this.settings.thickness / 3);
    this.ctx.globalAlpha = alpha;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
  }

  drawRectangle(start, end, alpha) {
    const width = end.x - start.x;
    const height = end.y - start.y;

    // Draw main laser line.
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.thickness;
    this.ctx.globalAlpha = alpha * 0.9;

    this.ctx.beginPath();
    this.ctx.rect(start.x, start.y, width, height);
    this.ctx.stroke();

    // Add glow effect.
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.glowThickness;
    this.ctx.globalAlpha = alpha * 0.4;

    this.ctx.beginPath();
    this.ctx.rect(start.x, start.y, width, height);
    this.ctx.stroke();

    // Add bright center line.
    this.ctx.strokeStyle = this.settings.glowColor;
    this.ctx.lineWidth = Math.max(1, this.settings.thickness / 3);
    this.ctx.globalAlpha = alpha;

    this.ctx.beginPath();
    this.ctx.rect(start.x, start.y, width, height);
    this.ctx.stroke();
  }

  drawCircle(start, end, alpha) {
    const radius = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );

    // Draw main laser line.
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.thickness;
    this.ctx.globalAlpha = alpha * 0.9;

    this.ctx.beginPath();
    this.ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();

    // Add glow effect.
    this.ctx.strokeStyle = this.settings.color;
    this.ctx.lineWidth = this.settings.glowThickness;
    this.ctx.globalAlpha = alpha * 0.4;

    this.ctx.beginPath();
    this.ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();

    // Add bright center line.
    this.ctx.strokeStyle = this.settings.glowColor;
    this.ctx.lineWidth = Math.max(1, this.settings.thickness / 3);
    this.ctx.globalAlpha = alpha;

    this.ctx.beginPath();
    this.ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
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

      // Filter out old paths and draw remaining ones.
      this.highlights = this.highlights.filter(path => {
        const age = currentTime - path.timestamp;
        if (age > this.settings.duration * 2) return false; // Remove after duration.
        return true;
      });

      // Draw all completed paths.
      this.highlights.forEach(path => {
        this.drawPath(path);
      });

      // Draw current path being drawn (freehand).
      if (this.currentPath && this.currentPath.points.length >= 2) {
        this.drawPath(this.currentPath);
      }

      // Draw current shape preview.
      if (this.previewShape) {
        this.drawPath(this.previewShape);
      }

      // Continue animation if there are highlights or if drawing is active.
      if (this.highlights.length > 0 || this.isDrawing || this.currentPath || this.previewShape) {
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

      // Append to the slideshow modal to ensure proper theme inheritance.
      const slideshowModal = this.slideViewer.modal;
      if (slideshowModal) {
        slideshowModal.appendChild(indicator);
      } else {
        document.body.appendChild(indicator);
      }

      // Add click handler for settings.
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

  // Called when slide changes.
  onSlideChange() {
    this.clearHighlights();
    this.stopDrawing();
    if (this.isActive) {
      // Small delay to ensure slide content has updated.
      setTimeout(() => {
        this.resizeCanvas();
      }, 200);
    }
  }

  // Update button visual states
  updateButtonStates(isActive) {
    const laserPointerBtn = this.slideViewer.laserPointerBtn;
    const laserPointerBtnMobile = this.slideViewer.laserPointerBtnMobile;

    if (laserPointerBtn) {
      if (isActive) {
        laserPointerBtn.classList.add('active');
        laserPointerBtn.setAttribute('aria-pressed', 'true');
        laserPointerBtn.title = 'Laser pointer active (L) - Click to deactivate';
      } else {
        laserPointerBtn.classList.remove('active');
        laserPointerBtn.setAttribute('aria-pressed', 'false');
        laserPointerBtn.title = 'Laser pointer (L)';
      }
    }

    if (laserPointerBtnMobile) {
      if (isActive) {
        laserPointerBtnMobile.classList.add('active');
        laserPointerBtnMobile.setAttribute('aria-pressed', 'true');
      } else {
        laserPointerBtnMobile.classList.remove('active');
        laserPointerBtnMobile.setAttribute('aria-pressed', 'false');
      }
    }
  }
}