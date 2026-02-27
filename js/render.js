/**
 * @file render.js
 * @description UI RENDERING ENGINE
 * Handles dynamic content injection for Arabic text, Ayah grid, and persistence state UI feedback.
 */

/**
 * Renders the main Ayah display area.
 * - Splits Arabic text into interactive spans for word-highlighting.
 * - Loads translations, notes, and previous recording states.
 * - Synchronizes audio player sources.
 */
const TAJWEED_TOOLTIPS = {
  LAFZATULLAH: {
    name: "Lafzatullah",
    desc: "Ime Allaha se uvijek čita podebljano (tafkhim)",
  },
  izhar: {
    name: "Izhar",
    desc: "Jasno izgovaranje nun sakina ili tenvina bez spajanja",
  },
  ikhfaa: {
    name: "Ihfa",
    desc: "Skriveno izgovaranje nun sakina ili tenvina pred određenim harfovima",
  },
  idghamWithGhunna: {
    name: "Idgam me'al-gunne",
    desc: "Spajanje uz nazalni zvuk (gunnu) kod nun sakina",
  },
  iqlab: { name: "Iklab", desc: "Pretvaranje nun sakina u mim pred harfom ba" },
  qalqala: {
    name: "Kalkala",
    desc: "Odzvanjanje harfova ق ط ب ج د kad su sakin",
  },
  idghamWithoutGhunna: {
    name: "Idgam bila gunne",
    desc: "Spajanje bez nazalnog zvuka kod lam i ra",
  },
  ghunna: { name: "Gunna", desc: "Nazalni zvuk koji traje dva hareketa" },
  prolonging: {
    name: "Medd",
    desc: "Duženje samoglasnika preko uobičajenog trajanja",
  },
  alefTafreeq: {
    name: "Elif tefrik",
    desc: "Elif koji se piše ali se ne izgovara",
  },
  hamzatulWasli: {
    name: "Hemzetul-vasl",
    desc: "Hemze koje se čita samo na početku, inače se preskače",
  },
};

/**
 * GLOBAL TAJWEED TOOLTIP MANAGEMENT
 * Prevents "breaking" Arabic letters by avoiding position:relative on inline segments.
 */
let globalTajweedTooltip = null;

function getGlobalTooltip() {
  if (!globalTajweedTooltip) {
    globalTajweedTooltip = document.createElement("div");
    globalTajweedTooltip.className = "tajweed-tooltip";
    // We force some styles here to ensure it works globally
    globalTajweedTooltip.style.position = "fixed";
    globalTajweedTooltip.style.display = "none";
    globalTajweedTooltip.style.zIndex = "9999";
    document.body.appendChild(globalTajweedTooltip);
  }
  return globalTajweedTooltip;
}

function showTajweedTooltip(target, tip) {
  const tooltip = getGlobalTooltip();
  tooltip.innerHTML = `<strong>${tip.name}</strong><div class="mt-1 opacity-90">${tip.desc}</div>`;

  tooltip.style.display = "block";
  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  // Position it above the span, centered horizontally
  let left = rect.left + rect.width / 2;

  // Basic screen boundary check
  if (left - tooltipRect.width / 2 < 10) left = tooltipRect.width / 2 + 10;
  if (left + tooltipRect.width / 2 > window.innerWidth - 10)
    left = window.innerWidth - tooltipRect.width / 2 - 10;

  tooltip.style.left = left + "px";
  tooltip.style.top = "auto";
  tooltip.style.bottom = window.innerHeight - rect.top + 10 + "px";
}

function hideTajweedTooltip() {
  if (globalTajweedTooltip) {
    globalTajweedTooltip.style.display = "none";
    globalTajweedTooltip.dataset.activeTarget = "";
  }
}

// Global click listener to hide tooltip when clicking outside
document.addEventListener("click", () => {
  hideTajweedTooltip();
});

