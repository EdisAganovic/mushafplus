/**
 * @file actions.js
 * @description USER ACTIONS & BUSINESS LOGIC
 * State mutation logic for navigation, validation, and content updates.
 */

/**
 * Loads a Surah into focus. Navigates back to the first Ayah.
 * @param {number} id - Surah ID (1-114)
 */
window.loadSurah = function (id) {
  const surah = AppState.data.find((s) => s.id === id);
  if (!surah) return;

  AppState.currentSurah = surah;
  AppState.currentAyahIndex = 0;
  localStorage.setItem("last_surah", id);

  renderAyah();
  renderAyahGrid();
  updateProgress();
};

/**
 * Jumps to the first ayah of a given Juz.
 * @param {number} juz - Juz number (1-30)
 */
window.goToJuz = function (juz) {
  if (juz < 1 || juz > 30) return;
  const juzData = window.JUZ_DATA[juz];
  if (!juzData) return;
  const [sId, aId] = juzData;
  const surah = AppState.data.find((s) => s.id === sId);
  if (!surah) return;

  AppState.currentSurah = surah;
  // Find index of ayah with ID aId
  AppState.currentAyahIndex = surah.verses.findIndex((v) => v.id === aId);
  els.surahSelect.value = sId;
  localStorage.setItem("last_surah", sId);

  renderAyah();
  renderAyahGrid();
  updateProgress();
};

/**
 * Jumps to the first ayah of a given Page.
 * @param {number} page - Page number (1-604)
 */
window.goToPage = function (page) {
  if (page < 1 || page > 604) return;
  const pageData = window.PAGE_DATA[page];
  if (!pageData) return;
  const [sId, aId] = pageData;
  const surah = AppState.data.find((s) => s.id === sId);
  if (!surah) return;

  AppState.currentSurah = surah;
  AppState.currentAyahIndex = surah.verses.findIndex((v) => v.id === aId);
  els.surahSelect.value = sId;
  localStorage.setItem("last_surah", sId);

  renderAyah();
  renderAyahGrid();
  updateProgress();
};

/**
 * Jumps to a specific Ayah index within the current surah.
 * @param {number} ayahNum - 1-based Ayah number
 */
window.goToAyah = function (ayahNum) {
  if (!AppState.currentSurah) return;
  const idx = ayahNum - 1;
  if (idx >= 0 && idx < AppState.currentSurah.verses.length) {
    AppState.currentAyahIndex = idx;
    renderAyah();
  }
};

/**
 * Returns the correct audio URL for an ayah based on reciter settings.
 * @param {number} surahId
 * @param {number} ayahId
 * @returns {string} Audio URL
 */
window.getAyahAudioUrl = function (surahId, ayahId) {
  const suraStr = String(surahId).padStart(3, "0");
  const ayahStr = String(ayahId).padStart(3, "0");

  if (AppState.currentReciter === "local") {
    return `mp3/${suraStr}${ayahStr}.mp3`;
  } else {
    // EveryAyah URL format
    return `https://everyayah.com/data/${AppState.currentReciter}/${suraStr}${ayahStr}.mp3`;
  }
};

/**
 * Advances to the next Ayah. Jumps to the next Surah if at the end of current.
 */
window.nextAyah = function () {
  if (!AppState.currentSurah) return;
  if (!AppState.swipeDirection) AppState.swipeDirection = "left";
  if (AppState.currentAyahIndex < AppState.currentSurah.verses.length - 1) {
    AppState.currentAyahIndex++;
    renderAyah();
  } else {
    const nextSurahId = AppState.currentSurah.id + 1;
    if (nextSurahId <= 114) {
      els.surahSelect.value = nextSurahId;
      loadSurah(nextSurahId);
    }
  }
};

/**
 * Returns to previous Ayah. Jumps to previous Surah if at the start of current.
 */
