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
  els.arSizeVal.innerText = `${AppState.settings.arSize}%`;
  els.arabicDisplay.style.fontSize = `${AppState.settings.arSize / 100}rem`;

  els.bsSizeSlider.value = AppState.settings.bsSize;
  els.bsSizeVal.innerText = `${AppState.settings.bsSize}%`;
  els.translationDisplay.style.fontSize = `${AppState.settings.bsSize / 100}rem`;

  els.arLhSlider.value = AppState.settings.arLineHeight;
  els.arLhVal.innerText = AppState.settings.arLineHeight;
  els.arabicDisplay.style.lineHeight = AppState.settings.arLineHeight;

  // Sync preview
  const previewAr = document.getElementById("settings-preview-ar");
  const previewBs = document.getElementById("settings-preview-bs");
  if (previewAr) {
    previewAr.style.fontSize = `${AppState.settings.arSize / 100}rem`;
    previewAr.style.lineHeight = AppState.settings.arLineHeight;
  }
  if (previewBs) {
    previewBs.style.fontSize = `${AppState.settings.bsSize / 100}rem`;
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
          score: 100, // Direct reference matches score highest
        },
      ];
    }
    return [];
  }

  // Free text search
  const results = [];

  // Helper to escape regex special characters
  const escapeRegExp = (string) =>
    string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedQ = escapeRegExp(q);
  // Boundary regex for multi-language (matches start/end of string or common punctuation/spaces)
  const boundaryRegex = new RegExp(
    `(^|[\\s.,!?;:'"()\\-])(${escapedQ})([\\s.,!?;:'"()\\-]|$)(?![^<]*>)`,
    "i",
  );

  for (let s of AppState.data) {
    for (let i = 0; i < s.verses.length; i++) {
      const v = s.verses[i];
      const bsLower = v.bs.toLowerCase();
      const sTransLower = s.trans.toLowerCase();

      let matched = false;
      let score = 0;

      // Check Bosnian Translation
      if (bsLower.includes(q)) {
        matched = true;
        score += boundaryRegex.test(bsLower) ? 10 : 1;
      }
      // Check Arabic Text
      if (v.ar.includes(q)) {
        matched = true;
        score += boundaryRegex.test(v.ar) ? 10 : 1;
      }
      // Check Surah Name
      if (sTransLower.includes(q)) {
        matched = true;
        score += boundaryRegex.test(sTransLower) ? 10 : 1;
      }

      if (matched) {
        results.push({
          surahId: s.id,
          surahName: s.trans,
          ayahId: v.id,
          ayahIndex: i,
          textAr: v.ar,
          textBs: v.bs,
          score: score,
        });
      }
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 50); // Cap results for performance
};
