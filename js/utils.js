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
  if (isNaN(seconds)) return "0:00";
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
  els.arSizeVal.innerText = `${AppState.settings.arSize}px`;
  els.arabicDisplay.style.fontSize = `${AppState.settings.arSize}px`;

  els.bsSizeSlider.value = AppState.settings.bsSize;
  els.bsSizeVal.innerText = `${AppState.settings.bsSize}px`;
  els.translationDisplay.style.fontSize = `${AppState.settings.bsSize}px`;

  els.arLhSlider.value = AppState.settings.arLineHeight;
  els.arLhVal.innerText = AppState.settings.arLineHeight;
  els.arabicDisplay.style.lineHeight = AppState.settings.arLineHeight;

  // Sync preview
  const previewAr = document.getElementById("settings-preview-ar");
  const previewBs = document.getElementById("settings-preview-bs");
  if (previewAr) {
    previewAr.style.fontSize = `${AppState.settings.arSize}px`;
    previewAr.style.lineHeight = AppState.settings.arLineHeight;
  }
  if (previewBs) {
    previewBs.style.fontSize = `${AppState.settings.bsSize}px`;
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
  els.progressPercent.textContent = `${percent}%`;
  els.progressBarFill.style.width = `${percent}%`;
};

/**
 * Searches the entire Quran dataset for a given query.
 * Supports patterns like "2:255" or free-text matching in Bosnian/Arabic.
 * @param {string} query
 * @returns {Array} List of matching result objects
 */
window.searchQuran = function (query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();

  // Check for Ayah exact reference "surah:ayah" e.g "2:255"
  const refMatch = q.match(/^(\d+):(\d+)$/);
  if (refMatch) {
    const sId = parseInt(refMatch[1], 10);
    const aId = parseInt(refMatch[2], 10);
    const surah = AppState.data.find((s) => s.id === sId);
    if (surah && surah.verses[aId - 1]) {
      return [
        {
          surahId: sId,
          surahName: surah.trans,
          ayahId: aId,
          ayahIndex: aId - 1,
          textAr: surah.verses[aId - 1].ar,
          textBs: surah.verses[aId - 1].bs,
        },
      ];
    }
    return [];
  }

  // Free text search
  const results = [];
  for (let s of AppState.data) {
    for (let i = 0; i < s.verses.length; i++) {
      const v = s.verses[i];
      if (
        v.bs.toLowerCase().includes(q) ||
        v.ar.includes(q) ||
        s.trans.toLowerCase().includes(q)
      ) {
        results.push({
          surahId: s.id,
          surahName: s.trans,
          ayahId: v.id,
          ayahIndex: i,
          textAr: v.ar,
          textBs: v.bs,
        });
        if (results.length > 50) return results; // Cap results for performance
      }
    }
  }
  return results;
};
