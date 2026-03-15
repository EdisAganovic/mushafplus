/**
 * @file gesture-handler.js
 * @description TOUCH GESTURES
 * Handles swipe gestures for navigation on mobile devices.
 */

// Swipe state
let touchStartX = 0;
let touchStartY = 0;
let swipeActive = false;
const SWIPE_THRESHOLD = 60;

/**
 * Checks if touch target should ignore swipe gestures
 */
function shouldIgnoreSwipe(target) {
  return (
    target.closest("#sidebar") ||
    target.closest("#settings-drawer") ||
    target.closest("#search-results-container") ||
    target.closest("#search-results-container-mobile") ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * Handles touchstart event
 */
function handleTouchStart(e) {
  const target = e.target;
  
  if (shouldIgnoreSwipe(target)) {
    swipeActive = false;
    return;
  }
  
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
  swipeActive = true;
}

/**
 * Handles touchend event and triggers navigation
 */
function handleTouchEnd(e) {
  if (!swipeActive) return;
  swipeActive = false;

  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;
  const diffX = Math.abs(touchEndX - touchStartX);
  const diffY = Math.abs(touchEndY - touchStartY);

  // Detect horizontal swipe with minimal vertical movement
  if (diffX > diffY && diffX > SWIPE_THRESHOLD && diffY < 50) {
    if (touchEndX < touchStartX) {
      // Swipe left - next ayah
      AppState.swipeDirection = "left";
      if (typeof nextAyah === "function") nextAyah();
    } else {
      // Swipe right - previous ayah
      AppState.swipeDirection = "right";
      if (typeof prevAyah === "function") prevAyah();
    }
  }
}

/**
 * Initializes swipe gesture handlers
 */
window.initSwipeHandlers = function() {
  if (window._swipeHandlerInitialized) return;

  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchend", handleTouchEnd, { passive: true });
  
  window._swipeHandlerInitialized = true;
};
