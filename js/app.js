/**
 * @file app.js
 * @description APPLICATION ORCHESTRATOR
 * This is the entry point that initializes the app and sets up global event listeners.
 */

/* --- GLOBAL UI HELPER FUNCTIONS --- */
/**
 * Opens the main navigation sidebar (drawer).
 */
function openSidebar() {
  if (typeof closeSettings === "function") closeSettings();
  if (typeof closeBookmarks === "function") closeBookmarks();
  if (typeof closeHifz === "function") closeHifz();
  if (!els.sidebarOverlay || !els.sidebar) return;
  els.sidebarOverlay.classList.remove("hidden");
  setTimeout(() => {
    els.sidebarOverlay.classList.remove("opacity-0");
    els.sidebar.classList.remove("translate-x-full");
  }, 10);
}

/**
 * Closes the main navigation sidebar.
 */
function closeSidebar() {
  if (!els.sidebarOverlay || !els.sidebar) return;
  els.sidebarOverlay.classList.add("opacity-0");
  els.sidebar.classList.add("translate-x-full");
  setTimeout(() => els.sidebarOverlay.classList.add("hidden"), 300);
}

/**
 * Opens the settings drawer.
 */
function openSettings() {
  if (typeof closeSidebar === "function") closeSidebar();
  if (typeof closeBookmarks === "function") closeBookmarks();
  if (typeof closeHifz === "function") closeHifz();
  if (!els.settingsOverlay || !els.settingsDrawer) return;
  els.settingsOverlay.classList.remove("hidden");
  setTimeout(() => {
    els.settingsOverlay.classList.remove("opacity-0");
    els.settingsDrawer.classList.remove("translate-x-full");
  }, 10);
}

/**
 * Closes the settings drawer.
 */
function closeSettings() {
  if (!els.settingsOverlay || !els.settingsDrawer) return;
  els.settingsOverlay.classList.add("opacity-0");
  els.settingsDrawer.classList.add("translate-x-full");
  setTimeout(() => els.settingsOverlay.classList.add("hidden"), 300);
}

/**
 * Opens the bookmarks drawer.
 */
function openBookmarks() {
  if (typeof closeSidebar === "function") closeSidebar();
  if (typeof closeSettings === "function") closeSettings();
  if (typeof closeHifz === "function") closeHifz();
  if (!els.bookmarksOverlay || !els.bookmarksDrawer) return;
  els.bookmarksOverlay.classList.remove("hidden");
  setTimeout(() => {
    els.bookmarksOverlay.classList.remove("opacity-0");
    els.bookmarksDrawer.classList.remove("translate-x-full");
  }, 10);
}

/**
 * Closes the bookmarks drawer.
 */
function closeBookmarks() {
  if (!els.bookmarksOverlay || !els.bookmarksDrawer) return;
  els.bookmarksOverlay.classList.add("opacity-0");
  els.bookmarksDrawer.classList.add("translate-x-full");
  setTimeout(() => els.bookmarksOverlay.classList.add("hidden"), 300);
}

/**
 * Opens the Hifz drawer.
 */
function openHifz() {
  if (typeof closeSidebar === "function") closeSidebar();
  if (typeof closeSettings === "function") closeSettings();
  if (typeof closeBookmarks === "function") closeBookmarks();
  if (!els.hifzOverlay || !els.hifzDrawer) return;
  els.hifzOverlay.classList.remove("hidden");
  setTimeout(() => {
    els.hifzOverlay.classList.remove("opacity-0");
    els.hifzDrawer.classList.remove("translate-x-full");
  }, 10);
}

/**
 * Closes the Hifz drawer.
 */
function closeHifz() {
  if (!els.hifzOverlay || !els.hifzDrawer) return;
  els.hifzOverlay.classList.add("opacity-0");
  els.hifzDrawer.classList.add("translate-x-full");
  setTimeout(() => els.hifzOverlay.classList.add("hidden"), 300);
}

