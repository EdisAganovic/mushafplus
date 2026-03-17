/**
 * @file ui-state.js
 * @description UI STATE MANAGEMENT
 * Handles opening/closing of all drawers, modals, and overlays.
 */

/**
 * Opens the main navigation sidebar (drawer).
 */
function openSidebar() {
  try {
    if (typeof closeSettings === "function") closeSettings();
    if (typeof closeBookmarks === "function") closeBookmarks();
    if (typeof closeHifz === "function") closeHifz();
    if (els.sidebarOverlay && els.sidebar) {
      els.sidebarOverlay.classList.remove("hidden");
      setTimeout(() => {
        els.sidebarOverlay.classList.remove("opacity-0");
        els.sidebar.classList.remove("translate-x-full");
      }, 10);
    }
  } catch (e) {
    console.error("[UI] Error opening sidebar:", e);
  }
}

/**
 * Closes the main navigation sidebar.
 */
function closeSidebar() {
  try {
    if (els.sidebarOverlay && els.sidebar) {
      els.sidebarOverlay.classList.add("opacity-0");
      els.sidebar.classList.add("translate-x-full");
      setTimeout(() => {
        els.sidebarOverlay.classList.add("hidden");
      }, 300);
    }
  } catch (e) {
    console.error("[UI] Error closing sidebar:", e);
  }
}

/**
 * Opens the settings drawer.
 */
function openSettings() {
  try {
    if (typeof closeSidebar === "function") closeSidebar();
    if (typeof closeBookmarks === "function") closeBookmarks();
    if (typeof closeHifz === "function") closeHifz();
    if (els.settingsOverlay && els.settingsDrawer) {
      els.settingsOverlay.classList.remove("hidden");
      setTimeout(() => {
        els.settingsOverlay.classList.remove("opacity-0");
        els.settingsDrawer.classList.remove("translate-x-full");
      }, 10);
    }
  } catch (e) {
    console.error("[UI] Error opening settings:", e);
  }
}

/**
 * Closes the settings drawer.
 */
function closeSettings() {
  try {
    if (els.settingsOverlay && els.settingsDrawer) {
      els.settingsOverlay.classList.add("opacity-0");
      els.settingsDrawer.classList.add("translate-x-full");
      setTimeout(() => {
        els.settingsOverlay.classList.add("hidden");
      }, 300);
    }
  } catch (e) {
    console.error("[UI] Error closing settings:", e);
  }
}

/**
 * Opens the bookmarks drawer.
 */
function openBookmarks() {
  try {
    if (typeof closeSidebar === "function") closeSidebar();
    if (typeof closeSettings === "function") closeSettings();
    if (typeof closeHifz === "function") closeHifz();
    if (els.bookmarksOverlay && els.bookmarksDrawer) {
      els.bookmarksOverlay.classList.remove("hidden");
      setTimeout(() => {
        els.bookmarksOverlay.classList.remove("opacity-0");
        els.bookmarksDrawer.classList.remove("translate-x-full");
      }, 10);
    }
  } catch (e) {
    console.error("[UI] Error opening bookmarks:", e);
  }
}

/**
 * Closes the bookmarks drawer.
 */
function closeBookmarks() {
  try {
    if (els.bookmarksOverlay && els.bookmarksDrawer) {
      els.bookmarksOverlay.classList.add("opacity-0");
      els.bookmarksDrawer.classList.add("translate-x-full");
      setTimeout(() => {
        els.bookmarksOverlay.classList.add("hidden");
      }, 300);
    }
  } catch (e) {
    console.error("[UI] Error closing bookmarks:", e);
  }
}

/**
 * Opens the Hifz drawer.
 */
function openHifz() {
  try {
    if (typeof closeSidebar === "function") closeSidebar();
    if (typeof closeSettings === "function") closeSettings();
    if (typeof closeBookmarks === "function") closeBookmarks();
    if (els.hifzOverlay && els.hifzDrawer) {
      els.hifzOverlay.classList.remove("hidden");
      setTimeout(() => {
        els.hifzOverlay.classList.remove("opacity-0");
        els.hifzDrawer.classList.remove("translate-x-full");
        // Force re-render of the grid to ensure hifz highlighting is visible
        if (typeof window.renderAyahGrid === "function") {
          window.renderAyahGrid(true);
        }
      }, 10);
    }
  } catch (e) {
    console.error("[UI] Error opening hifz:", e);
  }
}

/**
 * Closes the Hifz drawer.
 */
function closeHifz() {
  try {
    if (els.hifzOverlay && els.hifzDrawer) {
      els.hifzOverlay.classList.add("opacity-0");
      els.hifzDrawer.classList.add("translate-x-full");
      setTimeout(() => {
        els.hifzOverlay.classList.add("hidden");
      }, 300);
    }
  } catch (e) {
    console.error("[UI] Error closing hifz:", e);
  }
}

/**
 * Stores the currently focused element before modal opens (for focus return)
 */
let lastFocusedElementBeforeModal = null;

