import { definePlugin } from '@expressive-code/core';
import { h } from '@expressive-code/core/hast';

export function pluginFullscreen(options = {}) {
	const config = {
		enabled: true,
		fullscreenButtonTooltip: 'Toggle fullscreen view',
		enableEscapeKey: true,
		exitOnBrowserBack: true,
		addToUntitledBlocks: true,
		animationDuration: 200,
		svgPathFullscreenOn:
			'M16 3h6v6h-2V5h-4V3zM2 3h6v2H4v4H2V3zm18 16v-4h2v6h-6v-2h4zM4 19h4v2H2v-6h2v4z',
		svgPathFullscreenOff:
			'M18 7h4v2h-6V3h2v4zM8 9H2V7h4V3h2v6zm10 8v4h-2v-6h6v2h-4zM8 15v6H6v-4H2v-2h6z',
		// Default theme configuration.
		theme: {
			toolbarBg: 'rgba(90, 88, 88, 0.95)',
			toolbarBorder: 'rgba(255, 255, 255, 0.1)',
			buttonBg: 'rgba(58, 57, 57, 0.9)',
			buttonBgHover: 'rgba(65, 65, 65, 0.9)',
			buttonBgActive: 'rgba(25, 25, 25, 0.9)',
			buttonText: '#ffffff',
			buttonBorder: 'rgba(255, 255, 255, 0.2)',
			buttonFocus: 'rgba(74, 144, 226, 0.6)',
			containerBg: 'rgba(0, 0, 0, 0.85)',
			contentShadow: 'rgba(0, 0, 0, 0.5)',
			hintBg: 'rgba(20, 20, 20, 0.95)',
			hintText: '#ffffff',
			hintBorder: 'rgba(255, 255, 255, 0.2)',
		},
		...options,
	};


	return definePlugin({
		name: 'Expressive Code Fullscreen Plugin',

		baseStyles: `
      @at-root {
        /* Fullscreen Plugin Theme Variables */
        :root {
          --cb-fs-toolbar-bg: ${config.theme.toolbarBg};
          --cb-fs-toolbar-border: ${config.theme.toolbarBorder};
          --cb-fs-button-bg: ${config.theme.buttonBg};
          --cb-fs-button-bg-hover: ${config.theme.buttonBgHover};
          --cb-fs-button-bg-active: ${config.theme.buttonBgActive};
          --cb-fs-button-text: ${config.theme.buttonText};
          --cb-fs-button-border: ${config.theme.buttonBorder};
          --cb-fs-button-focus: ${config.theme.buttonFocus};
          --cb-fs-container-bg: ${config.theme.containerBg};
          --cb-fs-content-shadow: ${config.theme.contentShadow};
          --cb-fs-hint-bg: ${config.theme.hintBg};
          --cb-fs-hint-text: ${config.theme.hintText};
          --cb-fs-hint-border: ${config.theme.hintBorder};
        }

        .cb-fullscreen__container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 2147483647 !important;
          overflow: auto !important;
          padding: 1.25rem !important;
          box-sizing: border-box !important;
          visibility: hidden !important;
          transform: scale(0.01) !important;
          transition: transform cubic-bezier(0.17, 0.67, 0.5, 0.71) ${config.animationDuration}ms !important;
          outline: none !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
          isolation: isolate !important;
          backdrop-filter: blur(5px) !important;
          -webkit-backdrop-filter: blur(5px) !important;
          pointer-events: none !important;
        }

        .cb-fullscreen__content {
          width: 100% !important;
          max-width: 95% !important;
          display: flex !important;
          flex-direction: column !important;
          background-color: transparent !important;
          gap: 0.5rem !important;
          align-items: stretch !important;
          box-shadow: 0 1.25rem 3.75rem rgba(0, 0, 0, 0.5) !important;
          border-radius: 0.625rem !important;
        }

        .cb-fullscreen__container--open {
          visibility: visible !important;
          transform: scale(1) !important;
          pointer-events: auto !important;
        }

        .cb-fullscreen__font-controls {
          display: flex !important;
          align-items: center !important;
          gap: 0.25rem !important;
          background: var(--cb-fs-toolbar-bg) !important;
          border: 1px solid var(--cb-fs-toolbar-border) !important;
          border-radius: 8px !important;
          padding: 0.25rem !important;
          box-shadow: 0 1px 2px var(--cb-fs-content-shadow) !important;
          justify-content: center !important;
        }

        .cb-fullscreen__font-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 3rem !important;
          height: 3rem !important;
          padding: 0.5rem !important;
          margin-left: 0.5rem !important;
          background: var(--cb-fs-button-bg) !important;
          border: 1px solid var(--cb-fs-button-border) !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          color: var(--cb-fs-button-text) !important;
          transition: all 0.2s ease !important;
          position: relative !important;
          min-width: 36px !important;
          min-height: 36px !important;
        }

        .cb-fullscreen__font-btn:hover {
          background: var(--cb-fs-button-bg-hover) !important;
          transform: scale(1.05) !important;
        }

        .cb-fullscreen__font-btn:focus {
          outline: 2px solid var(--cb-fs-button-focus) !important;
          outline-offset: 0.125rem !important;
        }

        .cb-fullscreen__font-btn:active {
          background: var(--cb-fs-button-bg-active) !important;
          transform: scale(0.95) !important;
        }

        .cb-fullscreen__font-btn svg {
          width: 1rem !important;
          height: 1rem !important;
          stroke-width: 2.5 !important;
        }

        .cb-fullscreen__font-btn--decrease[title]:hover::after {
          content: attr(title) !important;
          position: absolute !important;
          right: 100% !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          background-color: var(--cb-fs-hint-bg) !important;
          color: var(--cb-fs-hint-text) !important;
          padding: 0.375rem 0.5rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.75rem !important;
          white-space: nowrap !important;
          z-index: 2147483647 !important;
          margin-right: 0.5rem !important;
          border: 1px solid var(--cb-fs-hint-border) !important;
          box-shadow: 0 0.125rem 0.5rem var(--cb-fs-content-shadow) !important;
          pointer-events: none !important;
        }

        .cb-fullscreen__font-btn--increase[title]:hover::after {
          content: attr(title) !important;
          position: absolute !important;
          left: 100% !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          background-color: var(--cb-fs-hint-bg) !important;
          color: var(--cb-fs-hint-text) !important;
          padding: 0.375rem 0.5rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.75rem !important;
          white-space: nowrap !important;
          z-index: 2147483647 !important;
          margin-left: 0.5rem !important;
          border: 1px solid var(--cb-fs-hint-border) !important;
          box-shadow: 0 0.125rem 0.5rem var(--cb-fs-content-shadow) !important;
          pointer-events: none !important;
        }

        .cb-fullscreen__hint {
          position: absolute !important;
          bottom: 1.25rem !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background-color: var(--cb-fs-hint-bg) !important;
          color: var(--cb-fs-hint-text) !important;
          padding: 0.75rem 1rem !important;
          border-radius: 0.5rem !important;
          font-size: 1rem !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          opacity: 0.85 !important;
          pointer-events: none !important;
          z-index: 10110 !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          border: 1px solid var(--cb-fs-hint-border) !important;
          box-shadow: 0 4px 12px var(--cb-fs-content-shadow) !important;
        }

        @keyframes simpleShow {
          to {
            opacity: 0.85;
          }
        }

        .cb-fullscreen__hint kbd {
          background-color: rgba(255, 255, 255, 0.2) !important;
          padding: 0.125rem 0.375rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.75rem !important;
          font-weight: bold !important;
          margin: 0 0.125rem !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .cb-fullscreen__sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }

        #fullscreen-description {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
      }
      .expressive-code.cb-fullscreen__active {
        align-self: center !important;
        flex: 1 !important;
        width: calc(100% - 2rem) !important;
        max-width: none !important;
        height: auto !important;
        margin: 1rem !important;
        margin-bottom: 4rem !important;
        background-color: #1e1e1e !important;
        border-radius: 0.625rem !important;
        box-sizing: border-box !important;
        box-shadow: 0 1.25rem 3.75rem rgba(0, 0, 0, 0.5) !important;
      }

      .expressive-code.cb-fullscreen__active pre,
      .expressive-code.cb-fullscreen__active code {
        font-size: calc(1em * var(--ec-font-scale, 1)) !important;
      }

      .expressive-code.cb-fullscreen__active .frame {
        font-size: calc(1em * var(--ec-font-scale, 1)) !important;
      }

      .cb-fullscreen__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        padding: 0.25rem;
        background: transparent;
        border: none;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s, background-color 0.2s, border-color 0.2s, transform 0.2s ease;
        border-radius: 0.25rem;
        color: inherit;
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 100;
      }

      .expressive-code:not(.has-title) .cb-fullscreen__button,
      .expressive-code .frame:not(.has-title) ~ * .cb-fullscreen__button {
        top: 44px !important;
        right: 10px !important;
      }

      .cb-fullscreen__button:hover {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.5);
        transform: scale(1.1);
      }

      .cb-fullscreen__button:focus {
        outline: 2px solid #4A90E2;
        outline-offset: 0.125rem;
        background-color: rgba(74, 144, 226, 0.2);
      }

      .cb-fullscreen__button:focus-visible {
        outline: 2px solid #4A90E2;
        outline-offset: 0.125rem;
        background-color: rgba(74, 144, 226, 0.2);
      }

      .cb-fullscreen__button .fullscreen-on {
        display: inline;
      }

      .cb-fullscreen__button .fullscreen-off {
        display: none;
      }

      .expressive-code.cb-fullscreen__active .cb-fullscreen__button .fullscreen-on {
        display: none !important;
      }

      .expressive-code.cb-fullscreen__active .cb-fullscreen__button .fullscreen-off {
        display: inline !important;
      }
    `,

		hooks: {
			postprocessRenderedBlock: async (context) => {
				if (!config.enabled) return;

				// Check if we should skip untitled blocks.
				if (!config.addToUntitledBlocks && !context.codeBlock.meta.title && !context.codeBlock.props.title) {
					return;
				}

				// Create the fullscreen button with proper structure to match CSS.
				const fullscreenButton = h(
					'button',
					{
						class: 'cb-fullscreen__button',
						type: 'button',
						'aria-label': config.fullscreenButtonTooltip,
						'aria-expanded': 'false',
						'data-tooltip': config.fullscreenButtonTooltip,
					},
					[
						h(
							'svg',
							{
								class: 'fullscreen-on',
								xmlns: 'http://www.w3.org/2000/svg',
								width: '16',
								height: '16',
								viewBox: '0 0 24 24',
								'aria-hidden': 'true',
							},
							[
								h('path', {
									fill: 'currentColor',
									stroke: 'currentColor',
									'stroke-linecap': 'round',
									'stroke-linejoin': 'round',
									d: config.svgPathFullscreenOn,
								}),
							]
						),
						h(
							'svg',
							{
								class: 'fullscreen-off',
								xmlns: 'http://www.w3.org/2000/svg',
								width: '16',
								height: '16',
								viewBox: '0 0 24 24',
								'aria-hidden': 'true',
							},
							[
								h('path', {
									fill: 'currentColor',
									stroke: 'currentColor',
									'stroke-linecap': 'round',
									'stroke-linejoin': 'round',
									d: config.svgPathFullscreenOff,
								}),
							]
						),
					]
				);

				context.renderData.blockAst.children.push(fullscreenButton);
			},
		},

		jsModules: [
			`
      (function() {
        'use strict';

        // Configuration constants.
        const CONSTANTS = {
          MIN_FONT_SIZE: 60,
          MAX_FONT_SIZE: 500,
          DEFAULT_FONT_SIZE: 100,
          FONT_ADJUSTMENT: 5,
          DOUBLE_CLICK_THRESHOLD: 600,
          HINT_DISPLAY_TIME: 4000,
          FADE_TRANSITION_TIME: 500
        };

        // Plugin configuration.
        const pluginConfig = {
          fullscreenButtonTooltip: '${config.fullscreenButtonTooltip}',
          enableEscapeKey: ${config.enableEscapeKey},
          exitOnBrowserBack: ${config.exitOnBrowserBack},
          animationDuration: ${config.animationDuration}
        };

        // Avoid duplicate initialization.
        if (window.expressiveCodeFullscreenInitialized) return;
        window.expressiveCodeFullscreenInitialized = true;

        // Initialize fullscreen state.
        const fullscreenState = {
          isFullscreenActive: false,
          scrollPosition: 0,
          originalCodeBlock: null,
          fontSize: CONSTANTS.DEFAULT_FONT_SIZE,
          focusTrapHandler: null,
        };

        // Cache frequently used DOM elements.
        const domCache = {
          fullscreenContainer: null,
          get container() {
            if (!this.fullscreenContainer) {
              this.fullscreenContainer = document.querySelector('.cb-fullscreen__container');
            }
            return this.fullscreenContainer;
          },
          clearCache() {
            this.fullscreenContainer = null;
          }
        };

        // Font size management.
        const fontManager = {
          storageKey: 'expressiveCodeFullscreenFontSize',

          loadFontSize() {
            try {
              const savedSize = localStorage.getItem(this.storageKey);
              if (savedSize) {
                const parsedSize = parseInt(savedSize, 10);
                if (parsedSize >= CONSTANTS.MIN_FONT_SIZE && parsedSize <= CONSTANTS.MAX_FONT_SIZE) {
                  return parsedSize;
                }
              }
            } catch (e) {
              console.warn('Could not load font size from localStorage');
            }
            return CONSTANTS.DEFAULT_FONT_SIZE;
          },

          saveFontSize(size) {
            try {
              localStorage.setItem(this.storageKey, size.toString());
            } catch (e) {
              console.warn('Could not save font size to localStorage');
            }
          },

          adjustFontSize(change, codeBlock) {
            const newSize = Math.max(CONSTANTS.MIN_FONT_SIZE, Math.min(CONSTANTS.MAX_FONT_SIZE, fullscreenState.fontSize + change));
            fullscreenState.fontSize = newSize;
            this.saveFontSize(newSize);
            this.applyFontSize(codeBlock);
          },

          resetFontSize(codeBlock) {
            fullscreenState.fontSize = CONSTANTS.DEFAULT_FONT_SIZE;
            this.saveFontSize(CONSTANTS.DEFAULT_FONT_SIZE);
            this.applyFontSize(codeBlock);
          },

          applyFontSize(codeBlock) {
            if (codeBlock) {
              const scale = fullscreenState.fontSize / 100;
              codeBlock.style.setProperty('--ec-font-scale', scale);

              // Also apply directly to all text elements as backup.
              const textElements = codeBlock.querySelectorAll('pre, code, span, .frame');
              textElements.forEach(el => {
                el.style.setProperty('font-size', \`calc(1em * \${scale})\`, 'important');
              });

              // Announce font size change to screen readers.
              this.announceFontSizeChange(fullscreenState.fontSize);

            } else {
            }
          },

          announceFontSizeChange(fontSize) {
            const statusElement = document.getElementById('font-size-status');
            if (statusElement) {
              const percentage = Math.round(fontSize);
              statusElement.textContent = \`Font size changed to \${percentage}%\`;

              // Clear the announcement after a brief delay to allow for multiple changes.
              setTimeout(() => {
                if (statusElement.textContent === \`Font size changed to \${percentage}%\`) {
                  statusElement.textContent = '';
                }
              }, 1000);
            }
          }
        };

        // Initialize immediately and also on DOM ready.
        function initialize() {
          createFullscreenContainer();
          initializeFullscreenButtons();
        }

        // Initialize immediately if DOM is already loaded.
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initialize);
        } else {
          initialize();
        }

        // Also initialize when new content is added (for dynamic content).
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && (node.matches('.expressive-code') || node.querySelector('.expressive-code'))) {
                  setTimeout(initializeFullscreenButtons, 100);
                }
              });
            }
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Create fullscreen container.
        function createFullscreenContainer() {
          if (document.querySelector('.cb-fullscreen__container')) return;

          const container = document.createElement('div');
          container.className = 'cb-fullscreen__container';
          container.setAttribute('role', 'dialog');
          container.setAttribute('aria-modal', 'true');
          container.setAttribute('aria-label', 'Code block in fullscreen view');
          container.setAttribute('aria-describedby', 'fullscreen-description');
          container.setAttribute('tabindex', '-1');

          // Ensure it's added directly to body, not any wrapper.
          document.body.appendChild(container);

          // Minimal inline styles - most styling in baseStyles.
        }

        // Initialize fullscreen buttons.
        function initializeFullscreenButtons() {
          const buttons = document.querySelectorAll('.cb-fullscreen__button');
          buttons.forEach(button => {
            button.addEventListener('click', handleFullscreenClick);
            button.addEventListener('keydown', function(event) {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleFullscreenClick.call(this, event);
              }
            });
          });
        }

        function handleFullscreenClick(event) {
          event.preventDefault();
          event.stopPropagation();

          const codeBlock = this.closest('.expressive-code');
          if (codeBlock) {
            toggleFullscreen(codeBlock);
          }
        }

        function toggleFullscreen(codeBlock) {
          const fullscreenContainer = domCache.container;

          if (fullscreenState.isFullscreenActive) {
            exitFullscreen(fullscreenContainer);
          } else {
            enterFullscreen(codeBlock, fullscreenContainer);
          }
        }

        function enterFullscreen(codeBlock, fullscreenContainer) {
          fullscreenState.originalCodeBlock = codeBlock;
          fullscreenState.fontSize = fontManager.loadFontSize();

          const originalButton = codeBlock.querySelector('.cb-fullscreen__button');
          if (originalButton) {
            originalButton.setAttribute('aria-expanded', 'true');
          }

          const clonedBlock = codeBlock.cloneNode(true);
          clonedBlock.classList.add('cb-fullscreen__active');
          // Ensure the expressive-code class is present for CSS selectors to work.
          if (!clonedBlock.classList.contains('expressive-code')) {
            clonedBlock.classList.add('expressive-code');
          }


          // Force full width with inline styles.
          // Styles handled in baseStyles (.expressive-code.cb-fullscreen__active).

          const fullscreenButtonInClone = clonedBlock.querySelector('.cb-fullscreen__button');
          if (fullscreenButtonInClone) {
            // Force icon switching with JavaScript instead of CSS.
            const onIcon = fullscreenButtonInClone.querySelector('.fullscreen-on');
            const offIcon = fullscreenButtonInClone.querySelector('.fullscreen-off');

            if (onIcon && offIcon) {
              onIcon.style.display = 'none';
              offIcon.style.display = 'inline';
            }

            fullscreenButtonInClone.addEventListener('click', function(event) {
              event.preventDefault();
              event.stopPropagation();
              toggleFullscreen(clonedBlock);
            });
          }

          saveScrollPosition();
          setBodyOverflow(true);

          if (pluginConfig.enableEscapeKey) addKeyupListener();
          if (pluginConfig.exitOnBrowserBack) {
            history.pushState({ fullscreenActive: true }, '', window.location.href);
            addPopStateListener();
          }

          const pageBackgroundColor = getPageBackgroundColor();
          const textColor = getContrastTextColor(pageBackgroundColor);
          fullscreenContainer.style.backgroundColor = pageBackgroundColor;
          fullscreenContainer.style.color = textColor;

          const contentWrapper = document.createElement('div');
          contentWrapper.className = 'cb-fullscreen__content';

          // Add hidden description for screen readers.
          const description = document.createElement('div');
          description.id = 'fullscreen-description';
          description.className = 'cb-fullscreen__sr-only';
          // Styles handled in baseStyles.
          description.textContent = 'Use the font size controls to adjust text size. Press Escape to exit fullscreen.';

          const fontControls = createFontSizeControls();
          contentWrapper.appendChild(description);
          contentWrapper.appendChild(fontControls);
          contentWrapper.appendChild(clonedBlock);

          fullscreenContainer.appendChild(contentWrapper);

          addFontControlListeners(fontControls, clonedBlock);
          fontManager.applyFontSize(clonedBlock);

          if (pluginConfig.enableEscapeKey) {
            const hint = createFullscreenHint();
            fullscreenContainer.appendChild(hint);

            setTimeout(() => {
              if (hint && hint.parentNode) {
                hint.style.setProperty('transition', 'opacity 0.9s ease', 'important');
                hint.style.setProperty('opacity', '0', 'important');

                setTimeout(() => {
                  if (hint && hint.parentNode) {
                    hint.remove();
                  }
                }, CONSTANTS.FADE_TRANSITION_TIME);
              }
            }, CONSTANTS.HINT_DISPLAY_TIME);
          }

          // Show the fullscreen container.
          fullscreenContainer.style.visibility = 'visible';
          fullscreenContainer.style.transform = 'scale(1)';
          fullscreenContainer.style.pointerEvents = 'auto';
          fullscreenContainer.classList.add('cb-fullscreen__container--open');
          fullscreenState.isFullscreenActive = true;

          // Force layout recalculation to ensure stretching works.
          setTimeout(() => {
            fullscreenContainer.offsetHeight; // Force reflow
            clonedBlock.style.width = '100%';
            clonedBlock.style.maxWidth = 'none';
          }, 0);

          fullscreenContainer.focus();
          addFocusTrap(fullscreenContainer);
        }

        function exitFullscreen(fullscreenContainer) {
          setBodyOverflow(false);
          restoreScrollPosition();

          if (pluginConfig.enableEscapeKey) removeKeyupListener();
          if (pluginConfig.exitOnBrowserBack) {
            removePopStateListener();
            // Only go back if we're exiting due to escape key or button click (not back button).
            if (history.state && history.state.fullscreenActive) {
              history.back();
            }
          }

          removeFocusTrap();

          // Hide the fullscreen container.
          fullscreenContainer.style.visibility = 'hidden';
          fullscreenContainer.style.transform = 'scale(0.01)';
          fullscreenContainer.style.pointerEvents = 'none';
          fullscreenContainer.classList.remove('cb-fullscreen__container--open');
          fullscreenContainer.innerHTML = '';

          fullscreenState.isFullscreenActive = false;

          if (fullscreenState.originalCodeBlock) {
            const originalButton = fullscreenState.originalCodeBlock.querySelector('.cb-fullscreen__button');
            if (originalButton) {
              originalButton.setAttribute('aria-expanded', 'false');
              originalButton.blur();
            }
          }

          fullscreenState.originalCodeBlock = null;
        }

        // Utility functions.
        function createFontSizeControls() {
          const controls = document.createElement('div');
          controls.className = 'cb-fullscreen__font-controls';

          // Styles are controlled by external CSS file.

          controls.setAttribute('role', 'toolbar');
          controls.setAttribute('aria-label', 'Font size controls');
          controls.setAttribute('aria-orientation', 'horizontal');

          controls.innerHTML = \`
            <button class="cb-fullscreen__font-btn cb-fullscreen__font-btn--decrease"
                    type="button"
                    aria-label="Decrease font size (Double-click to reset to default)"
                    aria-describedby="font-size-status"
                    title="Decrease font size (Double-click to reset)"
                    style="border-radius: 6px !important; border: none !important;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" role="img">
                <title>Minus icon</title>
                <path d="M5 12h14"/>
              </svg>
            </button>
            <button class="cb-fullscreen__font-btn cb-fullscreen__font-btn--increase"
                    type="button"
                    aria-label="Increase font size"
                    aria-describedby="font-size-status"
                    title="Increase font size"
                    style="border-radius: 6px !important; border: none !important;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" role="img">
                <title>Plus icon</title>
                <path d="M12 5v14m-7-7h14"/>
              </svg>
            </button>
            <div id="font-size-status" class="cb-fullscreen__sr-only" aria-live="polite" aria-atomic="true" style="position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important;"></div>
          \`;
          return controls;
        }

        function createFullscreenHint() {
          const hint = document.createElement('div');
          hint.className = 'cb-fullscreen__hint';

          // Styles handled in baseStyles.

          hint.innerHTML = 'Press <kbd>Esc</kbd> to exit full screen';
          return hint;
        }

        function getPageBackgroundColor() {
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
            return bodyBg;
          }
          const fallbackBg = window.getComputedStyle(document.documentElement).backgroundColor;
          if (fallbackBg && fallbackBg !== 'rgba(0, 0, 0, 0)' && fallbackBg !== 'transparent') {
            return fallbackBg;
          }
          return '#ffffff';
        }

        function getContrastTextColor(backgroundColor) {
          const rgb = backgroundColor.match(/\\d+/g);
          if (rgb && rgb.length >= 3) {
            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
          }
          return '#000000';
        }

        function saveScrollPosition() {
          fullscreenState.scrollPosition = window.scrollY || document.documentElement.scrollTop;
        }

        function restoreScrollPosition() {
          if (typeof fullscreenState.scrollPosition === 'number' && !isNaN(fullscreenState.scrollPosition)) {
            setTimeout(() => {
              window.scrollTo({
                top: fullscreenState.scrollPosition,
                behavior: 'smooth',
              });
            }, 0);
          }
        }

        function setBodyOverflow(hidden) {
          if (hidden) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
          }
        }

        function handleKeyup(event) {
          if (event.key === 'Escape' && fullscreenState.isFullscreenActive) {
            const fullscreenContainer = domCache.container;
            if (fullscreenContainer) {
              exitFullscreen(fullscreenContainer);
            }
          }
        }

        function addKeyupListener() {
          document.removeEventListener('keyup', handleKeyup);
          document.addEventListener('keyup', handleKeyup);
        }

        function removeKeyupListener() {
          document.removeEventListener('keyup', handleKeyup);
        }

        function handlePopState(event) {
          if (fullscreenState.isFullscreenActive) {
            // Prevent the history.back() call in exitFullscreen from causing a loop.
            const isBackButtonPressed = !event.state || !event.state.fullscreenActive;
            if (isBackButtonPressed) {
              const fullscreenContainer = domCache.container;
              if (fullscreenContainer) {
                // Temporarily disable back button handling to prevent recursion.
                removePopStateListener();
                exitFullscreen(fullscreenContainer);
              }
            }
          }
        }

        function addPopStateListener() {
          window.removeEventListener('popstate', handlePopState);
          window.addEventListener('popstate', handlePopState);
        }

        function removePopStateListener() {
          window.removeEventListener('popstate', handlePopState);
        }

        function addFocusTrap(container) {
          const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"], summary, audio[controls], video[controls]'
          );

          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          function handleTabKey(event) {
            if (event.key === 'Tab') {
              if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                  event.preventDefault();
                  lastElement.focus();
                }
              } else {
                if (document.activeElement === lastElement) {
                  event.preventDefault();
                  firstElement.focus();
                }
              }
            }
          }

          container.addEventListener('keydown', handleTabKey);
          fullscreenState.focusTrapHandler = handleTabKey;
        }

        function removeFocusTrap() {
          const container = domCache.container;
          if (container && fullscreenState.focusTrapHandler) {
            container.removeEventListener('keydown', fullscreenState.focusTrapHandler);
            fullscreenState.focusTrapHandler = null;
          }
        }

        function addFontControlListeners(fontControls, codeBlock) {

          const decreaseBtn = fontControls.querySelector('.cb-fullscreen__font-btn--decrease');
          const increaseBtn = fontControls.querySelector('.cb-fullscreen__font-btn--increase');


          if (!decreaseBtn || !increaseBtn) {
            return;
          }

          let decreaseClickData = { lastClickTime: 0, clickCount: 0 };

          // Enhanced keyboard support for decrease button.
          decreaseBtn.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              decreaseBtn.click();
            }
          });

          decreaseBtn.addEventListener('click', (event) => {
            const currentTime = Date.now();
            const timeDifference = currentTime - decreaseClickData.lastClickTime;

            if (timeDifference < CONSTANTS.DOUBLE_CLICK_THRESHOLD) {
              decreaseClickData.clickCount++;
              if (decreaseClickData.clickCount === 2) {
                fontManager.resetFontSize(codeBlock);
                decreaseClickData.clickCount = 0;
                // Announce reset to screen readers.
                const statusElement = document.getElementById('font-size-status');
                if (statusElement) {
                  statusElement.textContent = 'Font size reset to default (100%)';
                  setTimeout(() => {
                    statusElement.textContent = '';
                  }, 1000);
                }
              }
            } else {
              decreaseClickData.clickCount = 1;
              fontManager.adjustFontSize(-CONSTANTS.FONT_ADJUSTMENT, codeBlock);
            }

            decreaseClickData.lastClickTime = currentTime;
            // Keep focus for keyboard users.
            if (event.detail === 0) { // Keyboard activation.
              decreaseBtn.focus();
            } else {
              // Blur for mouse clicks.
              decreaseBtn.blur();
            }
          });

          // Enhanced keyboard support for increase button.
          increaseBtn.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              increaseBtn.click();
            }
          });

          increaseBtn.addEventListener('click', (event) => {
            fontManager.adjustFontSize(CONSTANTS.FONT_ADJUSTMENT, codeBlock);
            // Keep focus for keyboard users.
            if (event.detail === 0) { // Keyboard activation.
              increaseBtn.focus();
            } else {
              // Blur for mouse clicks.
              increaseBtn.blur();
            }
          });
        }
      })();
      `,
		],
	});
}
