/**
 * @file actions.js
 * @description USER ACTIONS & BUSINESS LOGIC
 * State mutation logic for navigation, validation, and content updates.
 */

// Debounce timer for storage operations
let storageDebounceTimer = null;

/**
 * Debounced storage save helper
 * Waits 500ms after the last operation before saving to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
function debouncedStorageSave(key, value) {
  if (storageDebounceTimer) {
    clearTimeout(storageDebounceTimer);
  }
  storageDebounceTimer = setTimeout(() => {
    safeSetStorage(key, value);
  }, APP.STORAGE_SAVE_DEBOUNCE);
}

/**
 * Loads a Surah into focus. Navigates back to the first Ayah.
 * @param {number} id - Surah ID (1-114)
 */
window.loadSurah = function (id, retainAyahIndex = false) {
  const surah = AppState.data.find((s) => s.id === id);
  if (!surah) {
    console.error(`[loadSurah] Surah ${id} not found in data`);
    return;
  }

  // Show skeleton loader while loading content
  showSkeletonLoader();

  if (!retainAyahIndex) {
    AppState.currentAyahIndex = 0;
    safeSetStorage("last_ayah_index", 0);
  } else {
    // Ensure ayah index is within bounds
    const maxIndex = surah.verses.length - 1;
    if (AppState.currentAyahIndex > maxIndex) {
      console.warn(`[loadSurah] Ayah index ${AppState.currentAyahIndex} out of bounds for Surah ${id}, resetting to 0`);
      AppState.currentAyahIndex = 0;
      safeSetStorage("last_ayah_index", 0);
    }
  }

  const isNewSurah = AppState.currentSurah && AppState.currentSurah.id !== id;
  if (isNewSurah) {
    // Reset Hifz range when changing surahs to avoid confusing cross-surah state
    AppState.hifzRange = { start: null, end: null };
    safeSetStorage("quran_hifzRange", JSON.stringify(AppState.hifzRange));
    
    const text = "Klikni ajet za opseg";
    if (els.hifzRangeText) els.hifzRangeText.innerText = text;
    if (els.hifzRangeTextMobile) els.hifzRangeTextMobile.innerText = text;
  }
  
  AppState.currentSurah = surah;
  safeSetStorage(STORAGE_KEYS.LAST_SURAH, id);

  renderAyah();
  renderAyahGrid();
  updateProgress();

  // Hide skeleton loader and show content with fade-in animation after rendering
  hideSkeletonLoader();
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
  localStorage.setItem("last_ayah_index", AppState.currentAyahIndex);

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
  localStorage.setItem("last_ayah_index", AppState.currentAyahIndex);

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
    localStorage.setItem("last_ayah_index", idx);
    
    // Scroll to top of grid when navigating (mobile only)
    if (window.ayahGridMobile) {
      window.ayahGridMobile.scrollToTop();
    }
    
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

  // EveryAyah URL format
  return `https://everyayah.com/data/${AppState.currentReciter}/${suraStr}${ayahStr}.mp3`;
};

/**
 * Plays individual word audio from local assets.
 * @param {number} surahId 
 * @param {number} ayahId 
 * @param {number} wordIdx - 0-based word index
 */
// Singleton for word audio to prevent overlapping
let _activeWordAudio = null;

window.playWordAudio = function(surahId, ayahId, wordIdx) {
  if (AppState.settings.disableWordAudio) return;

  const sStr = String(surahId).padStart(3, "0");
  const aStr = String(ayahId).padStart(3, "0");
  const wStr = String(wordIdx + 1).padStart(3, "0");
  const url = `assets/audio/${sStr}/${sStr}_${aStr}_${wStr}.mp3`;

  // Stop previous word audio if playing
  if (_activeWordAudio) {
    _activeWordAudio.pause();
    _activeWordAudio.src = "";
  }

  // Optional: Pause main ayah recitation if it's playing
  if (els.ayahAudio && !els.ayahAudio.paused) {
      els.ayahAudio.pause();
      if (typeof resetAyahAudioUI === "function") resetAyahAudioUI();
  }

  _activeWordAudio = new Audio(url);
  
  // Suppress errors for missing local word audio files (expected behavior)
  _activeWordAudio.onerror = () => {
    // Silently ignore - word audio files are optional/local only
  };
  
  _activeWordAudio.play().catch(() => {
    // Silently ignore - word audio files are optional/local only
  });
};

/**
 * Advances to the next Ayah. Jumps to the next Surah if at the end of current.
 */
