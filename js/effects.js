/**
 * Swipe effect: Flash the header's bottom border bright, then fade back.
 */
window.playSwipeEffect = function (direction) {
  const header = document.querySelector("header");
  if (!header) return;

  // Flash to bright theme color
  header.style.transition = "border-color 50ms ease-out";
  header.style.borderBottomColor = "rgb(var(--theme-400))";

  setTimeout(() => {
    header.style.transition = "border-color 250ms ease-in";
    header.style.borderBottomColor = "";
  }, 80);
};