/**
 * Gets all focusable elements within a container
 */
function getFocusableElements(container) {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)).filter(el => {
    return el.offsetParent !== null; // Visible elements only
  });
}

/**
 * Sets up focus trap within a modal
 */
function trapFocusInModal(modal) {
  const focusableElements = getFocusableElements(modal);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (firstFocusable) {
    firstFocusable.focus();
  }

  // Remove any existing focus trap listener
  modal.removeEventListener('keydown', handleModalTabKey);
  modal._focusTrapHandler = handleModalTabKey;

  modal.addEventListener('keydown', handleModalTabKey);

  function handleModalTabKey(e) {
    if (e.key !== 'Tab') return;

    // Refresh focusable elements in case content changed
    const currentFocusable = getFocusableElements(modal);
    const first = currentFocusable[0];
    const last = currentFocusable[currentFocusable.length - 1];

    if (!currentFocusable.length) return;

    if (e.shiftKey) {
      // Shift + Tab: going backwards
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

/**
 * Releases focus trap from a modal
 */
function releaseFocusTrap(modal) {
  if (modal && modal._focusTrapHandler) {
    modal.removeEventListener('keydown', modal._focusTrapHandler);
    delete modal._focusTrapHandler;
  }
}

/**
 * Opens a generic modal by ID.
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  // Store the currently focused element for later restoration
  lastFocusedElementBeforeModal = document.activeElement;

  modal.classList.remove("hidden");

  // Set up focus trapping
  trapFocusInModal(modal);

  // Explicitly hide sidebar for Surah selector as requested
  if (id === "mdl-surah" && els.sidebar) {
    els.sidebar.classList.add("md:hidden");
    if (typeof closeSidebar === "function") closeSidebar();
  }

  updateToolbarVisibility();
}

/**
 * Closes a generic modal by ID.
 */
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  // Release focus trap
  releaseFocusTrap(modal);

  modal.classList.add("hidden");

  // Return focus to the element that was focused before modal opened
  if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === "function") {
    lastFocusedElementBeforeModal.focus();
  }
  lastFocusedElementBeforeModal = null;

  // Restore sidebar visibility when closing Surah selector (only if not in spread mode)
  if (id === "mdl-surah" && els.sidebar && !AppState.settings.spreadMode) {
    els.sidebar.classList.remove("md:hidden");
  }

  updateToolbarVisibility();
}

/**
 * Centrally manages the visibility of the primary action toolbar.
 * (Currently disabled based on user preference - toolbar stays visible)
 */
window.updateToolbarVisibility = function() {
  if (!els.mainActionToolbar) return;
  
  const showToolbar = AppState.settings.showActionsToolbar && !AppState.settings.spreadMode;
  els.mainActionToolbar.style.display = showToolbar ? "flex" : "none";
};

/**
 * Closes all open menus and modals at once.
 * Used by overlay clicks and navigation toggles.
 */
function closeAllMenusAndModals() {
  try {
    if (els?.sidebarOverlay && !els.sidebarOverlay.classList.contains("hidden"))
      closeSidebar();
    if (els?.settingsOverlay && !els.settingsOverlay.classList.contains("hidden"))
      closeSettings();
    if (els?.bookmarksOverlay && !els.bookmarksOverlay.classList.contains("hidden"))
      closeBookmarks();
    if (els?.hifzOverlay && !els.hifzOverlay.classList.contains("hidden"))
      closeHifz();

    if (els.surahModal && !els.surahModal.classList.contains("hidden"))
      closeModal("mdl-surah");

    if (els.searchModal && !els.searchModal.classList.contains("hidden"))
      closeModal("mdl-search");

    // Visibility is handled by the close* functions above via updateToolbarVisibility()
  } catch (e) {
    console.error("[UI] Error closing menus:", e);
  }
}

/**
 * Updates the visual state of quick theme toggle dots.
 */
function updateThemeDotsUI() {
  if (!els.themeDots) return;
  const current = AppState.settings.pageTheme || "original";
  els.themeDots.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-theme") === current);
  });
}

/**
 * Updates the zoom level for spread mode.
 * @param {number} delta - Amount to change zoom by
 * @param {boolean} reset - If true, resets to 100%
 */
window.updateSpreadZoom = function(delta = 0, reset = false) {
  const MIN_ZOOM = QURAN_CONSTANTS.MIN_ZOOM || 50;
  const MAX_ZOOM = QURAN_CONSTANTS.MAX_ZOOM || 300;

  let target = reset ? QURAN_CONSTANTS.DEFAULT_ZOOM || 100 : (AppState.settings.spreadZoom || 100) + delta;

  // Clamp between MIN_ZOOM and MAX_ZOOM
  target = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target));

  AppState.settings.spreadZoom = target;
  localStorage.setItem("quran_spread_zoom", target);

  // Apply to .h-full value
  document.documentElement.style.setProperty('--h-full-value', `${target}%`);

  // Update Display
  if (els.zoomValDisplay) {
    els.zoomValDisplay.textContent = `${target}%`;
  }
};
