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
 * Opens a generic modal by ID.
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("hidden");
  
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
  if (modal) modal.classList.add("hidden");

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
  
  if (AppState.settings.spreadMode) {
    els.mainActionToolbar.style.display = "none";
  } else {
    els.mainActionToolbar.style.display = "flex";
  }
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
  let target = reset ? 100 : (AppState.settings.spreadZoom || 100) + delta;
  
  // Clamp between 70% and 250%
  target = Math.max(70, Math.min(250, target));
  
  AppState.settings.spreadZoom = target;
  localStorage.setItem("quran_spread_zoom", target);
  
  // Apply to .h-full value
  document.documentElement.style.setProperty('--h-full-value', `${target}%`);
  
  // Update Display
  if (els.zoomValDisplay) {
    els.zoomValDisplay.textContent = `${target}%`;
  }
};