window.renderAyah = function () {
  const ayah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  const key = `${AppState.currentSurah.id}-${ayah.id}`;

  if (els.currentSurahName) {
    els.currentSurahName.textContent = `${AppState.currentSurah.id}. ${AppState.currentSurah.trans}`;
  }

  // 1. Arabic word-by-word injection with Tajweed support
  els.arabicDisplay.innerHTML = "";
  const activeHighlights = AppState.highlights[key] || [];

  // Parse text using Tajweed tokenizer if available, otherwise fallback to single plain token
  if (!window._tajweedCache) window._tajweedCache = new Map();
  let tokens;
  if (window.Tajweed) {
    if (window._tajweedCache.has(key)) {
      tokens = window._tajweedCache.get(key);
    } else {
      tokens = window.Tajweed.tokenize(ayah.ar);
      window._tajweedCache.set(key, tokens);
    }
  } else {
    tokens = [{ text: ayah.ar, rule: "none" }];
  }

  // Clear previous Highlight API instances for Tajweed
  if (window.CSS && CSS.highlights) {
    CSS.highlights.forEach((val, key) => {
      if (key.startsWith("rule-")) {
        CSS.highlights.delete(key);
      }
    });
  }

  const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
  const useHighlightAPI = isFirefox && window.CSS && CSS.highlights;

  let words = [];
  let currentWord = { text: "", segments: [] };

  tokens.forEach((token) => {
    const parts = token.text.split(" ");
    parts.forEach((part, i) => {
      if (part.length > 0) {
        currentWord.segments.push({
          text: part,
          rule: token.rule,
          tip:
            typeof TAJWEED_TOOLTIPS !== "undefined"
              ? TAJWEED_TOOLTIPS[token.rule]
              : null,
        });
        currentWord.text += part;
      }

      // If there are more parts, it means a space was encountered
      if (i < parts.length - 1) {
        if (currentWord.text.length > 0) {
          words.push(currentWord);
        }
        words.push({ isSpace: true });
        currentWord = { text: "", segments: [] };
      }
    });
  });

  if (currentWord.text.length > 0) {
    words.push(currentWord);
  }

  let wordIndex = 0;

  words.forEach((wd) => {
    if (wd.isSpace) {
      els.arabicDisplay.appendChild(document.createTextNode(" "));
      return;
    }

    const currentWordSpan = document.createElement("span");
    currentWordSpan.className =
      "quran-word px-0.5 rounded-md transition-all cursor-pointer hover:bg-emerald-500/20";

    if (activeHighlights.includes(wordIndex)) {
      currentWordSpan.classList.add("bg-emerald-600/60", "text-white");
    }
    const captureIdx = wordIndex;
    currentWordSpan.onclick = (e) => {
      e.stopPropagation();
      toggleWordHighlight(key, captureIdx);
    };

    // Append to document FIRST, as Range APIs require nodes to be in the DOM
    els.arabicDisplay.appendChild(currentWordSpan);

    if (useHighlightAPI) {
      // Firefox Highlight API method: no inner spans, single text node to prevent line-box clipping
      const textNode = document.createTextNode(wd.text);
      currentWordSpan.appendChild(textNode);

      let currentOffset = 0;
      wd.segments.forEach((seg) => {
        const segLen = seg.text.length;
        if (seg.rule && seg.rule !== "none") {
          // Calculate range for highlight API regardless of settings
          // but only add to highlights if tajweed is enabled
          if (AppState.settings.tajweed) {
            const range = new Range();
            range.setStart(textNode, currentOffset);
            range.setEnd(textNode, currentOffset + segLen);

            const hName = `rule-${seg.rule}`;
            if (!CSS.highlights.has(hName)) {
              CSS.highlights.set(hName, new Highlight());
            }
            CSS.highlights.get(hName).add(range);

            if (seg.tip) {
              currentWordSpan.addEventListener("mouseenter", function () {
                if (window.innerWidth >= 768)
                  showTajweedTooltip(currentWordSpan, seg.tip);
              });
              currentWordSpan.addEventListener("mouseleave", function () {
                if (window.innerWidth >= 768) hideTajweedTooltip();
              });
            }
          }
        }
        currentOffset += segLen;
      });
    } else {
      // Standard method: span per colored segment
      wd.segments.forEach((seg) => {
        const tSpan = document.createElement("span");
        tSpan.textContent = seg.text;
        if (seg.rule && seg.rule !== "none") {
          tSpan.classList.add(`rule-${seg.rule}`);
          if (seg.tip) {
            tSpan.addEventListener("mouseenter", function () {
              if (window.innerWidth >= 768) showTajweedTooltip(tSpan, seg.tip);
            });
            tSpan.addEventListener("mouseleave", function () {
              if (window.innerWidth >= 768) hideTajweedTooltip();
            });
          }
        }
        currentWordSpan.appendChild(tSpan);
      });
    }

    wordIndex++;
  });

  // 2. Translation & Metadata
  els.translationDisplay.textContent = ayah.bs;
  els.ayahInput.value = AppState.currentAyahIndex + 1;
  els.totalAyahsNum.textContent = AppState.currentSurah.verses.length;

  // Juz & Page metadata (Medina Mushaf)
  if (typeof window.getJuzNumber === "function") {
    const juzNum = window.getJuzNumber(AppState.currentSurah.id, ayah.id);
    const pageNum = window.getPageNumber(AppState.currentSurah.id, ayah.id);

    // Sync card inputs
    if (els.juzInput) els.juzInput.value = juzNum;
    if (els.pageInput) els.pageInput.value = pageNum;
  }

  // Tajweed Legend — show rules present in this ayah (controlled by settings)
  const legendContainer = document.getElementById("tajweed-legend-container");
  const legendEl = document.getElementById("tajweed-legend");
  if (legendContainer && legendEl) {
    legendEl.innerHTML = "";
    const tajweedEnabled = AppState.settings?.tajweed !== false;
    const legendEnabled = AppState.settings?.tajweedLegend !== false;
    if (tajweedEnabled && legendEnabled && window.Tajweed) {
      // Colour map matching styles.css .tajweed-active span.rule-*
      const RULE_COLORS = {
        LAFZATULLAH: "#81c784",
        izhar: "#6ff0f5",
        ikhfaa: "#fa4444",
        idghamWithGhunna: "#f06292",
        iqlab: "#3b82f6",
        qalqala: "#d6f046",
        idghamWithoutGhunna: "#2dd4bf",
        alefTafreeq: "#e879f9",
        hamzatulWasli: "#9e9e9e",
        ghunna: "#eab308",
        prolonging: "#bfa5ec",
      };
      const seenRules = new Set();
      tokens.forEach((t) => {
        if (t.rule && t.rule !== "none" && RULE_COLORS[t.rule]) {
          seenRules.add(t.rule);
        }
      });

      if (seenRules.size > 0) {
        seenRules.forEach((rule) => {
          const tip = TAJWEED_TOOLTIPS[rule];
          const color = RULE_COLORS[rule];
          const chip = document.createElement("span");
          chip.style.cssText = `color:${color}; background:${color}18; border:1px solid ${color}55;`;
          chip.className =
            "text-[10px] font-bold px-2 py-1 rounded-xl cursor-pointer text-center whitespace-nowrap transition-all hover:scale-105 active:scale-95";
          chip.textContent = tip ? tip.name : rule;

          if (tip) {
            chip.addEventListener("click", (e) => {
              e.stopPropagation(); // prevent window click from hiding immediately
              const tooltip = getGlobalTooltip();
              if (
                tooltip.style.display === "block" &&
                tooltip.dataset.activeTarget === rule
              ) {
                hideTajweedTooltip();
              } else {
                showTajweedTooltip(chip, tip);
                tooltip.dataset.activeTarget = rule;
              }
            });
          }

          legendEl.appendChild(chip);
        });
        legendContainer.classList.remove("hidden");
      } else {
        legendContainer.classList.add("hidden");
      }
    } else {
      legendContainer.classList.add("hidden");
    }
  }

  // 3. Sync Recording State
  if (AppState.recordings[key]) {
    els.userAudioContainer.classList.remove("hidden");
    if (els.audioPlayback.src !== AppState.recordings[key]) {
      els.audioPlayback.src = AppState.recordings[key];
      els.audioPlayback.load();
      resetUserAudioUI();
    }
    els.recordText.innerText = T.recordAgain;
  } else {
    els.userAudioContainer.classList.add("hidden");
    if (els.audioPlayback.src) {
      els.audioPlayback.pause();
      els.audioPlayback.removeAttribute("src");
      els.audioPlayback.load();
    }
    els.recordText.innerText = T.record;
  }

  // 4. Sync Recitation Audio
  const expectedSrc = getAyahAudioUrl(AppState.currentSurah.id, ayah.id);

  if (!els.ayahAudio.src.includes(expectedSrc)) {
    els.ayahAudio.pause();
    els.ayahAudio.src = expectedSrc;
    els.ayahAudio.load();
    resetAyahAudioUI();
  }
  els.ayahAudioContainer.classList.remove("hidden");

  // Zero-Latency Audio Preloading for the next Ayah
  const nextIdx = AppState.currentAyahIndex + 1;
  if (nextIdx < AppState.currentSurah.verses.length) {
    const nextAyah = AppState.currentSurah.verses[nextIdx];
    const nextSrc = getAyahAudioUrl(AppState.currentSurah.id, nextAyah.id);
    if (!window._audioPreloader) window._audioPreloader = new Audio();
    if (!window._audioPreloader.src.includes(nextSrc)) {
      window._audioPreloader.src = nextSrc;
      window._audioPreloader.preload = "auto";
    }
  }

  // 5. Notes, Checkmarks, & Bookmarks
  if (els.ayahNotesContainer) {
    if (AppState.settings.showNotes) {
      els.ayahNotes.value = AppState.notes[key] || "";
    }
  }

  if (AppState.checkedAyats.has(key)) {
    els.validBtn.classList.replace("bg-slate-800", "bg-emerald-600");
    els.validBtn.classList.add("border-emerald-400");
  } else {
    els.validBtn.classList.replace("bg-emerald-600", "bg-slate-800");
    els.validBtn.classList.remove("border-emerald-400");
  }

  if (AppState.bookmarks.has(key)) {
    els.bookmarkBtn.classList.replace("bg-slate-800", "bg-emerald-600");
    els.bookmarkBtn.classList.add("border-emerald-400");
    els.bookmarkBtn.querySelector("ion-icon").name = "bookmark";
  } else {
    els.bookmarkBtn.classList.replace("bg-emerald-600", "bg-slate-800");
    els.bookmarkBtn.classList.remove("border-emerald-400");
    els.bookmarkBtn.querySelector("ion-icon").name = "bookmark-outline";
  }

  // 6. Highlight active grid cell (O(1))
  if (AppState._prevGridIndex != null) {
    updateGridCellState(AppState._prevGridIndex);
  }
  updateGridCellState(AppState.currentAyahIndex);

  const cells = els.ayahGrid.children;
  const cur = cells[AppState.currentAyahIndex];
  if (cur) {
    cur.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  AppState._prevGridIndex = AppState.currentAyahIndex;

  // 7. Swipe UX: Slide-fade transition (mobile only)
  if (AppState.swipeDirection) {
    if (window.innerWidth < 768) {
      const animClass =
        AppState.swipeDirection === "left"
          ? "animate-slide-left"
          : "animate-slide-right";
      els.arabicDisplay.classList.remove(
        "animate-slide-left",
        "animate-slide-right",
      );
      els.translationDisplay.classList.remove(
        "animate-slide-left",
        "animate-slide-right",
      );
      void els.arabicDisplay.offsetWidth; // force reflow
      els.arabicDisplay.classList.add(animClass);
      els.translationDisplay.classList.add(animClass);
    }

    // Play the physical swipe effect
    if (typeof window.playSwipeEffect === "function") {
      window.playSwipeEffect(AppState.swipeDirection);
    }

    AppState.swipeDirection = null;
  }
};

/**
 * Updates a single grid cell's state classes (O(1) update) instead of rebuilding the entire grid.
 */
window.updateGridCellState = function (idx) {
  const cellsToUpdate = [];
  if (els.ayahGrid && els.ayahGrid.children[idx]) {
    cellsToUpdate.push(els.ayahGrid.children[idx]);
  }
  if (els.ayahGridMobile && els.ayahGridMobile.children[idx]) {
    cellsToUpdate.push(els.ayahGridMobile.children[idx]);
  }
  if (cellsToUpdate.length === 0) return;

  const surahId = AppState.currentSurah.id;
  const verse = AppState.currentSurah.verses[idx];
  const key = `${surahId}-${verse.id}`;

  const isActive = idx === AppState.currentAyahIndex;
  const isChecked = AppState.checkedAyats.has(key);
  const hasNotes = !!AppState.notes[key];

  const hifzActive = AppState.hifzEnabled;
  const hifzHasRange =
    hifzActive &&
    AppState.hifzRange.start !== null &&
    AppState.hifzRange.end !== null;
  const hifzMin = hifzHasRange
    ? Math.min(AppState.hifzRange.start, AppState.hifzRange.end)
    : null;
  const hifzMax = hifzHasRange
    ? Math.max(AppState.hifzRange.start, AppState.hifzRange.end)
    : null;
  const isHifzRange = hifzMin !== null && idx >= hifzMin && idx <= hifzMax;

  cellsToUpdate.forEach((cell) => {
    // Remove existing state classes
    cell.classList.remove(
      "bg-slate-800",
      "text-emerald-400",
      "border-emerald-500",
      "shadow-md",
      "shadow-emerald-500/20",
      "bg-emerald-600",
      "text-white",
      "bg-rose-500/10",
      "border-dashed",
      "border-rose-500/30",
      "text-rose-300",
      "hover:bg-rose-500/20",
      "text-slate-300",
      "border-slate-700",
      "hover:bg-slate-600",
    );

    // Apply new state classes
    if (isActive) {
      cell.classList.add(
        "bg-slate-800",
        "text-emerald-400",
        "border",
        "border-emerald-500",
        "shadow-md",
        "shadow-emerald-500/20",
      );
    } else if (isChecked) {
      cell.classList.add("bg-emerald-600", "text-white");
    } else if (isHifzRange) {
      cell.classList.add(
        "bg-rose-500/10",
        "border",
        "border-dashed",
        "border-rose-500/30",
        "text-rose-300",
        "hover:bg-rose-500/20",
      );
    } else {
      cell.classList.add(
        "bg-slate-800",
        "text-slate-300",
        "border",
        "border-slate-700",
        "hover:bg-slate-600",
      );
    }

    if (hasNotes) {
      cell.style.borderBottom = "2px solid #f59e0b";
    } else {
      cell.style.borderBottom = "";
    }
  });
};

/**
 * Rebuilds the scrollable Ayah grid in the sidebar.
 * Uses pill-shaped cells with inline icons for Juz/Page/Hifz indicators.
 */
window.renderAyahGrid = function () {
  if (els.ayahGrid) els.ayahGrid.innerHTML = "";
  if (els.ayahGridMobile) els.ayahGridMobile.innerHTML = "";

  const frag = document.createDocumentFragment();
  const fragMobile = document.createDocumentFragment();
  const surahId = AppState.currentSurah.id;
  const hasMetadata = typeof window.getJuzStartAt === "function";

  // Pre-compute hifz boundaries
  const hifzActive = AppState.hifzEnabled;
  const hifzHasRange =
    hifzActive &&
    AppState.hifzRange.start !== null &&
    AppState.hifzRange.end !== null;
  const hifzMin = hifzHasRange
    ? Math.min(AppState.hifzRange.start, AppState.hifzRange.end)
    : null;
  const hifzMax = hifzHasRange
    ? Math.max(AppState.hifzRange.start, AppState.hifzRange.end)
    : null;

  AppState.currentSurah.verses.forEach((verse, index) => {
    const cell = document.createElement("button");
    const key = `${surahId}-${verse.id}`;

    const isActive = index === AppState.currentAyahIndex;
    const isChecked = AppState.checkedAyats.has(key);
    const isHifzRange =
      hifzMin !== null && index >= hifzMin && index <= hifzMax;
    const hasNotes = !!AppState.notes[key];

    // 1. Detect juz/page starts
    let juzStart = null;
    let pageStart = null;
    if (hasMetadata) {
      juzStart = window.getJuzStartAt(surahId, verse.id);
      pageStart = window.getPageStartAt(surahId, verse.id);
    }

    // 2. Collect indicators (dots)
    const dots = [];
    if (isHifzRange && hifzActive) {
      dots.push('<div class="w-2 h-2 bg-rose-400 rounded-full"></div>');
    }
    if (juzStart !== null) {
      dots.push('<div class="w-2 h-2 bg-amber-500 rounded-full"></div>');
      cell.title = `Džuz ${juzStart}`;
    }
    if (pageStart !== null) {
      dots.push('<div class="w-2 h-2 bg-blue-400 rounded-full"></div>');
      cell.title = cell.title
        ? cell.title + ` · Str. ${pageStart}`
        : `Str. ${pageStart}`;
    }

    // 3. Base class & Dynamic layout
    cell.className =
      "ayah-cell relative h-11 w-full px-1 flex rounded-lg text-xs font-medium transition-all active:scale-95 ";

    let html = "";
    if (dots.length > 0) {
      cell.classList.add("flex-col", "items-center", "justify-center", "gap-1");
      html = `<span class="text-[10px] leading-none">${index + 1}</span>
                <div class="flex items-center justify-center gap-1 opacity-90 w-full">${dots.join("")}</div>`;
    } else {
      cell.classList.add("items-center", "justify-center");
      html = `<span class="text-xs">${index + 1}</span>`;
    }

    cell.innerHTML = html;

    // 4. State styling
    if (isActive) {
      cell.classList.add(
        "bg-slate-800",
        "text-emerald-400",
        "border",
        "border-emerald-500",
        "shadow-md",
        "shadow-emerald-500/20",
      );
    } else if (isChecked) {
      cell.classList.add("bg-emerald-600", "text-white");
    } else if (isHifzRange) {
      cell.classList.add(
        "bg-rose-500/10",
        "border",
        "border-dashed",
        "border-rose-500/30",
        "text-rose-300",
        "hover:bg-rose-500/20",
      );
    } else {
      cell.classList.add(
        "bg-slate-800",
        "text-slate-300",
        "border",
        "border-slate-700",
        "hover:bg-slate-600",
      );
    }

    if (hasNotes) {
      cell.style.borderBottom = "2px solid #f59e0b";
    }

    cell.dataset.index = index;
    frag.appendChild(cell);

    const cellMobile = cell.cloneNode(true);
    fragMobile.appendChild(cellMobile);
  });

  if (els.ayahGrid) els.ayahGrid.appendChild(frag);
  if (els.ayahGridMobile) els.ayahGridMobile.appendChild(fragMobile);

  // Setup Event Delegation for dynamic clicks
  const delegateClick = (e) => {
    const btn = e.target.closest("button.ayah-cell");
    if (!btn) return;
    const idx = parseInt(btn.dataset.index);

    if (AppState.hifzEnabled) {
      if (AppState.hifzRange.start === null) {
        AppState.hifzRange.start = idx;
        AppState.hifzRange.end = null;
        if (els.hifzRangeText)
          els.hifzRangeText.innerText = `Opseg: ${idx + 1} - ...`;
        if (els.hifzRangeTextMobile)
          els.hifzRangeTextMobile.innerText = `Opseg: ${idx + 1} - ...`;
      } else if (AppState.hifzRange.end === null) {
        AppState.hifzRange.end = idx;
        const min = Math.min(AppState.hifzRange.start, AppState.hifzRange.end);
        const max = Math.max(AppState.hifzRange.start, AppState.hifzRange.end);
        if (els.hifzRangeText)
          els.hifzRangeText.innerText = `Opseg: ${min + 1} - ${max + 1}`;
        if (els.hifzRangeTextMobile)
          els.hifzRangeTextMobile.innerText = `Opseg: ${min + 1} - ${max + 1}`;
      } else {
        AppState.hifzRange.start = idx;
        AppState.hifzRange.end = null;
        if (els.hifzRangeText)
          els.hifzRangeText.innerText = `Opseg: ${idx + 1} - ...`;
        if (els.hifzRangeTextMobile)
          els.hifzRangeTextMobile.innerText = `Opseg: ${idx + 1} - ...`;
      }
      localStorage.setItem(
        "quran_hifzRange",
        JSON.stringify(AppState.hifzRange),
      );
      renderAyahGrid(); // Full grid re-render to apply ranges easily
    } else {
      if (typeof closeHifz === "function") closeHifz();
      if (window.innerWidth < 768 && typeof closeSidebar === "function")
        closeSidebar();
      goToAyah(idx + 1);
    }
  };

  if (els.ayahGrid) els.ayahGrid.onclick = delegateClick;
  if (els.ayahGridMobile) els.ayahGridMobile.onclick = delegateClick;

  // Auto-scroll active ayah into view
  setTimeout(() => {
    const activeCell = els.ayahGrid.querySelector(".ayah-cell.bg-slate-800");
    if (activeCell) {
      activeCell.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100); // Small delay to ensure rendering is complete
  // Reset tracked index for the O(1) cell update in renderAyah
  AppState._prevGridIndex = AppState.currentAyahIndex;
};

/**
 * Renders the bookmarks list in the sidebar and mobile drawer.
 */
window.renderBookmarks = function () {
  if (els.bookmarksList) els.bookmarksList.innerHTML = "";
  if (els.bookmarksListMobile) els.bookmarksListMobile.innerHTML = "";

  if (AppState.bookmarks.size === 0) {
    const emptyHtml = `<div class="text-slate-500 italic text-center w-full mt-4 text-xs">${T.noBookmarks}</div>`;
    if (els.bookmarksList) els.bookmarksList.innerHTML = emptyHtml;
    if (els.bookmarksListMobile) els.bookmarksListMobile.innerHTML = emptyHtml;
    return;
  }

  [...AppState.bookmarks].forEach((key) => {
    const [surahId, ayahId] = key.split("-").map(Number);
    const surah = AppState.data.find((s) => s.id === surahId);
    if (!surah) return;

    // Find absolute index of ayah in surah to be able to jump to it
    const verseIndex = surah.verses.findIndex((v) => v.id === ayahId);
    if (verseIndex === -1) return;

    // Helper to generate a single bookmark row
    const createRow = () => {
      const container = document.createElement("div");
      container.className = "flex items-center gap-2 w-full";

      const btn = document.createElement("button");
      btn.className =
        "flex-1 text-left bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300 font-bold transition-colors flex justify-between items-center group";

      btn.innerHTML = `
        <span>Sura ${surah.id}. ${surah.trans}, Ajet ${verseIndex + 1}</span>
        <ion-icon name="arrow-forward-outline" class="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400"></ion-icon>
      `;

      btn.onclick = () => {
        closeSidebar();
        if (typeof closeBookmarks === "function") closeBookmarks();

        els.surahSelect.value = surahId;
        loadSurah(surahId);
        AppState.currentAyahIndex = verseIndex;
        renderAyah();
        renderAyahGrid();
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.className =
        "flex-shrink-0 bg-slate-800 hover:bg-rose-900 border border-transparent hover:border-rose-500 text-slate-400 hover:text-rose-400 p-2 rounded-lg transition-colors flex items-center justify-center";
      deleteBtn.innerHTML = `<ion-icon name="trash-outline" class="text-xl"></ion-icon>`;
      deleteBtn.title = "Remove Bookmark";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        AppState.bookmarks.delete(key);
        localStorage.setItem(
          "quran_bookmarks",
          JSON.stringify([...AppState.bookmarks]),
        );
        renderBookmarks();
        renderAyah();
      };

      container.appendChild(btn);
      container.appendChild(deleteBtn);
      return container;
    };

    if (els.bookmarksList) els.bookmarksList.appendChild(createRow());
    if (els.bookmarksListMobile)
      els.bookmarksListMobile.appendChild(createRow());
  });
};
