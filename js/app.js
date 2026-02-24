/**
 * @file app.js
 * @description APPLICATION ORCHESTRATOR
 * This is the entry point that initializes the app and sets up global event listeners.
 */

/**
 * Main Initialization Sequence.
 * - Checks for data presence.
 * - Seeds the UI.
 * - Restores last session state.
 */
async function init() {
  try {
    if (els.syncStatus) els.syncStatus.innerText = T.loading;

    // 1. Validate Data Source (from quran_data.js)
    if (typeof QURAN_DATA === "undefined") {
      throw new Error("QURAN_DATA missing. Check quran_data.js.");
    }
    AppState.data = QURAN_DATA;

    // 2. Setup Base UI
    populateSurahSelect();
    setupEventListeners();

    // 3. Restore Session (default to surah 1)
    const lastSurah = localStorage.getItem("last_surah") || "1";
    els.surahSelect.value = lastSurah;
    loadSurah(parseInt(lastSurah));

    // 4. Load Bookmarks & Theme
    renderBookmarks();
    const savedTheme = localStorage.getItem("quran_theme") || "";
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      els.themeSelect.value = savedTheme;
    }
    const autoplayState = localStorage.getItem("quran_autoplay");
    if (autoplayState !== null) {
      els.autoplayToggle.checked = autoplayState === "true";
    }

    // Set initial toggle states
    els.tajweedToggle.checked = AppState.settings.tajweed;
    if (AppState.settings.tajweed) {
      document.body.classList.add("tajweed-active");
    }

    els.tajweedLegendToggle.checked = AppState.settings.tajweedLegend;

    els.lightmodeToggle.checked = AppState.settings.lightMode;
    if (AppState.settings.lightMode) {
      document.documentElement.classList.add("light");
    }

    applySettings();
    applyTranslations();
    if (els.syncStatus) els.syncStatus.innerText = T.ready;

    // Swipe UX: Show tutorial toast on first visit (mobile only)
    if (
      !localStorage.getItem("swipe_tutorial_seen") &&
      window.innerWidth < 768
    ) {
      setTimeout(() => {
        if (els.swipeToast) {
          els.swipeToast.classList.add("show");
          localStorage.setItem("swipe_tutorial_seen", "true");
          // Remove after animation completes
          setTimeout(() => els.swipeToast.classList.remove("show"), 3600);
        }
      }, 1200);
    }
  } catch (error) {
    console.error("Init failed:", error);
    if (els.syncStatus) els.syncStatus.innerText = T.error;
    alert("Load Error: " + error.message);
  }
}

/**
 * Fills the Surah dropdown menu.
 */
function populateSurahSelect() {
  AppState.data.forEach((surah) => {
    const option = document.createElement("option");
    option.value = surah.id;
    option.textContent = `${surah.id}. ${surah.trans} (${surah.name})`;
    option.className = "bg-slate-900";
    els.surahSelect.appendChild(option);
  });
}

/**
 * Registers all DOM event listeners and keyboard shortcuts.
 */