window.nextAyah = function () {
  if (!AppState.currentSurah) return;

  if (AppState.settings.spreadMode) {
    const currentAyah = AppState.currentSurah.verses[AppState.currentAyahIndex];
    const currentPage = getPageNumber(AppState.currentSurah.id, currentAyah.id);
    // Always jump +2 pages to next spread
    const nextP = currentPage + 2;
    goToPage(Math.min(604, nextP));
    return;
  }

  // --- HIFZ RANGE NAVIGATION ---
  if (AppState.hifzEnabled && AppState.hifzRange.start !== null && AppState.hifzRange.end !== null) {
    const min = Math.min(AppState.hifzRange.start, AppState.hifzRange.end);
    const max = Math.max(AppState.hifzRange.start, AppState.hifzRange.end);
    
    if (AppState.currentAyahIndex >= min && AppState.currentAyahIndex < max) {
      AppState.currentAyahIndex++;
    } else {
      AppState.currentAyahIndex = min; // Jump to start if outside or at the end
    }
    
    safeSetStorage("last_ayah_index", AppState.currentAyahIndex);
    renderAyah();
    if (typeof renderAyahGrid === "function") renderAyahGrid(); 
    return;
  }

  if (!AppState.swipeDirection) AppState.swipeDirection = "left";
  if (AppState.currentAyahIndex < AppState.currentSurah.verses.length - 1) {
    AppState.currentAyahIndex++;
    safeSetStorage("last_ayah_index", AppState.currentAyahIndex);
    renderAyah();
    if (typeof renderAyahGrid === "function") renderAyahGrid(); 
  } else {
    const nextSurahId = AppState.currentSurah.id + 1;
    if (nextSurahId <= 114) {
      els.surahSelect.value = nextSurahId;
      loadSurah(nextSurahId);
    }
  }
};

window.prevAyah = function () {
  if (!AppState.currentSurah) return;

  if (AppState.settings.spreadMode) {
    const currentAyah = AppState.currentSurah.verses[AppState.currentAyahIndex];
    const currentPage = getPageNumber(AppState.currentSurah.id, currentAyah.id);
    // Always jump -2 pages to previous spread
    const prevP = currentPage - 2;
    goToPage(Math.max(1, prevP));
    return;
  }

  if (!AppState.swipeDirection) AppState.swipeDirection = "right";
  
  // --- HIFZ RANGE NAVIGATION ---
  if (AppState.hifzEnabled && AppState.hifzRange.start !== null && AppState.hifzRange.end !== null) {
    const min = Math.min(AppState.hifzRange.start, AppState.hifzRange.end);
    const max = Math.max(AppState.hifzRange.start, AppState.hifzRange.end);
    
    if (AppState.currentAyahIndex > min && AppState.currentAyahIndex <= max) {
      AppState.currentAyahIndex--;
    } else {
      AppState.currentAyahIndex = max; // Loop back to end of Hifz range
    }
    
    safeSetStorage("last_ayah_index", AppState.currentAyahIndex);
    renderAyah();
    if (typeof renderAyahGrid === "function") renderAyahGrid(); 
    return;
  }

  if (AppState.currentAyahIndex > 0) {
    AppState.currentAyahIndex--;
    safeSetStorage("last_ayah_index", AppState.currentAyahIndex);
    renderAyah();
    if (typeof renderAyahGrid === "function") renderAyahGrid(); 
  } else {
    const prevSurahId = AppState.currentSurah.id - 1;
    if (prevSurahId >= 1) {
      els.surahSelect.value = prevSurahId;
      loadSurah(prevSurahId, true);
      AppState.currentAyahIndex = AppState.currentSurah.verses.length - 1;
      safeSetStorage(STORAGE_KEYS.LAST_AYAH_INDEX, AppState.currentAyahIndex);
      renderAyah();
      if (typeof renderAyahGrid === "function") renderAyahGrid(); 
    }
  }
};

/**
 * Applies spread mode UI state based on current setting.
 * Centralized function to ensure consistent UI updates.
 */
window.applySpreadMode = function() {
  // UI Feedback for the button
  if (els.spreadToggle) {
    els.spreadToggle.classList.toggle("text-emerald-500", AppState.settings.spreadMode);
    els.spreadToggle.classList.toggle("bg-slate-800", AppState.settings.spreadMode);
  }

  // Always show header when toggling
  const header = document.querySelector('header');
  if (header) header.classList.remove('header-hidden');


  // Handle Sidebar Visibility: hide sidebar in spread mode
  if (AppState.settings.spreadMode) {
    if (els.sidebar) els.sidebar.classList.add("md:hidden");
    if (els.appContainer) els.appContainer.classList.replace("max-w-[1400px]", "max-w-full");
    document.body.classList.add("spread-mode-active");
    if (els.zoomToolbar) els.zoomToolbar.classList.remove("hidden");
    if (els.pageThemeToggleContainer) els.pageThemeToggleContainer.classList.remove("hidden");
  } else {
    if (els.sidebar) els.sidebar.classList.remove("md:hidden");
    if (els.appContainer) els.appContainer.classList.replace("max-w-full", "max-w-[1400px]");
    document.body.classList.remove("spread-mode-active");
    if (els.zoomToolbar) els.zoomToolbar.classList.add("hidden");
    if (els.pageThemeToggleContainer) els.pageThemeToggleContainer.classList.add("hidden");
  }

};

