/**
 * @file app.js
 * @description APPLICATION ORCHESTRATOR
 * Entry point that initializes the app and coordinates all modules.
 * 
 * This file is now refactored - heavy logic extracted to:
 * - ui-state.js: Menu/drawer state management
 * - search-handler.js: Search functionality
 * - keyboard-shortcuts.js: Keyboard handlers
 * - gesture-handler.js: Touch/swipe gestures
 */

// ============================================
// MODULE IMPORTS (via script tag order)
// ============================================
// These modules must be loaded before app.js in index.html:
// 1. ui-state.js
// 2. search-handler.js  
// 3. keyboard-shortcuts.js
// 4. gesture-handler.js
// ============================================

// --- GLOBAL ERROR BOUNDARY ---
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, "at", source, ":", lineno);
  showErrorToast("Došlo je do greške u aplikaciji. Molimo osvježite stranicu.");
  return false;
};

window.onunhandledrejection = function(event) {
  console.error("Unhandled Promise Rejection:", event.reason);
  showErrorToast("Greška u mrežnom zahtjevu ili obradi podataka.");
};

/**
 * Shows error toast notification
 */
function showErrorToast(msg) {
  const toast = document.createElement("div");
  toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce font-bold";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

/**
 * Main Initialization Sequence
 */
async function init() {
  try {
    // 1. Validate Data Source
    if (typeof QURAN_DATA === "undefined") {
      throw new Error("QURAN_DATA missing. Check quran_data.js.");
    }
    AppState.data = QURAN_DATA;

    // 2. Setup Base UI
    populateSurahSelect();
    setupEventListeners();

    // 3. Restore Session
    const lastSurah = localStorage.getItem("last_surah") || "1";
    const lastAyahIndex = parseInt(localStorage.getItem("last_ayah_index") || "0");
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



    updateThemeDotsUI();
    if (AppState.settings.pageTheme) {
      document.body.classList.add(`quran-theme-${AppState.settings.pageTheme}`);
    }

    // Preload critical SVG pages for instant spread mode
    if (typeof window.preloadCriticalPages === "function") {
      window.preloadCriticalPages();
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
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    }

    if (els.notesToggle) {
      els.notesToggle.checked = AppState.settings.showNotes;
      document.body.classList.toggle("hide-notes", !AppState.settings.showNotes);
    }

    // Apply spread mode using centralized function
    if (typeof window.applySpreadMode === "function") {
      window.applySpreadMode();
    }

    applySettings();
    applyTranslations();
    updateReciterLabel();

    // --- UPDATE NOTIFICATION ---
    const lastSeenVersion = localStorage.getItem("last_seen_version");
    if (lastSeenVersion && lastSeenVersion !== APP_VERSION) {
      setTimeout(() => {
        if (els.versionModal) {
          els.versionModal.setAttribute("data-auto-open", "true");
          openModal("mdl-version");
        }
      }, 1000);
    }
    localStorage.setItem("last_seen_version", APP_VERSION);

    // Swipe UX: Show tutorial toast on first visit (mobile only)
    if (!localStorage.getItem("swipe_tutorial_seen") && window.innerWidth < 768) {
      setTimeout(() => {
        if (els.swipeToast) {
          els.swipeToast.classList.add("show");
          localStorage.setItem("swipe_tutorial_seen", "true");
          setTimeout(() => els.swipeToast.classList.remove("show"), 3600);
        }
      }, 1200);
    }
  } catch (error) {
    console.error("Init failed:", error);
    alert("Load Error: " + error.message);
  }
}

/**
 * Fills the Surah dropdown menu
 */
function populateSurahSelect() {
  if (!els.surahSelect) return;
  AppState.data.forEach((surah) => {
    // 1. Maintain hidden select for state persistence
    const option = document.createElement("option");
    option.value = surah.id;
    option.textContent = `${surah.id}. ${surah.trans} (${surah.name})`;
    els.surahSelect.appendChild(option);

    // 2. Populate unified Surah modal list (Shared by Desktop & Mobile)
    if (els.modalSurahList) {
      const modalBtn = document.createElement("button");
      modalBtn.className = "modal-surah-item text-left w-full px-3 py-2 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/60 transition-colors flex justify-between items-center group/item";
      modalBtn.dataset.search = `${surah.id} ${surah.trans} ${surah.name}`.toLowerCase();
      modalBtn.innerHTML = `
        <span class="text-[13px] font-semibold text-slate-200 group-hover/item:text-emerald-400 truncate pr-2">${surah.id}. ${surah.trans}</span>
        <span class="text-[14px] text-slate-400 font-quran shrink-0">${surah.name}</span>
      `;
      modalBtn.onclick = () => {
        loadSurah(surah.id);
        closeModal("mdl-surah");
      };
      els.modalSurahList.appendChild(modalBtn);
    }
  });
}

/**
 * Registers all DOM event listeners
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

  // --- SETTINGS (APP THEME) ---
  if (els.themeSelect) {
    els.themeSelect.onchange = (e) => {
      const theme = e.target.value;
      if (theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("quran_theme", theme);
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("quran_theme");
      }
    };
  }



  if (els.themeDots) {
    els.themeDots.forEach(btn => {
      btn.onclick = () => setPageTheme(btn.getAttribute("data-theme"));
    });
    setupThemeHoverPreviews();
  }

  function setPageTheme(theme) {
    AppState.settings.pageTheme = theme;
    localStorage.setItem("quran_page_theme", theme);
    updateThemeDotsUI();
    document.body.classList.forEach(cls => {
      if (cls.startsWith('quran-theme-')) document.body.classList.remove(cls);
    });
    document.body.classList.add(`quran-theme-${theme}`);
    
    // Update SVG layer colors for all loaded pages
    if (typeof window.updateSVGLayerTheme === 'function') {
      window.updateSVGLayerTheme(theme);
    }
    
    if (AppState.settings.spreadMode && typeof renderSpread === "function") {
      renderSpread();
    }
  }

  function setupThemeHoverPreviews() {
    if (!els.themeDots) return;
    
    els.themeDots.forEach(btn => {
      const theme = btn.getAttribute("data-theme");
      const label = btn.getAttribute("data-label") || btn.getAttribute("title");
      
      btn.onmouseenter = () => showThemePreview(theme, label, btn);
      btn.onmouseleave = () => hideThemePreview();
    });
  }

  function showThemePreview(theme, label, dotEl) {
    if (!window.LAYER_COLORS) return;
    
    const isSettingsDot = dotEl.closest('#dwr-settings') !== null;
    const previewContainer = isSettingsDot 
      ? document.getElementById('cnt-theme-preview-settings')
      : els.themePreview;
      
    if (!previewContainer) return;

    const paletteList = previewContainer.querySelector('.lst-theme-palette') || els.themePaletteList;
    const themeNameLabel = previewContainer.querySelector('.dsp-preview-theme-name') || els.previewThemeName;
    
    const colors = window.LAYER_COLORS[theme];
    if (!colors) return;
    
    if (themeNameLabel) themeNameLabel.textContent = label;
    
    const layerNames = {
      'borderFrame': 'Okvir',
      'teardrop': 'Marker ajeta',
      'arabicText': 'Arapski tekst',
      'verseNumerals': 'Brojevi',
      'surahHeader': 'Naslov',
      'ornamental': 'Ukrasi',
      'pageNumber': 'Br. stranice'
    };
    
    paletteList.innerHTML = '';
    Object.entries(colors).forEach(([key, color]) => {
      const name = layerNames[key] || key;
      const item = document.createElement('div');
      item.className = 'flex items-center gap-2 mb-1';
      item.innerHTML = `
        <div class="w-2.5 h-2.5 rounded-full border border-slate-700/50" style="background-color: ${color}"></div>
        <span class="text-[9px] text-slate-400 font-medium whitespace-nowrap">${name}</span>
      `;
      paletteList.appendChild(item);
    });
    
    // Position preview above the hovered dot (for main view only)
    if (!isSettingsDot && els.pageThemeToggleContainer) {
      const dotRect = dotEl.getBoundingClientRect();
      const parentRect = els.pageThemeToggleContainer.getBoundingClientRect();
      
      // Calculate horizontal center of the dot relative to the parent
      const leftPos = (dotRect.left - parentRect.left) + (dotRect.width / 2);
      previewContainer.style.left = `${leftPos}px`;
      previewContainer.style.transform = 'translateX(-50%)';
    } else {
      // For settings drawer, clear inline styles so CSS takes over
      previewContainer.style.left = '';
      previewContainer.style.transform = '';
    }
    
    previewContainer.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2', 'translate-x-2');
    previewContainer.classList.add('opacity-100', isSettingsDot ? 'translate-x-0' : 'translate-y-0');
  }

  function hideThemePreview() {
    const p1 = document.getElementById('cnt-theme-preview');
    const p2 = document.getElementById('cnt-theme-preview-settings');
    [p1, p2].forEach(p => {
      if (p) {
        p.classList.add('opacity-0', 'pointer-events-none');
        p.classList.remove('opacity-100', 'translate-y-0', 'translate-x-0');
        if (p.id === 'cnt-theme-preview') p.classList.add('translate-y-2');
        else p.classList.add('translate-x-2');
      }
    });
  }

  // --- SURAH SELECTION (MODAL TRIGGER) ---
  if (els.surahTrigger) {
    els.surahTrigger.onclick = () => {
      openModal("mdl-surah");
      if (els.surahModalFilter) {
        els.surahModalFilter.value = "";
        const items = document.querySelectorAll(".modal-surah-item");
        items.forEach(item => item.classList.remove("hidden"));
        setTimeout(() => els.surahModalFilter.focus(), 100);
      }
    };
  }

  if (els.surahModalFilter) {
    els.surahModalFilter.oninput = (e) => {
      const query = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll(".modal-surah-item");
      items.forEach(item => {
        const text = item.dataset.search || "";
        item.classList.toggle("hidden", query && !text.includes(query));
      });
    };
  }
  if (els.nextBtn) els.nextBtn.onclick = nextAyah;
  if (els.prevBtn) els.prevBtn.onclick = prevAyah;

  // --- AUDIO PLAYER ---
  // Recitation audio play/pause
  if (els.ayahPlayBtn) {
    els.ayahPlayBtn.onclick = () => {
      if (!els.ayahAudio) return;
      if (els.ayahAudio.paused) {
        els.ayahAudio.play().catch(e => console.warn("Audio playback failed:", e));
      } else {
        els.ayahAudio.pause();
      }
    };
  }

  // User recording play/pause
  if (els.userPlayBtn) {
    els.userPlayBtn.onclick = () => {
      if (!els.audioPlayback) return;
      if (els.audioPlayback.paused) {
        els.audioPlayback.play().catch(e => console.warn("User audio playback failed:", e));
      } else {
        els.audioPlayback.pause();
      }
    };
  }

  // Audio progress bar click seeking (recitation)
  if (els.ayahProgressBg) {
    els.ayahProgressBg.onclick = (e) => {
      if (!els.ayahAudio || !els.ayahAudio.duration) return;
      const rect = els.ayahProgressBg.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      els.ayahAudio.currentTime = pos * els.ayahAudio.duration;
    };
  }

  // Audio progress bar click seeking (user recording)
  if (els.userProgressBg) {
    els.userProgressBg.onclick = (e) => {
      if (!els.audioPlayback || !els.audioPlayback.duration) return;
      const rect = els.userProgressBg.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      els.audioPlayback.currentTime = pos * els.audioPlayback.duration;
    };
  }

  // Update UI on time/progress events (recitation)
  if (els.ayahAudio) {
    els.ayahAudio.addEventListener("timeupdate", () => {
      if (typeof updateAyahAudioUI === "function") updateAyahAudioUI();
    });

    els.ayahAudio.addEventListener("play", () => {
      if (els.ayahPlayIcon) els.ayahPlayIcon.classList.add("hidden");
      if (els.ayahPauseIcon) els.ayahPauseIcon.classList.remove("hidden");
    });

    els.ayahAudio.addEventListener("pause", () => {
      if (els.ayahPlayIcon) els.ayahPlayIcon.classList.remove("hidden");
      if (els.ayahPauseIcon) els.ayahPauseIcon.classList.add("hidden");
    });

    els.ayahAudio.addEventListener("ended", () => {
      resetAyahAudioUI();
      // Auto-advance to next ayah if enabled
      if (AppState.settings.autoplay && typeof nextAyah === "function") {
        console.log("[Audio] Ayah ended, auto-advancing...");
        nextAyah();
        // Crucial: Start playback of the new ayah
        setTimeout(() => {
          if (els.ayahAudio) {
            console.log("[Audio] Autoplay starting next track...");
            els.ayahAudio.play().catch(e => {
                console.warn("[Autoplay] Playback blocked or failed:", e);
                resetAyahAudioUI();
            });
          }
        }, 300); // Slightly longer delay for safer source switching
      }
    });
  }

  // Update UI on time/progress events (user recording)
  if (els.audioPlayback) {
    els.audioPlayback.ontimeupdate = () => {
      if (typeof updateUserAudioUI === "function") updateUserAudioUI();
    };
    els.audioPlayback.onended = () => {
      resetUserAudioUI();
    };
  }

  // Playback speed control
  if (els.ayahSpeedBtn) {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    let speedIndex = 2; // Start at 1x

    els.ayahSpeedBtn.onclick = () => {
      speedIndex = (speedIndex + 1) % speeds.length;
      const newSpeed = speeds[speedIndex];
      if (els.ayahAudio) els.ayahAudio.playbackRate = newSpeed;
      els.ayahSpeedBtn.textContent = newSpeed + "x";
    };
  }

  // Loop toggle
  if (els.ayahLoopBtn) {
    els.ayahLoopBtn.onclick = () => {
      if (els.ayahAudio) {
        els.ayahAudio.loop = !els.ayahAudio.loop;
        els.ayahLoopBtn.classList.toggle("text-emerald-400", els.ayahAudio.loop);
        els.ayahLoopBtn.classList.toggle("text-slate-500", !els.ayahAudio.loop);
      }
    };
  }

  // --- SEARCH (extracted to search-handler.js) ---
  if (typeof window.initSearchHandlers === "function") {
    window.initSearchHandlers();
  }

  // --- MOBILE NAVIGATION HANDLERS ---
  setupMobileNavHandlers();

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

  // --- JUZ / PAGE / AYAH NAVIGATION ---
  setupNavigationInputs();

  // --- HIFZ MODE ---
  setupHifzMode();

  // --- NOTES TOGGLE ---
  if (els.notesToggle) {
    els.notesToggle.addEventListener("change", (e) => {
      AppState.settings.showNotes = e.target.checked;
      localStorage.setItem("quran_show_notes", e.target.checked);
      document.body.classList.toggle("hide-notes", !e.target.checked);
      renderAyah();
    });
  }

  // --- AUTOPLAY TOGGLE ---
  if (els.autoplayToggle) {
    els.autoplayToggle.addEventListener("change", (e) => {
      AppState.settings.autoplay = e.target.checked;
      localStorage.setItem("quran_autoplay", e.target.checked);
    });
  }

  // --- AUDIO PLAYER VISIBILITY TOGGLE ---
  if (els.audioToggle) {
    els.audioToggle.addEventListener("change", (e) => {
      AppState.settings.showAudioPlayer = e.target.checked;
      localStorage.setItem("quran_show_audio", e.target.checked);
      if (els.ayahAudioContainer) {
        els.ayahAudioContainer.classList.toggle("hidden", !e.target.checked);
      }
    });
  }

  // --- TAJWEED TOGGLE ---
  if (els.tajweedToggle) {
    els.tajweedToggle.addEventListener("change", (e) => {
      AppState.settings.tajweed = e.target.checked;
      localStorage.setItem("quran_tajweed", e.target.checked);
      document.body.classList.toggle("tajweed-active", e.target.checked);
      renderAyah();
    });
  }

  // --- TAJWEED LEGEND TOGGLE ---
  if (els.tajweedLegendToggle) {
    els.tajweedLegendToggle.addEventListener("change", (e) => {
      AppState.settings.tajweedLegend = e.target.checked;
      localStorage.setItem("quran_tajweed_legend", e.target.checked);
      renderAyah();
    });
  }

  // --- LIGHT MODE TOGGLE ---
  if (els.lightmodeToggle) {
    els.lightmodeToggle.addEventListener("change", (e) => {
      AppState.settings.lightMode = e.target.checked;
      localStorage.setItem("quran_lightmode", e.target.checked);
      if (e.target.checked) {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    });
  }

  // --- WORD AUDIO TOGGLE ---
  if (els.wordAudioToggle) {
    els.wordAudioToggle.addEventListener("change", (e) => {
      AppState.settings.disableWordAudio = e.target.checked;
      localStorage.setItem("quran_disable_word_audio", e.target.checked);
      if (typeof renderAyah === "function") renderAyah();
    });
  }

  // --- KEYBOARD SHORTCUTS (extracted) ---
  if (typeof window.initKeyboardShortcuts === "function") {
    window.initKeyboardShortcuts();
  }
  if (typeof window.initEscapeKeyHandler === "function") {
    window.initEscapeKeyHandler();
  }

  // --- SWIPE GESTURES (extracted) ---
  if (typeof window.initSwipeHandlers === "function") {
    window.initSwipeHandlers();
  }

  // --- MODAL SYSTEM ---
  setupModals();

  // --- RESPONSIVE RESIZE ---
  if (!window._resizeHandlerInitialized) {
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (AppState.settings.spreadMode && typeof window.renderSpread === "function") {
          window.renderSpread();
        }
      }, 250);
    });
    window._resizeHandlerInitialized = true;
  }

  // --- TEXT SIZE SLIDERS ---
  // Arabic text size
  if (els.arSizeSlider) {
    els.arSizeSlider.addEventListener("input", (e) => {
      const size = e.target.value;
      AppState.settings.arSize = parseInt(size);
      els.arSizeVal.innerText = `${size}%`;
      els.arabicDisplay.style.fontSize = `${size / 100}rem`;
      // Update preview
      if (els.settingsPreviewAr) els.settingsPreviewAr.style.fontSize = `${size / 100}rem`;
      localStorage.setItem("quran_ar_size", size);
    });
  }

  // Translation text size
  if (els.bsSizeSlider) {
    els.bsSizeSlider.addEventListener("input", (e) => {
      const size = e.target.value;
      AppState.settings.bsSize = parseInt(size);
      els.bsSizeVal.innerText = `${size}%`;
      els.translationDisplay.style.fontSize = `${size / 100}rem`;
      // Update preview
      if (els.settingsPreviewBs) els.settingsPreviewBs.style.fontSize = `${size / 100}rem`;
      localStorage.setItem("quran_bs_size", size);
    });
  }

  // Arabic line height
  if (els.arLhSlider) {
    els.arLhSlider.addEventListener("input", (e) => {
      const lh = e.target.value;
      AppState.settings.arLineHeight = parseFloat(lh);
      els.arLhVal.innerText = lh;
      els.arabicDisplay.style.lineHeight = lh;
      // Update preview
      if (els.settingsPreviewAr) els.settingsPreviewAr.style.lineHeight = lh;
      localStorage.setItem("quran_ar_lh", lh);
    });
  }
}

/**
 * Sets up mobile navigation button handlers
 */
function setupMobileNavHandlers() {
  // Surah modal
  if (els.navSurahBtn) {
    els.navSurahBtn.onclick = () => {
      if (els.surahHifzModal && !els.surahHifzModal.classList.contains("hidden")) {
        closeModal("mdl-surah");
      } else {
        closeAllMenusAndModals();
        openModal("mdl-surah");
        
        // Reset filter and focus
        if (els.surahModalFilter) {
          els.surahModalFilter.value = "";
          const items = document.querySelectorAll(".modal-surah-item");
          items.forEach(item => item.classList.remove("hidden"));
          setTimeout(() => els.surahModalFilter.focus(), 100);
        }
      }
    };
  }

  // Hifz drawer
  if (els.navHifzBtn) {
    els.navHifzBtn.onclick = () => {
      if (els.hifzOverlay && !els.hifzOverlay.classList.contains("hidden")) {
        closeAllMenusAndModals();
      } else {
        closeAllMenusAndModals();
        openHifz();
      }
    };
  }
  if (els.hifzCloseMobile) els.hifzCloseMobile.onclick = closeAllMenusAndModals;
  if (els.hifzOverlay) els.hifzOverlay.onclick = closeAllMenusAndModals;

  // Search modal
  if (els.navSearchBtn) {
    els.navSearchBtn.onclick = () => {
      if (els.searchModal && !els.searchModal.classList.contains("hidden")) {
        closeModal("mdl-search");
      } else {
        closeAllMenusAndModals();
        openModal("mdl-search");
        if (els.searchInputModal) {
          setTimeout(() => els.searchInputModal.focus(), 100);
        }
      }
    };
  }

  // Bookmarks drawer
  if (els.navBookmarksBtn) {
    els.navBookmarksBtn.onclick = () => {
      if (els.bookmarksOverlay && !els.bookmarksOverlay.classList.contains("hidden")) {
        closeAllMenusAndModals();
      } else {
        closeAllMenusAndModals();
        openBookmarks();
      }
    };
  }
  if (els.bookmarksClose) els.bookmarksClose.onclick = closeAllMenusAndModals;
  if (els.bookmarksOverlay) els.bookmarksOverlay.onclick = closeAllMenusAndModals;

  // Settings drawer
  if (els.navSettingsBtn) {
    els.navSettingsBtn.onclick = () => {
      if (els.settingsOverlay && !els.settingsOverlay.classList.contains("hidden")) {
        closeAllMenusAndModals();
      } else {
        closeAllMenusAndModals();
        openSettings();
      }
    };
  }

  // Mobile menu toggle
  if (els.mobileGridToggle) {
    els.mobileGridToggle.onclick = () => {
      if (els.sidebarOverlay && !els.sidebarOverlay.classList.contains("hidden")) {
        closeAllMenusAndModals();
      } else {
        closeAllMenusAndModals();
        openSidebar();
      }
    };
  }
  if (els.sidebarClose) els.sidebarClose.onclick = closeAllMenusAndModals;
  if (els.sidebarOverlay) els.sidebarOverlay.onclick = closeAllMenusAndModals;

  // Spread toggle
  if (els.spreadToggle) els.spreadToggle.onclick = toggleSpreadMode;

  // Settings toggle
  if (els.settingsToggle) {
    els.settingsToggle.onclick = () => {
      if (els.settingsOverlay && !els.settingsOverlay.classList.contains("hidden")) {
        closeAllMenusAndModals();
      } else {
        closeAllMenusAndModals();
        openSettings();
      }
    };
  }
  if (els.settingsClose) els.settingsClose.onclick = closeAllMenusAndModals;
  if (els.settingsOverlay) els.settingsOverlay.onclick = closeAllMenusAndModals;
}

/**
 * Sets up navigation input handlers (Juz, Page, Ayah)
 */
function setupNavigationInputs() {
  let navDebounce;

  const handleNavInput = (value, type) => {
    clearTimeout(navDebounce);
    if (!value || isNaN(value)) return;

    const num = parseInt(value);

    // Instant Sibling Update
    if (type === "juz" && num >= 1 && num <= 30) {
      const [s, a] = window.JUZ_DATA[num];
      const p = window.getPageNumber(s, a);
      if (els.pageInput) els.pageInput.value = p;
      if (els.headerPageInput) els.headerPageInput.value = p;
    }

    if (type === "page" && num >= 1 && num <= 604) {
      const [s, a] = window.PAGE_DATA[num];
      if (els.juzInput) els.juzInput.value = window.getJuzNumber(s, a);
    }

    navDebounce = setTimeout(() => {
      if (type === "juz" && num >= 1 && num <= 30) {
        goToJuz(num);
      } else if (type === "page" && num >= 1 && num <= 604) {
        goToPage(num);
      } else if (type === "ayah" && AppState.currentSurah) {
        const max = AppState.currentSurah.verses.length;
        if (num >= 1 && num <= max) {
          goToAyah(num);
        }
      }
    }, 600);
  };

  if (els.juzInput) {
    els.juzInput.oninput = (e) => handleNavInput(e.target.value, "juz");
  }
  if (els.pageInput) {
    els.pageInput.oninput = (e) => handleNavInput(e.target.value, "page");
  }
  if (els.ayahInput) {
    els.ayahInput.oninput = (e) => handleNavInput(e.target.value, "ayah");
  }
  if (els.headerPageInput) {
    els.headerPageInput.oninput = (e) => handleNavInput(e.target.value, "page");
  }
}

/**
 * Sets up Hifz mode toggle and range selection
 */
function setupHifzMode() {
  // Set initial Hifz UI state
  if (els.hifzToggle) els.hifzToggle.checked = AppState.hifzEnabled;
  if (els.hifzToggleMobile) els.hifzToggleMobile.checked = AppState.hifzEnabled;

  const min = AppState.hifzRange?.start;
  const max = AppState.hifzRange?.end;
  let text = "Klikni ajet za opseg";
  if (min !== null && max !== null) {
    text = `Opseg: ${Math.min(min, max) + 1} - ${Math.max(min, max) + 1}`;
  } else if (min !== null) {
    text = `Opseg: ${min + 1} - ...`;
  }
  if (els.hifzRangeText) els.hifzRangeText.innerText = text;
  if (els.hifzRangeTextMobile) els.hifzRangeTextMobile.innerText = text;

  const handleHifzChange = (e) => {
    AppState.hifzEnabled = e.target.checked;
    if (els.hifzToggle) els.hifzToggle.checked = AppState.hifzEnabled;
    if (els.hifzToggleMobile) els.hifzToggleMobile.checked = AppState.hifzEnabled;
    localStorage.setItem("quran_hifzEnabled", AppState.hifzEnabled);

    if (!AppState.hifzEnabled) {
      AppState.hifzRange = { start: null, end: null };
      if (els.hifzRangeText) els.hifzRangeText.innerText = "Klikni na ajet za opseg";
      if (els.hifzRangeTextMobile) els.hifzRangeTextMobile.innerText = "Klikni na ajet za opseg";
      localStorage.setItem("quran_hifzRange", JSON.stringify(AppState.hifzRange));
    }
    renderAyahGrid();
    if (typeof updateToolbarVisibility === "function") updateToolbarVisibility();
  };

  if (els.hifzToggle) els.hifzToggle.onchange = handleHifzChange;
  if (els.hifzToggleMobile) els.hifzToggleMobile.onchange = handleHifzChange;

  // Initial check
  if (typeof updateToolbarVisibility === "function") updateToolbarVisibility();
  
  // Re-check on resize (for mobile/desktop transition)
  window.addEventListener("resize", () => {
    if (typeof updateToolbarVisibility === "function") updateToolbarVisibility();
  });
}

/**
 * Sets up modal system handlers
 */
function setupModals() {
  // About & Version buttons
  if (els.aboutBtn) els.aboutBtn.onclick = () => openModal("mdl-about");

  if (els.versionBtn) {
    els.versionBtn.onclick = () => {
      if (els.versionModal) els.versionModal.removeAttribute("data-auto-open");
      openModal("mdl-version");
    };
  }

  // Close buttons (X)
  document.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.onclick = () => closeModal(btn.dataset.modalClose);
  });

  // Close on overlay click
  if (!window._modalOverlayHandlerInitialized) {
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.classList.add("hidden");
      };
    });
    window._modalOverlayHandlerInitialized = true;
  }
}

/**
 * Updates the display label for the currently selected reciter
 */
function updateReciterLabel() {
  if (els.reciterNameLabel && els.reciterSelect && els.reciterSelect.options.length > 0) {
    const reciterName = els.reciterSelect.options[els.reciterSelect.selectedIndex].text;
    els.reciterNameLabel.innerText = reciterName;
  }
}

// BOOT APPLICATION
init();