window.prevAyah = function () {
  if (!AppState.currentSurah) return;
  if (!AppState.swipeDirection) AppState.swipeDirection = "right";
  if (AppState.currentAyahIndex > 0) {
    AppState.currentAyahIndex--;
    renderAyah();
  } else {
    const prevSurahId = AppState.currentSurah.id - 1;
    if (prevSurahId >= 1) {
      els.surahSelect.value = prevSurahId;
      loadSurah(prevSurahId);
      AppState.currentAyahIndex = AppState.currentSurah.verses.length - 1;
      renderAyah();
    }
  }
};

/**
 * Persistently toggles the 'checked' status of the current Ayah.
 */
window.toggleCheckmark = function () {
  if (!AppState.currentSurah) return;
  const ayah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  const key = `${AppState.currentSurah.id}-${ayah.id}`;

  if (AppState.checkedAyats.has(key)) {
    AppState.checkedAyats.delete(key);
  } else {
    AppState.checkedAyats.add(key);
  }

  debouncedStorageSave(
    "quran_checked",
    JSON.stringify([...AppState.checkedAyats]),
  );
  renderAyah();
  if (typeof updateGridCellState === "function") {
    updateGridCellState(AppState.currentAyahIndex);
  } else {
    renderAyahGrid();
  }
  updateProgress();
};

/**
 * Persistently toggles the 'bookmarked' status of the current Ayah.
 */
window.toggleBookmark = function () {
  if (!AppState.currentSurah) return;
  const ayah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  const key = `${AppState.currentSurah.id}-${ayah.id}`;

  if (AppState.bookmarks.has(key)) {
    AppState.bookmarks.delete(key);
  } else {
    AppState.bookmarks.add(key);
  }

  debouncedStorageSave(
    "quran_bookmarks",
    JSON.stringify([...AppState.bookmarks]),
  );
  renderAyah();
  renderBookmarks();
};

/**
 * Persistently toggles highlight on a specific word index within an Ayah.
 */
window.toggleWordHighlight = function (ayahKey, wordIdx) {
  if (!AppState.highlights[ayahKey]) AppState.highlights[ayahKey] = [];
  const index = AppState.highlights[ayahKey].indexOf(wordIdx);
  if (index > -1) {
    AppState.highlights[ayahKey].splice(index, 1);
    if (AppState.highlights[ayahKey].length === 0)
      delete AppState.highlights[ayahKey];
  } else {
    AppState.highlights[ayahKey].push(wordIdx);
  }
  debouncedStorageSave("quran_highlights", JSON.stringify(AppState.highlights));
  renderAyah();
};

/**
 * Exports user progress (checked ayats, notes, highlights) to a JSON file.
 */
window.exportProgress = function () {
  const data = {
    checkedAyats: [...AppState.checkedAyats],
    bookmarks: [...AppState.bookmarks],
    notes: AppState.notes,
    highlights: AppState.highlights,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `quran_progress_${new Date().toISOString().split("T")[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

/**
 * Imports user progress from a selected JSON file.
 */
window.importProgress = function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);

      if (Array.isArray(parsed.checkedAyats)) {
        AppState.checkedAyats = new Set(parsed.checkedAyats);
        localStorage.setItem(
          "quran_checked",
          JSON.stringify([...AppState.checkedAyats]),
        );
      }
      if (Array.isArray(parsed.bookmarks)) {
        AppState.bookmarks = new Set(parsed.bookmarks);
        localStorage.setItem(
          "quran_bookmarks",
          JSON.stringify([...AppState.bookmarks]),
        );
      }
      if (typeof parsed.notes === "object" && parsed.notes !== null) {
        AppState.notes = parsed.notes;
        localStorage.setItem("quran_notes", JSON.stringify(AppState.notes));
      }
      if (typeof parsed.highlights === "object" && parsed.highlights !== null) {
        AppState.highlights = parsed.highlights;
        localStorage.setItem(
          "quran_highlights",
          JSON.stringify(AppState.highlights),
        );
      }

      alert("Progress imported successfully!");
      if (AppState.currentSurah) {
        renderAyah();
        renderAyahGrid();
        renderBookmarks();
        updateProgress();
      }
    } catch (err) {
      alert("Invalid backup file. Could not import progress.");
      console.error(err);
    }
    // reset input so the exact same file can be selected again if needed
    event.target.value = "";
  };
  reader.readAsText(file);
};
