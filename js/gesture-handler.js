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
// Pull to refresh state
let ptrStartY = 0;
let pullDistance = 0;
const PTR_THRESHOLD = 120; // Distance to trigger refresh
const PTR_MAX_PULL = 180; // Max visual pull
let isPTRActive = false;

/**
 * Checks if touch target should ignore swipe gestures (for horizontal navigation)
 */
function shouldIgnoreSwipe(target) {
  return (
    target.closest("#sidebar") ||
    target.closest("#dwr-sidebar") ||
    target.closest("#dwr-settings") ||
    target.closest("#dwr-hifz") ||
    target.closest("#dwr-bookmarks") ||
    target.closest("#cnt-search-results") ||
    target.closest("#cnt-search-results-mobile") ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.closest(".modal-container")
  );
}

/**
 * Handles touchstart event
 */
function handleTouchStart(e) {
  if (!e.changedTouches || !e.changedTouches[0]) return;
  const target = e.target;
  const content = document.getElementById("cnt-main-content");
  
  // Horizontal swipe triggers (next/prev ayah) are more restrictive
  swipeActive = !shouldIgnoreSwipe(target);
  
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;

  // PTR detection - more global
  // Allow PTR even on ignored swipe elements (like header) IF main content is at top
  const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
  const inModal = target.closest(".modal-container");

  if (!isInput && !inModal && content && content.scrollTop === 0) {
    ptrStartY = e.changedTouches[0].screenY;
    isPTRActive = true;
    pullDistance = 0;
    
    // Reset indicator state
    const indicator = document.getElementById("ptr-indicator");
    if (indicator) {
      indicator.style.transition = "";
      indicator.style.transform = "translateY(-100%)";
      indicator.style.opacity = "0";
    }
  } else {
    isPTRActive = false;
  }
}

/**
 * Handles touchmove event for pull-to-refresh visuals
 */
function handleTouchMove(e) {
  if (!isPTRActive || !e.changedTouches || !e.changedTouches[0]) return;

  const currentY = e.changedTouches[0].screenY;
  const diffY = currentY - ptrStartY;

  const indicator = document.getElementById("ptr-indicator");
  if (!indicator) {
    isPTRActive = false;
    return;
  }

  const icon = document.getElementById("ptr-icon");

  if (diffY > 0) {
    // We are pulling down
    // Use logarithmic-ish resistance
    pullDistance = Math.min(diffY * 0.5, PTR_MAX_PULL);
    
    // Move from -100% to 0 and beyond
    // -64px is the height. So 0 pull = -64px. 
    indicator.style.transform = `translateY(${pullDistance - 64}px)`;
    indicator.style.opacity = Math.min(pullDistance / 60, 1);
    
    // Rotate icon based on pull
    if (icon) {
      icon.style.transform = `rotate(${pullDistance * 2}deg)`;
    }
  } else {
    // Pulling up above start
    pullDistance = 0;
    indicator.style.transform = "translateY(-100%)";
    indicator.style.opacity = "0";
  }
}

/**
 * Handles touchend event and triggers navigation or refresh
 */
function handleTouchEnd(e) {
  const indicator = document.getElementById("ptr-indicator");
  const icon = document.getElementById("ptr-icon");
  if (isPTRActive && pullDistance > PTR_THRESHOLD) {
    // Trigger Refresh
    if (indicator) {
      if (icon) icon.classList.add("animate-spin-slow");
      
      // Keep it visible for a moment before reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
    isPTRActive = false;
    return;
  }

  // Reset PTR visuals if not triggered
  if (indicator) {
    indicator.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    indicator.style.transform = "translateY(-100%)";
    indicator.style.opacity = "0";
    setTimeout(() => {
      indicator.style.transition = "";
    }, 300);
  }

  isPTRActive = false;

  if (!swipeActive || !e.changedTouches || !e.changedTouches[0]) return;
  swipeActive = false;

  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;
  const diffX = Math.abs(touchEndX - touchStartX);
  const diffY = Math.abs(touchEndY - touchStartY);

  // Detect horizontal swipe with more generous vertical tolerance (80px instead of 50px)
  if (diffX > diffY && diffX > SWIPE_THRESHOLD && diffY < 80) {
    if (touchEndX < touchStartX) {
      // Swipe left - next ayah
      AppState.swipeDirection = "left";
      if (typeof window.nextAyah === "function") window.nextAyah();
    } else {
      // Swipe right - previous ayah
      AppState.swipeDirection = "right";
      if (typeof window.prevAyah === "function") window.prevAyah();
    }
  }
}

/**
 * Initializes swipe gesture handlers
 */
window.initSwipeHandlers = function() {
  if (window._swipeHandlerInitialized) return;

  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchmove", handleTouchMove, { passive: true });
  document.addEventListener("touchend", handleTouchEnd, { passive: true });
  
  window._swipeHandlerInitialized = true;
};