/**
 * Opens a generic modal by ID.
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("hidden");
}

/**
 * Closes a generic modal by ID.
 */
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("hidden");
}

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
    const lastAyahIndex = parseInt(
      localStorage.getItem("last_ayah_index") || "0",
    );
    if (els.surahSelect) els.surahSelect.value = lastSurah;
    AppState.currentAyahIndex = lastAyahIndex;
    loadSurah(parseInt(lastSurah), true);

    // 4. Load Bookmarks & Theme
    renderBookmarks();
    const savedTheme = localStorage.getItem("quran_theme") || "";
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (els.themeSelect) els.themeSelect.value = savedTheme;
    }
    const autoplayState = localStorage.getItem("quran_autoplay");
    if (autoplayState !== null && els.autoplayToggle) {
      els.autoplayToggle.checked = autoplayState === "true";
    }

    // Set initial toggle states
    if (els.tajweedToggle) {
      els.tajweedToggle.checked = AppState.settings.tajweed;
      if (AppState.settings.tajweed) {
        document.body.classList.add("tajweed-active");
      }
    }

    if (els.tajweedLegendToggle) {
      els.tajweedLegendToggle.checked = AppState.settings.tajweedLegend;
    }

    if (els.lightmodeToggle) {
      els.lightmodeToggle.checked = AppState.settings.lightMode;
      if (AppState.settings.lightMode) {
        document.documentElement.classList.add("light");
      }
    }

    if (els.notesToggle) {
      els.notesToggle.checked = AppState.settings.showNotes;
      document.body.classList.toggle(
        "hide-notes",
        !AppState.settings.showNotes,
      );
    }

    applySettings();
    applyTranslations();
    updateReciterLabel();
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
  if (!els.surahSelect) return;
  AppState.data.forEach((surah) => {
    const option = document.createElement("option");
    option.value = surah.id;
    option.textContent = `${surah.id}. ${surah.trans} (${surah.name})`;
    option.className = "bg-slate-900";
    els.surahSelect.appendChild(option);

    if (els.modalSurahList) {
      const modalBtn = document.createElement("button");
      modalBtn.className =
        "text-left w-full p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/60 transition-colors flex justify-between items-center";
      modalBtn.innerHTML = `<span class="text-sm font-semibold text-slate-200">${surah.id}. ${surah.trans}</span><span class="text-[14px] text-slate-400 font-quran">${surah.name}</span>`;
      modalBtn.onclick = () => {
        els.surahSelect.value = surah.id;
        loadSurah(surah.id);
        closeModal("surah-hifz-modal");
      };
      els.modalSurahList.appendChild(modalBtn);
    }
  });
}

/**
 * Registers all DOM event listeners and keyboard shortcuts.
 */
