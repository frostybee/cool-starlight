// Export all SlideViewer manager classes for easy importing.
// This file provides a single entry point for all manager dependencies.

export { SearchManager } from './SearchManager.js';
export { ReadingModeManager } from './ReadingModeManager.js';
export { ThumbnailManager } from './ThumbnailManager.js';
export { MobileMenuManager } from './MobileMenuManager.js';
export { FullscreenManager } from './FullscreenManager.js';
export { FontManager } from './FontManager.js';
export { TOCManager } from './TOCManager.js';
export { SlideViewer, initSlideViewer } from './SlideViewer.js';

// Usage example:
// import { SlideViewer, initSlideViewer } from './slide-managers.js';
// or
// import { SlideViewer } from './SlideViewer.js'; // Direct import with auto-dependency resolution.