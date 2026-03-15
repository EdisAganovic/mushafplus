/**
 * @file utils.js
 * @description HELPER UTILITIES
 * Stateless utility functions for data formatting and global UI synchronization.
 */

/**
 * Converts seconds into MM:SS format.
 * @param {number} seconds
 * @returns {string} e.g. "3:45"
 */
window.formatTime = function (seconds) {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

/**
 * Updates CSS properties on the main display based on AppState settings.
 * Synchronizes slider values with their display labels.
 */
window.applySettings = function () {
  els.arSizeSlider.value = AppState.settings.arSize;
  els.arSizeVal.innerText = `${AppState.settings.arSize}%`;
  els.arabicDisplay.style.fontSize = `${AppState.settings.arSize / 100}rem`;

  els.bsSizeSlider.value = AppState.settings.bsSize;
  els.bsSizeVal.innerText = `${AppState.settings.bsSize}%`;
  els.translationDisplay.style.fontSize = `${AppState.settings.bsSize / 100}rem`;

  els.arLhSlider.value = AppState.settings.arLineHeight;
  els.arLhVal.innerText = AppState.settings.arLineHeight;
  els.arabicDisplay.style.lineHeight = AppState.settings.arLineHeight;

  // Sync preview
  if (els.settingsPreviewAr) {
    els.settingsPreviewAr.style.fontSize = `${AppState.settings.arSize / 100}rem`;
    els.settingsPreviewAr.style.lineHeight = AppState.settings.arLineHeight;
  }
  if (els.settingsPreviewBs) {
    els.settingsPreviewBs.style.fontSize = `${AppState.settings.bsSize / 100}rem`;
  }

  // Audio Player Visibility
  if (els.audioToggle) {
    els.audioToggle.checked = AppState.settings.showAudioPlayer;
  }
  if (els.wordAudioToggle) {
    els.wordAudioToggle.checked = AppState.settings.disableWordAudio;
  }
  if (els.ayahAudioContainer) {
    els.ayahAudioContainer.classList.toggle("hidden-player", !AppState.settings.showAudioPlayer);
  }
};

/**
 * Calculates surah completion percentage based on checked ayats.
 * Updates the sidebar progress bar and percentage label.
 */
window.updateProgress = function () {
  if (!AppState.currentSurah) return;
  const total = AppState.currentSurah.verses.length;
  let checkedCount = 0;

  AppState.currentSurah.verses.forEach((v) => {
    if (AppState.checkedAyats.has(`${AppState.currentSurah.id}-${v.id}`)) {
      checkedCount++;
    }
  });

  const percent = Math.round((checkedCount / total) * 100);
  els.progressPercent.textContent = `${checkedCount} / ${total}`;
  els.progressBarFill.style.width = `${percent}%`;
};

/**
 * Asynchronously debounces saving data to localStorage to avoid blocking the main thread.
 */
let debounceTimer = null;
let storageQueue = {};

window.debouncedStorageSave = function (key, data) {
  storageQueue[key] = data;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const saveToDisk = () => {
      for (const k in storageQueue) {
        try {
          localStorage.setItem(k, storageQueue[k]);
        } catch (e) {
          console.error("Storage save error", e);
        }
      }
      storageQueue = {};
    };

    if (window.requestIdleCallback) {
      requestIdleCallback(saveToDisk, { timeout: 1000 });
    } else {
      saveToDisk();
    }
  }, 300);
};