function setupEventListeners() {
  // --- SETTINGS (RECITER) ---
  if (els.reciterSelect) {
    els.reciterSelect.value = AppState.currentReciter;
    updateReciterLabel();

    els.reciterSelect.onchange = (e) => {
      AppState.currentReciter = e.target.value;
      localStorage.setItem("quran_reciter", e.target.value);
      updateReciterLabel();
      renderAyah();
    };
  }

  // --- NAVIGATION & SEARCH ---
  if (els.surahSelect) {
    els.surahSelect.onchange = (e) => loadSurah(parseInt(e.target.value));
  }
  if (els.nextBtn) els.nextBtn.onclick = nextAyah;
  if (els.prevBtn) els.prevBtn.onclick = prevAyah;

  // Search logic — shared between desktop and mobile via Web Worker
  let debounceTimeout;

  function handleSearchInput(query, inputEl, containerEl, listEl, emptyEl) {
    if (!window.searchWorker) {
      window.searchWorker = new Worker("js/searchWorker.js");
      window.searchWorker.postMessage({ type: "init", data: AppState.data });
    }

    clearTimeout(debounceTimeout);
    if (query.trim().length < 2) {
      containerEl.classList.add("hidden");
      return;
    }

    debounceTimeout = setTimeout(() => {
      window.searchWorker.onmessage = function (e) {
        if (e.data.type === "results") {
          const results = e.data.results;
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
              if (containerEl && containerEl.classList) {
                containerEl.classList.add("hidden");
              }
              closeModal("search-modal");
              inputEl.value = "";
              if (els.surahSelect) els.surahSelect.value = res.surahId;
              AppState.currentSurah = AppState.data.find(
                (s) => s.id === res.surahId,
              );
              AppState.currentAyahIndex = res.ayahIndex;
              localStorage.setItem("last_surah", res.surahId);
              localStorage.setItem("last_ayah_index", res.ayahIndex);
              renderAyah();
              if (typeof updateGridCellState === "function") {
                updateGridCellState(AppState.currentAyahIndex);
              } else {
                renderAyahGrid();
              }
              updateProgress();
            };
            listEl.appendChild(item);
          });
          containerEl.classList.remove("hidden");
        }
      };

      window.searchWorker.postMessage({ type: "search", query: query });
    }, 300);
  }

  if (els.searchInput) {
    els.searchInput.oninput = (e) =>
      handleSearchInput(
        e.target.value,
        els.searchInput,
        els.searchResultsContainer,
        els.searchResultsList,
        els.searchEmptyState,
      );
  }

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

  if (els.searchInputModal) {
    els.searchInputModal.oninput = (e) => {
      // Hide idle state
      const idleState = document.getElementById("search-idle-state-modal");
      if (idleState) idleState.classList.add("hidden");

      handleSearchInput(
        e.target.value,
        els.searchInputModal,
        { classList: { remove: () => {}, add: () => {} } }, // Fake container so logic doesn't crash
        els.searchResultsListModal,
        els.searchEmptyStateModal,
      );
    };
  }

  // Hide search when clicking outside
  document.addEventListener("click", (e) => {
    if (
      els.searchInput &&
      !els.searchInput.contains(e.target) &&
      els.searchResultsContainer &&
      !els.searchResultsContainer.contains(e.target)
    ) {
      els.searchResultsContainer.classList.add("hidden");
    }
    if (
      els.searchInputMobile &&
      !els.searchInputMobile.contains(e.target) &&
      els.searchResultsContainerMobile &&
      !els.searchResultsContainerMobile.contains(e.target)
    ) {
      els.searchResultsContainerMobile.classList.add("hidden");
    }
  });

  // --- MOBILE MENU ---
  if (els.mobileGridToggle) els.mobileGridToggle.onclick = openSidebar;
  if (els.sidebarClose) els.sidebarClose.onclick = closeSidebar;
  if (els.sidebarOverlay) els.sidebarOverlay.onclick = closeSidebar;

  // --- UI ACTIONS ---
  if (els.settingsToggle) els.settingsToggle.onclick = openSettings;
  if (els.settingsClose) els.settingsClose.onclick = closeSettings;
  if (els.settingsOverlay) els.settingsOverlay.onclick = closeSettings;

  // --- BOTTOM MOBILE NAV ---
  const closeAllMenusAndModals = () => {
    if (els.sidebarOverlay && !els.sidebarOverlay.classList.contains("hidden"))
      closeSidebar();
    if (
      els.settingsOverlay &&
      !els.settingsOverlay.classList.contains("hidden")
    )
      closeSettings();
    if (
      els.bookmarksOverlay &&
      !els.bookmarksOverlay.classList.contains("hidden")
    )
      closeBookmarks();
    if (els.hifzOverlay && !els.hifzOverlay.classList.contains("hidden"))
      closeHifz();

    const surahModal = document.getElementById("surah-hifz-modal");
    if (surahModal && !surahModal.classList.contains("hidden"))
      closeModal("surah-hifz-modal");

    const searchModal = document.getElementById("search-modal");
    if (searchModal && !searchModal.classList.contains("hidden"))
      closeModal("search-modal");
  };

  if (els.navSurahBtn) {
    els.navSurahBtn.onclick = () => {
      const modal = document.getElementById("surah-hifz-modal");
      if (modal && !modal.classList.contains("hidden")) {
        closeModal("surah-hifz-modal");
      } else {
        closeAllMenusAndModals();
        openModal("surah-hifz-modal");
      }
    };
  }
  if (els.navHifzBtn) {
    els.navHifzBtn.onclick = () => {
      if (els.hifzOverlay && !els.hifzOverlay.classList.contains("hidden")) {
        closeHifz();
      } else {
        closeAllMenusAndModals();
        openHifz();
      }
    };
  }
  if (els.hifzCloseMobile) els.hifzCloseMobile.onclick = closeHifz;
  if (els.hifzOverlay) els.hifzOverlay.onclick = closeHifz;
  if (els.navSearchBtn) {
    els.navSearchBtn.onclick = () => {
      const modal = document.getElementById("search-modal");
      if (modal && !modal.classList.contains("hidden")) {
        closeModal("search-modal");
      } else {
        closeAllMenusAndModals();
        openModal("search-modal");
        if (els.searchInputModal) {
          // slight timeout for modal to visibly display before focusing layout
          setTimeout(() => els.searchInputModal.focus(), 100);
        }
      }
    };
  }
  if (els.navBookmarksBtn) {
    els.navBookmarksBtn.onclick = () => {
      if (
        els.bookmarksOverlay &&
        !els.bookmarksOverlay.classList.contains("hidden")
      ) {
        closeBookmarks();
      } else {
        closeAllMenusAndModals();
        openBookmarks();
      }
    };
  }

  if (els.bookmarksClose) els.bookmarksClose.onclick = closeBookmarks;
  if (els.bookmarksOverlay) els.bookmarksOverlay.onclick = closeBookmarks;
  if (els.navSettingsBtn) {
    els.navSettingsBtn.onclick = () => {
      if (
        els.settingsOverlay &&
        !els.settingsOverlay.classList.contains("hidden")
      ) {
        closeSettings();
      } else {
        closeAllMenusAndModals();
        openSettings();
      }
    };
  }

  // --- PRACTICE & PERSISTENCE ---
  if (els.recordBtn) els.recordBtn.onclick = toggleRecording;
  if (els.validBtn) els.validBtn.onclick = toggleCheckmark;
  if (els.bookmarkBtn) els.bookmarkBtn.onclick = toggleBookmark;

  if (els.ayahNotes) {
    els.ayahNotes.oninput = (e) => {
      if (!AppState.currentSurah) return;
      const key = `${AppState.currentSurah.id}-${AppState.currentSurah.verses[AppState.currentAyahIndex].id}`;
      const val = e.target.value;
      if (val.trim()) AppState.notes[key] = val;
      else delete AppState.notes[key];
      debouncedStorageSave("quran_notes", JSON.stringify(AppState.notes));
      if (typeof updateGridCellState === "function") {
        updateGridCellState(AppState.currentAyahIndex);
      } else {
        renderAyahGrid();
      }
    };
  }

  // --- JUZ / PAGE / AYAH NAVIGATION (Smart Auto-Jump & Sync) ---
  let navDebounce;
  const handleNavInput = (value, type) => {
    clearTimeout(navDebounce);
    if (!value || isNaN(value)) return;

    const num = parseInt(value);

    // Instant Sibling Update (Juz/Page only)
    if (type === "juz" && num >= 1 && num <= 30) {
      const [s, a] = window.JUZ_DATA[num];
      if (els.pageInput) els.pageInput.value = window.getPageNumber(s, a);
    } else if (type === "page" && num >= 1 && num <= 604) {
      const [s, a] = window.PAGE_DATA[num];
      if (els.juzInput) els.juzInput.value = window.getJuzNumber(s, a);
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

  if (els.juzInput)
    els.juzInput.oninput = (e) => handleNavInput(e.target.value, "juz");
  if (els.pageInput)
    els.pageInput.oninput = (e) => handleNavInput(e.target.value, "page");
  if (els.ayahInput)
    els.ayahInput.oninput = (e) => handleNavInput(e.target.value, "ayah");

  // Clear input on focus for easier typing, restore if left empty
  const setupAutoClear = (el) => {
    if (!el) return;
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

  if (els.juzInput)
    els.juzInput.onkeydown = (e) => handleEnterKey(e, "juz", 1, 30);
  if (els.pageInput)
    els.pageInput.onkeydown = (e) => handleEnterKey(e, "page", 1, 604);
  if (els.ayahInput) {
    els.ayahInput.onkeydown = (e) =>
      handleEnterKey(
        e,
        "ayah",
        1,
        AppState.currentSurah ? AppState.currentSurah.verses.length : 286,
      );
  }

  // --- AUDIO UI (RECITATION) ---
  if (els.ayahPlayBtn) {
    els.ayahPlayBtn.onclick = () =>
      els.ayahAudio.paused ? els.ayahAudio.play() : els.ayahAudio.pause();
  }

  if (els.ayahLoopBtn) {
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
  }

  const speeds = [1, 1.25, 1.5, 0.5, 0.75];
  let currentSpeedIdx = 0;
  if (els.ayahSpeedBtn) {
    els.ayahSpeedBtn.onclick = () => {
      currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length;
      els.ayahAudio.playbackRate = speeds[currentSpeedIdx];
      els.ayahSpeedBtn.innerText = speeds[currentSpeedIdx] + "x";
    };
  }

  if (els.ayahAudio) {
    els.ayahAudio.onplay = () => {
      if (els.ayahPlayIcon) els.ayahPlayIcon.classList.add("hidden");
      if (els.ayahPauseIcon) els.ayahPauseIcon.classList.remove("hidden");
    };
    els.ayahAudio.onpause = () => {
      if (els.ayahPlayIcon) els.ayahPlayIcon.classList.remove("hidden");
      if (els.ayahPauseIcon) els.ayahPauseIcon.classList.add("hidden");
    };
    els.ayahAudio.ontimeupdate = updateAyahAudioUI;
    els.ayahAudio.onended = () => {
      if (els.ayahPlayIcon) els.ayahPlayIcon.classList.remove("hidden");
      if (els.ayahPauseIcon) els.ayahPauseIcon.classList.add("hidden");
      if (els.ayahAudioProgress) els.ayahAudioProgress.style.width = "0%";

      // Auto-advance logic
      if (
        els.autoplayToggle &&
        els.autoplayToggle.checked &&
        !els.ayahAudio.loop
      ) {
        if (
          AppState.hifzEnabled &&
          AppState.hifzRange.start !== null &&
          AppState.hifzRange.end !== null
        ) {
          const min = Math.min(
            AppState.hifzRange.start,
            AppState.hifzRange.end,
          );
          const max = Math.max(
            AppState.hifzRange.start,
            AppState.hifzRange.end,
          );

          if (AppState.currentAyahIndex >= max) {
            AppState.currentAyahIndex = min;
          } else {
            AppState.currentAyahIndex++;
          }
          localStorage.setItem("last_ayah_index", AppState.currentAyahIndex);
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
  }

  if (els.ayahProgressBg) {
    els.ayahProgressBg.onclick = (e) => {
      const rect = els.ayahProgressBg.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      els.ayahAudio.currentTime = pos * els.ayahAudio.duration;
    };
  }

  // --- AUDIO UI (USER RECORDING) ---
  if (els.userPlayBtn) {
    els.userPlayBtn.onclick = () =>
      els.audioPlayback.paused
        ? els.audioPlayback.play()
        : els.audioPlayback.pause();
  }

  if (els.audioPlayback) {
    els.audioPlayback.onplay = () => {
      if (els.userPlayIcon) els.userPlayIcon.classList.add("hidden");
      if (els.userPauseIcon) els.userPauseIcon.classList.remove("hidden");
    };
    els.audioPlayback.onpause = () => {
      if (els.userPlayIcon) els.userPlayIcon.classList.remove("hidden");
      if (els.userPauseIcon) els.userPauseIcon.classList.add("hidden");
    };
    els.audioPlayback.ontimeupdate = updateUserAudioUI;
    els.audioPlayback.onended = () => {
      if (els.userPlayIcon) els.userPlayIcon.classList.remove("hidden");
      if (els.userPauseIcon) els.userPauseIcon.classList.add("hidden");
      if (els.userAudioProgress) els.userAudioProgress.style.width = "0%";
    };
  }
  if (els.userProgressBg) {
    els.userProgressBg.onclick = (e) => {
      const rect = els.userProgressBg.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      els.audioPlayback.currentTime = pos * els.audioPlayback.duration;
    };
  }

  // --- DATA TRANSFER ---
  if (els.exportBtn) els.exportBtn.onclick = exportProgress;
  if (els.importBtn) els.importBtn.onclick = () => els.importFile.click();
  if (els.importFile) els.importFile.onchange = importProgress;

  // --- TYPOGRAPHY SETTINGS ---
  const previewAr = document.getElementById("settings-preview-ar");
  const previewBs = document.getElementById("settings-preview-bs");

  if (els.arSizeSlider) {
    els.arSizeSlider.oninput = (e) => {
      AppState.settings.arSize = e.target.value;
      if (els.arSizeVal) els.arSizeVal.innerText = `${e.target.value}%`;
      if (els.arabicDisplay)
        els.arabicDisplay.style.fontSize = `${e.target.value / 100}rem`;
      if (previewAr) previewAr.style.fontSize = `${e.target.value / 100}rem`;
      localStorage.setItem("quran_ar_size", e.target.value);
    };
  }
  if (els.bsSizeSlider) {
    els.bsSizeSlider.oninput = (e) => {
      AppState.settings.bsSize = e.target.value;
      if (els.bsSizeVal) els.bsSizeVal.innerText = `${e.target.value}%`;
      if (els.translationDisplay)
        els.translationDisplay.style.fontSize = `${e.target.value / 100}rem`;
      if (previewBs) previewBs.style.fontSize = `${e.target.value / 100}rem`;
      localStorage.setItem("quran_bs_size", e.target.value);
    };
  }
  if (els.arLhSlider) {
    els.arLhSlider.oninput = (e) => {
      AppState.settings.arLineHeight = e.target.value;
      if (els.arLhVal) els.arLhVal.innerText = e.target.value;
      if (els.arabicDisplay)
        els.arabicDisplay.style.lineHeight = e.target.value;
      if (previewAr) previewAr.style.lineHeight = e.target.value;
      localStorage.setItem("quran_ar_lh", e.target.value);
    };
  }

  // --- SETTINGS (THEME & AUTOPLAY) ---
  if (els.themeSelect) {
    els.themeSelect.onchange = (e) => {
      const val = e.target.value;
      if (val) {
        document.documentElement.setAttribute("data-theme", val);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      localStorage.setItem("quran_theme", val);
    };
  }

  if (els.autoplayToggle) {
    els.autoplayToggle.onchange = (e) => {
      localStorage.setItem("quran_autoplay", e.target.checked);
    };
  }

  if (els.tajweedToggle) {
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
  }

  if (els.tajweedLegendToggle) {
    els.tajweedLegendToggle.onchange = (e) => {
      AppState.settings.tajweedLegend = e.target.checked;
      localStorage.setItem("quran_tajweed_legend", e.target.checked);
      renderAyah();
    };
  }

  if (els.lightmodeToggle) {
    els.lightmodeToggle.onchange = (e) => {
      AppState.settings.lightMode = e.target.checked;
      localStorage.setItem("quran_lightmode", e.target.checked);
      if (e.target.checked) {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    };
  }

  // Set initial Hifz UI
  if (AppState.hifzEnabled) {
    if (els.hifzToggle) els.hifzToggle.checked = AppState.hifzEnabled;
    if (els.hifzToggleMobile)
      els.hifzToggleMobile.checked = AppState.hifzEnabled;
    const min = AppState.hifzRange.start;
    const max = AppState.hifzRange.end;
    let text = "Klikni ajet za opseg";
    if (min !== null && max !== null) {
      text = `Opseg: ${Math.min(min, max) + 1} - ${Math.max(min, max) + 1}`;
    } else if (min !== null) {
      text = `Opseg: ${min + 1} - ...`;
    }
    if (els.hifzRangeText) els.hifzRangeText.innerText = text;
    if (els.hifzRangeTextMobile) els.hifzRangeTextMobile.innerText = text;
  }

  // Bind Hifz toggles
  const handleHifzChange = (e) => {
    AppState.hifzEnabled = e.target.checked;
    if (els.hifzToggle) els.hifzToggle.checked = AppState.hifzEnabled;
    if (els.hifzToggleMobile)
      els.hifzToggleMobile.checked = AppState.hifzEnabled;
    localStorage.setItem("quran_hifzEnabled", AppState.hifzEnabled);

    if (!AppState.hifzEnabled) {
      // Clear range visually instantly
      AppState.hifzRange = { start: null, end: null };
      if (els.hifzRangeText)
        els.hifzRangeText.innerText = "Klikni na ajet za opseg";
      if (els.hifzRangeTextMobile)
        els.hifzRangeTextMobile.innerText = "Klikni na ajet za opseg";
      localStorage.setItem(
        "quran_hifzRange",
        JSON.stringify(AppState.hifzRange),
      );
    }
    renderAyahGrid();
  };

  if (els.hifzToggle) els.hifzToggle.onchange = handleHifzChange;
  if (els.hifzToggleMobile) els.hifzToggleMobile.onchange = handleHifzChange;

  if (els.notesToggle) {
    els.notesToggle.addEventListener("change", (e) => {
      AppState.settings.showNotes = e.target.checked;
      localStorage.setItem("quran_show_notes", e.target.checked);
      document.body.classList.toggle("hide-notes", !e.target.checked);
      renderAyah();
    });
  }

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  document.onkeydown = (e) => {
    // Disable shortcuts if typing in input/textarea
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      (els.searchInput && e.target.id === "search-input")
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
      if (
        els.ayahAudioContainer &&
        !els.ayahAudioContainer.classList.contains("hidden")
      ) {
        els.ayahAudio.paused ? els.ayahAudio.play() : els.ayahAudio.pause();
      }
    }

    // Play/Pause User recording: U
    if (e.code === "KeyU" || e.key === "u") {
      e.preventDefault();
      if (
        els.userAudioContainer &&
        !els.userAudioContainer.classList.contains("hidden")
      ) {
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

      if (diffX > diffY && diffX > SWIPE_THRESHOLD && diffY < 50) {
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

  // --- MODAL SYSTEM ---
  // About & Version buttons
  const aboutBtn = document.getElementById("about-btn");
  if (aboutBtn) aboutBtn.onclick = () => openModal("about-modal");

  const versionBtn = document.getElementById("version-btn");
  if (versionBtn) versionBtn.onclick = () => openModal("version-modal");

  // Close buttons (X)
  document.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.onclick = () => closeModal(btn.dataset.modalClose);
  });

  // Close on overlay click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    };
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay:not(.hidden)").forEach((m) => {
        m.classList.add("hidden");
      });
    }
  });
}

/**
 * Updates the display label for the currently selected reciter.
 */
function updateReciterLabel() {
  if (
    els.reciterNameLabel &&
    els.reciterSelect &&
    els.reciterSelect.options.length > 0
  ) {
    const reciterName =
      els.reciterSelect.options[els.reciterSelect.selectedIndex].text;
    els.reciterNameLabel.innerText = reciterName;
  }
}

// BOOT APPLICATION
init();
