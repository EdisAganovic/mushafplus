/**
 * @file keyboard-shortcuts.js
 * @description KEYBOARD SHORTCUTS
 * Handles global keyboard shortcuts for navigation and actions.
 */

/**
 * Checks if user is typing in an input field (shortcuts should be disabled)
 */
function isTypingInInput() {
  const activeElement = document.activeElement;
  return (
    activeElement.tagName === "INPUT" ||
    activeElement.tagName === "TEXTAREA" ||
    activeElement.id === "search-input"
  );
}

/**
 * Handles keyboard shortcut events
 */
function handleKeyboardShortcut(e) {
  // Disable shortcuts if typing in input/textarea
  if (isTypingInInput()) return;

  // Navigation: Left/Right Arrows
  if (e.code === "ArrowRight") {
    if (typeof nextAyah === "function") nextAyah();
    return;
  }
  if (e.code === "ArrowLeft") {
    if (typeof prevAyah === "function") prevAyah();
    return;
  }

  // Quick Record: Space
  if (e.code === "Space") {
    e.preventDefault();
    if (typeof toggleRecording === "function") toggleRecording();
    return;
  }

  // Valid checkmark: V
  if (e.code === "KeyV" || e.key === "v") {
    e.preventDefault();
    if (typeof toggleCheckmark === "function") toggleCheckmark();
    return;
  }

  // Play/Pause Recitation: P or Enter
  if (e.code === "KeyP" || e.key === "p" || e.code === "Enter") {
    e.preventDefault();
    if (
      els.ayahAudioContainer &&
      !els.ayahAudioContainer.classList.contains("hidden")
    ) {
      if (els.ayahAudio) {
        els.ayahAudio.paused ? els.ayahAudio.play() : els.ayahAudio.pause();
      }
    }
    return;
  }

  // Play/Pause User recording: U
  if (e.code === "KeyU" || e.key === "u") {
    e.preventDefault();
    if (
      els.userAudioContainer &&
      !els.userAudioContainer.classList.contains("hidden")
    ) {
      if (els.audioPlayback) {
        els.audioPlayback.paused
          ? els.audioPlayback.play()
          : els.audioPlayback.pause();
      }
    }
    return;
  }

  // Zoom controls (only in spread mode): +, -, 0
  if (AppState.settings.spreadMode) {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      if (typeof updateSpreadZoom === "function") updateSpreadZoom(QURAN_CONSTANTS.ZOOM_STEP || 10);
      return;
    }
    if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      if (typeof updateSpreadZoom === "function") updateSpreadZoom(-(QURAN_CONSTANTS.ZOOM_STEP || 10));
      return;
    }
    if (e.key === "0") {
      e.preventDefault();
      if (typeof updateSpreadZoom === "function") updateSpreadZoom(0, true);
      return;
    }
  }
}

/**
 * Initializes keyboard shortcuts
 */
window.initKeyboardShortcuts = function() {
  if (window._keyboardShortcutsInitialized) return;
  
  document.onkeydown = handleKeyboardShortcut;
  window._keyboardShortcutsInitialized = true;
};

/**
 * Handles Escape key to close modals with proper focus management
 */
window.initEscapeKeyHandler = function() {
  if (window._escapeKeyHandlerInitialized) return;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const visibleModals = document.querySelectorAll(".modal-overlay:not(.hidden)");

      if (visibleModals.length > 0) {
        // Close the topmost visible modal
        const topModal = visibleModals[visibleModals.length - 1];

        // Release focus trap if present
        if (topModal._focusTrapHandler) {
          topModal.removeEventListener('keydown', topModal._focusTrapHandler);
          delete topModal._focusTrapHandler;
        }

        topModal.classList.add("hidden");

        // Return focus to the trigger element
        const triggerId = topModal.getAttribute('data-trigger');
        if (triggerId) {
          const trigger = document.getElementById(triggerId);
          if (trigger) trigger.focus();
        }
      }
    }
  });
  window._escapeKeyHandlerInitialized = true;
};