function setupEventListeners() {
  // --- NAVIGATION & SEARCH ---
  els.surahSelect.onchange = (e) => loadSurah(parseInt(e.target.value));
  els.nextBtn.onclick = nextAyah;
  els.prevBtn.onclick = prevAyah;

  // Search logic — shared between desktop and mobile
  let debounceTimeout;
  function handleSearchInput(query, inputEl, containerEl, listEl, emptyEl) {
    clearTimeout(debounceTimeout);
    if (query.trim().length < 2) {
      containerEl.classList.add("hidden");
      return;
    }
    debounceTimeout = setTimeout(() => {
      const results = searchQuran(query);
      listEl.innerHTML = "";
      if (results.length === 0) {
        emptyEl.classList.remove("hidden");
        containerEl.classList.remove("hidden");
        return;
      }
      emptyEl.classList.add("hidden");

      // Highlight helper
      const escapeRegExp = (string) =>
        string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedQ = escapeRegExp(query.trim());
      const highlightRegex = new RegExp(`(${escapedQ})`, "gi");
      const highlightMatch = (text) => {
        if (!text) return "";
        return text.replace(
          highlightRegex,
          `<strong style="background-color: rgba(16, 185, 129, 0.3); color: #6ee7b7; padding: 0 4px; border-radius: 4px;">$&</strong>`,
        );
      };

      results.forEach((res) => {
        const item = document.createElement("div");
        item.className =
          "p-3 hover:bg-slate-800 border-b border-slate-800 cursor-pointer transition-colors";

        const arHighlighted = highlightMatch(res.textAr);
        const bsHighlighted = highlightMatch(res.textBs);

        item.innerHTML = `
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-bold text-emerald-500">${res.surahName} ${res.surahId}:${res.ayahId}</span>
          </div>
          <div class="text-sm text-slate-200 line-clamp-2 leading-relaxed" dir="rtl">${arHighlighted}</div>
          <div class="text-[11px] text-slate-400 mt-1 truncate">${bsHighlighted}</div>
        `;
        item.onclick = () => {
          containerEl.classList.add("hidden");
          inputEl.value = "";
          els.surahSelect.value = res.surahId;
          AppState.currentSurah = AppState.data.find(
            (s) => s.id === res.surahId,
          );
          AppState.currentAyahIndex = res.ayahIndex;
          localStorage.setItem("last_surah", res.surahId);
          renderAyah();
          renderAyahGrid();
          updateProgress();
        };
        listEl.appendChild(item);
      });
      containerEl.classList.remove("hidden");
    }, 300);
  }

  els.searchInput.oninput = (e) =>
    handleSearchInput(
      e.target.value,
      els.searchInput,
      els.searchResultsContainer,
      els.searchResultsList,
      els.searchEmptyState,
    );

  if (els.searchInputMobile) {
    els.searchInputMobile.oninput = (e) =>
      handleSearchInput(
        e.target.value,
        els.searchInputMobile,
        els.searchResultsContainerMobile,
        els.searchResultsListMobile,
        els.searchEmptyStateMobile,
      );
  }

  // Hide search when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !els.searchInput.contains(e.target) &&
      !els.searchResultsContainer.contains(e.target)
    ) {
      els.searchResultsContainer.classList.add("hidden");
    }
    if (
      els.searchInputMobile &&
      !els.searchInputMobile.contains(e.target) &&
      !els.searchResultsContainerMobile.contains(e.target)
    ) {
      els.searchResultsContainerMobile.classList.add("hidden");
    }
  });

  // --- MOBILE MENU ---
  const openSidebar = () => {
    els.sidebarOverlay.classList.remove("hidden");
    setTimeout(() => {
      els.sidebarOverlay.classList.remove("opacity-0");
      els.sidebar.classList.remove("translate-x-full");
    }, 10);
  };
  const closeSidebar = () => {
    els.sidebarOverlay.classList.add("opacity-0");
    els.sidebar.classList.add("translate-x-full");
    setTimeout(() => els.sidebarOverlay.classList.add("hidden"), 300);
  };

  els.mobileGridToggle.onclick = openSidebar;
  els.sidebarClose.onclick = closeSidebar;
  els.sidebarOverlay.onclick = closeSidebar;

  // --- SETTINGS DRAWER ---
  const openSettings = () => {
    els.settingsOverlay.classList.remove("hidden");
    setTimeout(() => {
      els.settingsOverlay.classList.remove("opacity-0");
      els.settingsDrawer.classList.remove("translate-x-full");
    }, 10);
  };
  const closeSettings = () => {
    els.settingsOverlay.classList.add("opacity-0");
    els.settingsDrawer.classList.add("translate-x-full");
    setTimeout(() => els.settingsOverlay.classList.add("hidden"), 300);
  };

  els.settingsToggle.onclick = openSettings;
  els.settingsClose.onclick = closeSettings;
  els.settingsOverlay.onclick = closeSettings;

  // --- PRACTICE & PERSISTENCE ---
  els.recordBtn.onclick = toggleRecording;
  els.validBtn.onclick = toggleCheckmark;
  els.bookmarkBtn.onclick = toggleBookmark;

  els.ayahNotes.oninput = (e) => {
    const key = `${AppState.currentSurah.id}-${AppState.currentSurah.verses[AppState.currentAyahIndex].id}`;
    const val = e.target.value;
    if (val.trim()) AppState.notes[key] = val;
    else delete AppState.notes[key];
    localStorage.setItem("quran_notes", JSON.stringify(AppState.notes));
    renderAyahGrid(); // Update grid indicator immediately
  };

  // --- JUZ / PAGE / AYAH NAVIGATION (Smart Auto-Jump & Sync) ---
  let navDebounce;
  const handleNavInput = (value, type) => {
    clearTimeout(navDebounce);
    if (!value || isNaN(value)) return;

    const num = parseInt(value);

    // Instant Sibling Update (Juz/Page only)
    if (type === "juz" && num >= 1 && num <= 30) {
      const [s, a] = window.JUZ_DATA[num];
      els.pageInput.value = window.getPageNumber(s, a);
    } else if (type === "page" && num >= 1 && num <= 604) {
      const [s, a] = window.PAGE_DATA[num];
      els.juzInput.value = window.getJuzNumber(s, a);
    }

    navDebounce = setTimeout(() => {
      if (type === "juz") {
        if (num >= 1 && num <= 30) goToJuz(num);
      } else if (type === "page") {
        if (num >= 1 && num <= 604) goToPage(num);
      } else if (type === "ayah") {
        if (
          AppState.currentSurah &&
          num >= 1 &&
          num <= AppState.currentSurah.verses.length
        ) {
          goToAyah(num);
        }
      }
    }, 800);
  };

  els.juzInput.oninput = (e) => handleNavInput(e.target.value, "juz");
  els.pageInput.oninput = (e) => handleNavInput(e.target.value, "page");
  els.ayahInput.oninput = (e) => handleNavInput(e.target.value, "ayah");

  // Clear input on focus for easier typing, restore if left empty
  const setupAutoClear = (el) => {
    let originalVal = "";
    el.onfocus = (e) => {
      originalVal = e.target.value;
      e.target.value = "";
    };
    el.onblur = (e) => {
      if (!e.target.value.trim()) {
        e.target.value = originalVal;
      }
    };
  };

  setupAutoClear(els.juzInput);
  setupAutoClear(els.pageInput);
  setupAutoClear(els.ayahInput);

  const handleEnterKey = (e, type, min, max) => {
    if (e.key === "Enter") {
      clearTimeout(navDebounce);
      const val = parseInt(e.target.value);
      if (val >= min && val <= max) {
        if (type === "juz") goToJuz(val);
        else if (type === "page") goToPage(val);
        else if (type === "ayah") goToAyah(val);
        e.target.blur();
      }
    }
  };

  els.juzInput.onkeydown = (e) => handleEnterKey(e, "juz", 1, 30);
  els.pageInput.onkeydown = (e) => handleEnterKey(e, "page", 1, 604);
  els.ayahInput.onkeydown = (e) =>
    handleEnterKey(
      e,
      "ayah",
      1,
      AppState.currentSurah ? AppState.currentSurah.verses.length : 286,
    );

  // --- AUDIO UI (RECITATION) ---
  els.ayahPlayBtn.onclick = () =>
    els.ayahAudio.paused ? els.ayahAudio.play() : els.ayahAudio.pause();

  els.ayahLoopBtn.onclick = () => {
    els.ayahAudio.loop = !els.ayahAudio.loop;
    if (els.ayahAudio.loop) {
      els.ayahLoopBtn.classList.add("text-emerald-400", "bg-slate-800");
      els.ayahLoopBtn.classList.remove("text-slate-500");
    } else {
      els.ayahLoopBtn.classList.remove("text-emerald-400", "bg-slate-800");
      els.ayahLoopBtn.classList.add("text-slate-500");
    }
  };

  const speeds = [1, 1.25, 1.5, 0.5, 0.75];
  let currentSpeedIdx = 0;
  els.ayahSpeedBtn.onclick = () => {
    currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length;
    els.ayahAudio.playbackRate = speeds[currentSpeedIdx];
    els.ayahSpeedBtn.innerText = speeds[currentSpeedIdx] + "x";
  };

  els.ayahAudio.onplay = () => {
    els.ayahPlayIcon.classList.add("hidden");
    els.ayahPauseIcon.classList.remove("hidden");
  };
  els.ayahAudio.onpause = () => {
    els.ayahPlayIcon.classList.remove("hidden");
    els.ayahPauseIcon.classList.add("hidden");
  };
  els.ayahAudio.ontimeupdate = updateAyahAudioUI;
  els.ayahAudio.onended = () => {
    els.ayahPlayIcon.classList.remove("hidden");
    els.ayahPauseIcon.classList.add("hidden");
    els.ayahAudioProgress.style.width = "0%";

    // Auto-advance logic
    if (els.autoplayToggle.checked && !els.ayahAudio.loop) {
      if (
        AppState.hifzEnabled &&
        AppState.hifzRange.start !== null &&
        AppState.hifzRange.end !== null
      ) {
        const min = Math.min(AppState.hifzRange.start, AppState.hifzRange.end);
        const max = Math.max(AppState.hifzRange.start, AppState.hifzRange.end);

        if (AppState.currentAyahIndex >= max) {
          AppState.currentAyahIndex = min;
        } else {
          AppState.currentAyahIndex++;
        }
      } else {
        nextAyah();
      }
      renderAyah();
      // Need a slight delay to allow rendering and audio loading
      setTimeout(() => {
        els.ayahAudio.play();
      }, 50);
    }
  };
  els.ayahProgressBg.onclick = (e) => {
    const rect = els.ayahProgressBg.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    els.ayahAudio.currentTime = pos * els.ayahAudio.duration;
  };

  // --- AUDIO UI (USER RECORDING) ---
  els.userPlayBtn.onclick = () =>
    els.audioPlayback.paused
      ? els.audioPlayback.play()
      : els.audioPlayback.pause();

  els.audioPlayback.onplay = () => {
    els.userPlayIcon.classList.add("hidden");
    els.userPauseIcon.classList.remove("hidden");
  };
  els.audioPlayback.onpause = () => {
    els.userPlayIcon.classList.remove("hidden");
    els.userPauseIcon.classList.add("hidden");
  };
  els.audioPlayback.ontimeupdate = updateUserAudioUI;
  els.audioPlayback.onended = () => {
    els.userPlayIcon.classList.remove("hidden");
    els.userPauseIcon.classList.add("hidden");
    els.userAudioProgress.style.width = "0%";
  };
  els.userProgressBg.onclick = (e) => {
    const rect = els.userProgressBg.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    els.audioPlayback.currentTime = pos * els.audioPlayback.duration;
  };

  // --- DATA TRANSFER ---
  els.exportBtn.onclick = exportProgress;
  els.importBtn.onclick = () => els.importFile.click();
  els.importFile.onchange = importProgress;

  // --- TYPOGRAPHY SETTINGS ---
  const previewAr = document.getElementById("settings-preview-ar");
  const previewBs = document.getElementById("settings-preview-bs");

  els.arSizeSlider.oninput = (e) => {
    AppState.settings.arSize = e.target.value;
    els.arSizeVal.innerText = `${e.target.value}%`;
    els.arabicDisplay.style.fontSize = `${e.target.value / 100}rem`;
    if (previewAr) previewAr.style.fontSize = `${e.target.value / 100}rem`;
    localStorage.setItem("quran_ar_size", e.target.value);
  };
  els.bsSizeSlider.oninput = (e) => {
    AppState.settings.bsSize = e.target.value;
    els.bsSizeVal.innerText = `${e.target.value}%`;
    els.translationDisplay.style.fontSize = `${e.target.value / 100}rem`;
    if (previewBs) previewBs.style.fontSize = `${e.target.value / 100}rem`;
    localStorage.setItem("quran_bs_size", e.target.value);
  };
  els.arLhSlider.oninput = (e) => {
    AppState.settings.arLineHeight = e.target.value;
    els.arLhVal.innerText = e.target.value;
    els.arabicDisplay.style.lineHeight = e.target.value;
    if (previewAr) previewAr.style.lineHeight = e.target.value;
    localStorage.setItem("quran_ar_lh", e.target.value);
  };

  // --- SETTINGS (THEME & AUTOPLAY) ---
  els.themeSelect.onchange = (e) => {
    const val = e.target.value;
    if (val) {
      document.documentElement.setAttribute("data-theme", val);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("quran_theme", val);
  };

  els.autoplayToggle.onchange = (e) => {
    localStorage.setItem("quran_autoplay", e.target.checked);
  };

  els.tajweedToggle.onchange = (e) => {
    AppState.settings.tajweed = e.target.checked;
    localStorage.setItem("quran_tajweed", e.target.checked);
    if (e.target.checked) {
      document.body.classList.add("tajweed-active");
    } else {
      document.body.classList.remove("tajweed-active");
    }
    renderAyah();
  };

  els.tajweedLegendToggle.onchange = (e) => {
    AppState.settings.tajweedLegend = e.target.checked;
    localStorage.setItem("quran_tajweed_legend", e.target.checked);
    renderAyah();
  };

  els.lightmodeToggle.onchange = (e) => {
    AppState.settings.lightMode = e.target.checked;
    localStorage.setItem("quran_lightmode", e.target.checked);
    if (e.target.checked) {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const updateReciterLabel = () => {
    if (els.reciterNameLabel && els.reciterSelect.options.length > 0) {
      els.reciterNameLabel.innerText =
        els.reciterSelect.options[els.reciterSelect.selectedIndex].text;
    }
  };

  els.reciterSelect.value = AppState.currentReciter;
  updateReciterLabel();

  els.reciterSelect.onchange = (e) => {
    AppState.currentReciter = e.target.value;
    localStorage.setItem("quran_reciter", e.target.value);
    updateReciterLabel();
    renderAyah();
  };

  els.hifzToggle.onchange = (e) => {
    AppState.hifzEnabled = e.target.checked;
    if (!AppState.hifzEnabled) {
      AppState.hifzRange = { start: null, end: null };
      els.hifzRangeText.innerText = "Klikni na ajet za opseg";
    }
    renderAyahGrid();
  };

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  document.onkeydown = (e) => {
    // Disable shortcuts if typing in input/textarea
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.id === "search-input"
    )
      return;

    // Navigation: Left/Right Arrows
    if (e.code === "ArrowRight") nextAyah();
    if (e.code === "ArrowLeft") prevAyah();

    // Quick Record: Space
    if (e.code === "Space") {
      e.preventDefault();
      toggleRecording();
    }

    // Valid checkmark: V
    if (e.code === "KeyV" || e.key === "v") {
      e.preventDefault();
      toggleCheckmark();
    }

    // Play/Pause Recitation: P or Enter
    if (e.code === "KeyP" || e.key === "p" || e.code === "Enter") {
      e.preventDefault();
      if (!els.ayahAudioContainer.classList.contains("hidden")) {
        els.ayahAudio.paused ? els.ayahAudio.play() : els.ayahAudio.pause();
      }
    }

    // Play/Pause User recording: U
    if (e.code === "KeyU" || e.key === "u") {
      e.preventDefault();
      if (!els.userAudioContainer.classList.contains("hidden")) {
        els.audioPlayback.paused
          ? els.audioPlayback.play()
          : els.audioPlayback.pause();
      }
    }
  };

  // --- SWIPE GESTURES ---
  let touchStartX = 0;
  let touchStartY = 0;
  let swipeActive = false;
  const SWIPE_THRESHOLD = 60;

  document.addEventListener(
    "touchstart",
    (e) => {
      const target = e.target;
      if (
        target.closest("#sidebar") ||
        target.closest("#settings-drawer") ||
        target.closest("#search-results-container") ||
        target.closest("#search-results-container-mobile") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        swipeActive = false;
        return;
      }
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      swipeActive = true;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (!swipeActive) return;
      swipeActive = false;

      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = Math.abs(touchEndX - touchStartX);
      const diffY = Math.abs(touchEndY - touchStartY);

      if (diffX > diffY && diffX > SWIPE_THRESHOLD) {
        if (touchEndX < touchStartX) {
          AppState.swipeDirection = "left";
          nextAyah();
        } else {
          AppState.swipeDirection = "right";
          prevAyah();
        }
      }
    },
    { passive: true },
  );
}

// BOOT APPLICATION
init();
