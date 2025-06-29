export class LaserPointerManager {
  constructor(slideViewer) {
    this.slideViewer = slideViewer;
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.highlights = [];
    this.currentHighlight = null;
    this.isDrawing = false;
    
    this.init();
  }

  init() {
    this.createCanvas();
    this.bindEvents();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'laser-pointer-canvas';
    
    this.ctx = this.canvas.getContext('2d');
    
    // Make sure we're adding to the slide content wrapper, not the main container
    const slideContentWrapper = this.slideViewer.slideContent.parentElement;
    slideContentWrapper.appendChild(this.canvas);
  }

  bindEvents() {
    // Use the content wrapper for mouse events to capture the entire area
    const contentWrapper = this.slideViewer.slideContent.parentElement;
    
    // Mouse events for drawing
    contentWrapper.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      e.stopPropagation();
      this.startDrawing(e);
    });

    contentWrapper.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.isDrawing) return;
      e.preventDefault();
      this.updateDrawing(e);
    });

    contentWrapper.addEventListener('mouseup', (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      this.endDrawing(e);
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
    this.currentHighlight = null;
    
    // Hide visual indicator
    this.hideModeIndicator();
  }

  resizeCanvas() {
    const rect = this.slideViewer.slideContent.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.redrawHighlights();
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.slideViewer.slideContent.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.currentHighlight = {
      type: 'line',
      points: [{x, y}],
      timestamp: Date.now()
    };
  }

  updateDrawing(e) {
    if (!this.currentHighlight) return;
    
    const rect = this.slideViewer.slideContent.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add new point to the line path
    this.currentHighlight.points.push({x, y});
    
    this.redrawHighlights();
    this.drawHighlight(this.currentHighlight);
  }

  endDrawing(e) {
    if (!this.currentHighlight) return;
    
    this.isDrawing = false;
    this.highlights.push(this.currentHighlight);
    this.currentHighlight = null;
    
    // Auto-fade highlights after 3 seconds
    setTimeout(() => {
      this.fadeOldHighlights();
    }, 3000);
  }

  drawHighlight(highlight) {
    if (!highlight.points || highlight.points.length < 2) return;
    
    this.ctx.save();
    this.ctx.strokeStyle = '#ff6b35';
    this.ctx.lineWidth = 4;
    this.ctx.globalAlpha = 0.9;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Draw the main line
    this.ctx.beginPath();
    this.ctx.moveTo(highlight.points[0].x, highlight.points[0].y);
    for (let i = 1; i < highlight.points.length; i++) {
      this.ctx.lineTo(highlight.points[i].x, highlight.points[i].y);
    }
    this.ctx.stroke();
    
    // Add a subtle glow effect
    this.ctx.strokeStyle = '#ff6b35';
    this.ctx.lineWidth = 8;
    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(highlight.points[0].x, highlight.points[0].y);
    for (let i = 1; i < highlight.points.length; i++) {
      this.ctx.lineTo(highlight.points[i].x, highlight.points[i].y);
    }
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  redrawHighlights() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.highlights.forEach(highlight => {
      const age = Date.now() - highlight.timestamp;
      if (age < 5000) { // Keep highlights for 5 seconds
        this.drawHighlight(highlight);
      }
    });
  }

  fadeOldHighlights() {
    const now = Date.now();
    this.highlights = this.highlights.filter(highlight => {
      return (now - highlight.timestamp) < 5000;
    });
    this.redrawHighlights();
  }

  clearHighlights() {
    this.highlights = [];
    this.redrawHighlights();
  }

  showModeIndicator() {
    let indicator = document.getElementById('laser-pointer-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'laser-pointer-indicator';
      indicator.textContent = '🔴 Laser Pointer Active';
      document.body.appendChild(indicator);
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
    if (this.isActive) {
      // Small delay to ensure slide content has updated
      setTimeout(() => {
        this.resizeCanvas();
      }, 200);
    }
  }
}