/**
 * Toggles the side-by-side spread mode.
 */
window.toggleSpreadMode = function () {
    AppState.settings.spreadMode = !AppState.settings.spreadMode;
    localStorage.setItem("quran_spread_mode", AppState.settings.spreadMode);

    // Apply UI changes consistently
    window.applySpreadMode();

    renderAyah();
    if (typeof renderAyahGrid === "function") renderAyahGrid(); 
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

  debouncedStorageSave(STORAGE_KEYS.CHECKED_AYATS, JSON.stringify([...AppState.checkedAyats]));
  
  // Enable grid scroll when toggling valid status (User requested navigation)
  AppState._shouldScrollGrid = true;
  
  // Visual Feedback
  if (els.validBtn) {
    els.validBtn.classList.add("success-pop");
    setTimeout(() => els.validBtn.classList.remove("success-pop"), APP.SUCCESS_ANIMATION_DELAY);
  }

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
    STORAGE_KEYS.BOOKMARKS,
    JSON.stringify([...AppState.bookmarks]),
  );
  
  // Enable grid scroll when toggling bookmark
  AppState._shouldScrollGrid = true;
  
  // Visual Feedback
  if (els.bookmarkBtn) {
    els.bookmarkBtn.classList.add("success-pop");
    setTimeout(() => els.bookmarkBtn.classList.remove("success-pop"), APP.SUCCESS_ANIMATION_DELAY);
  }

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
 * Saves notes with size validation and truncation if needed.
 * @param {string} ayahKey - Key for the note (surah-id-ayah-id)
 * @param {string} text - Note text
 */
function saveNote(ayahKey, text) {
  // Validate and sanitize input
  const maxLength = APP.MAX_NOTE_LENGTH;
  if (text.length > maxLength) {
    console.warn(`[Notes] Note truncated from ${text.length} to ${maxLength} characters`);
    text = text.substring(0, maxLength);
  }

  if (!AppState.user.notes[ayahKey]) {
    AppState.user.notes[ayahKey] = {
      text: "",
      updated: Date.now()
    };
  }

  AppState.user.notes[ayahKey].text = text;
  AppState.user.notes[ayahKey].updated = Date.now();

  debouncedStorageSave(STORAGE_KEYS.NOTES, JSON.stringify(AppState.user.notes));
}

/**
 * Deletes a note for the given ayah.
 * @param {string} ayahKey - Key for the note
 */
function deleteNote(ayahKey) {
  if (AppState.user.notes[ayahKey]) {
    delete AppState.user.notes[ayahKey];
    debouncedStorageSave(STORAGE_KEYS.NOTES, JSON.stringify(AppState.user.notes));
  }
}

/**
 * Updates note text for the given ayah.
 * @param {string} ayahKey - Key for the note
 * @param {string} text - New note text
 */
function updateNoteText(ayahKey, text) {
  saveNote(ayahKey, text);
}

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
  a.download = `quran_progress_${new Date().toISOString().split("T")[0]}_${APP.VERSION}.json`;
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
      
      // Cleanup existing audio blobs before import
      if (typeof window.clearAllRecordings === "function") window.clearAllRecordings();

      if (Array.isArray(parsed.checkedAyats)) {
        AppState.checkedAyats = new Set(parsed.checkedAyats);
        safeSetStorage(STORAGE_KEYS.CHECKED_AYATS, JSON.stringify([...AppState.checkedAyats]));
      }
      if (Array.isArray(parsed.bookmarks)) {
        AppState.bookmarks = new Set(parsed.bookmarks);
        safeSetStorage(
          "quran_bookmarks",
          JSON.stringify([...AppState.bookmarks]),
        );
      }
      if (typeof parsed.notes === "object" && parsed.notes !== null) {
        AppState.notes = parsed.notes;
        safeSetStorage("quran_notes", JSON.stringify(AppState.notes));
      }
      if (typeof parsed.highlights === "object" && parsed.highlights !== null) {
        AppState.highlights = parsed.highlights;
        safeSetStorage(
          "quran_highlights",
          JSON.stringify(AppState.highlights),
        );
      }

      // Show success toast
      const successToast = document.createElement("div");
      successToast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce font-bold";
      successToast.textContent = "Progress uspješno uvežen!";
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);

      if (AppState.currentSurah) {
        renderAyah();
        renderAyahGrid();
        renderBookmarks();
        updateProgress();
      }
    } catch (err) {
      // Show error toast
      const errorToast = document.createElement("div");
      errorToast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce font-bold";
      errorToast.textContent = "Neispravna backup datoteka. Uvoz nije uspio.";
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 5000);
      console.error(err);
    }
    // reset input so the exact same file can be selected again if needed
    event.target.value = "";
  };
  reader.readAsText(file);
};
