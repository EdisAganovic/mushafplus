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

/**
 * Helper: Returns all ayahs for a specific page number.
 * @param {number} pageNum
 */
window.getPageAyahs = function (pageNum) {
  if (pageNum < 1 || pageNum > 604) return [];
  const start = window.PAGE_DATA[pageNum];
  const next = pageNum < 604 ? window.PAGE_DATA[pageNum + 1] : [115, 1];

  let ayahs = [];
  let s = start[0];
  let a = start[1];

  while (s < next[0] || (s === next[0] && a < next[1])) {
    const surah = AppState.data.find((sur) => sur.id === s);
    if (!surah) break;
    const ayah = surah.verses.find((v) => v.id === a);
    if (ayah) {
      ayahs.push({ ...ayah, surahId: s, surahTrans: surah.trans });
    }

    if (a < surah.verses.length) {
      a++;
    } else {
      s++;
      a = 1;
    }
  }
  return ayahs;
};

/**
 * Fetches physical page layout (line breaks) from GitHub CDN.
 * @param {number} pageNum 
 */
window.fetchPageLayout = async function (pageNum) {
  if (AppState.settings.layouts && AppState.settings.layouts[pageNum]) {
    return AppState.settings.layouts[pageNum];
  }
  
  const paddedPage = String(pageNum).padStart(3, '0');
  const url = `https://raw.githubusercontent.com/zonetecde/mushaf-layout/main/mushaf/page-${paddedPage}.json`;
  
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Failed to load layout");
    const data = await resp.json();
    if (!AppState.settings.layouts) AppState.settings.layouts = {};
    AppState.settings.layouts[pageNum] = data;
    return data;
  } catch (err) {
    console.warn(`Layout fetch failed for page ${pageNum}`, err);
    return null;
  }
};

window.syncNavigationInputs = function() {
  const ayah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  if (typeof window.getJuzNumber === "function" && typeof window.getPageNumber === "function") {
    const juzNum = window.getJuzNumber(AppState.currentSurah.id, ayah.id);
    const pageNum = window.getPageNumber(AppState.currentSurah.id, ayah.id);
    if (els.juzInput) els.juzInput.value = juzNum;
    if (els.pageInput) els.pageInput.value = pageNum;
    if (els.headerPageInput) els.headerPageInput.value = pageNum;
  }
};

window.renderAyah = function () {
  const ayah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  const key = `${AppState.currentSurah.id}-${ayah.id}`;

  // Keep inputs in sync
  syncNavigationInputs();

  if (els.currentSurahName) {
    els.currentSurahName.textContent = `${AppState.currentSurah.id}. ${AppState.currentSurah.trans}`;
  }

  // Handle Spread Mode Toggle
  if (AppState.settings.spreadMode) {
    els.ayahCard.classList.add("hidden");
    els.spreadCard.classList.remove("hidden");
    renderSpread();
    return;
  } else {
    els.ayahCard.classList.remove("hidden");
    els.spreadCard.classList.add("hidden");
  }

  // 1. Arabic word-by-word injection with Tajweed support
  els.arabicDisplay.innerHTML = "";
  const activeHighlights = AppState.highlights[key] || [];

  // Parse text using Tajweed tokenizer if available, otherwise fallback to single plain token
  const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
  const useHighlightAPI = isFirefox && window.CSS && CSS.highlights;

  // -- OPTIMIZATION: Limited Cache Size (prevent memory bloat) --
  if (!window._tajweedCache) window._tajweedCache = new Map();
  if (window._tajweedCache.size > 100) {
    const firstKey = window._tajweedCache.keys().next().value;
    window._tajweedCache.delete(firstKey);
  }

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
    CSS.highlights.forEach((val, hKey) => {
      if (hKey.startsWith("rule-")) {
        CSS.highlights.delete(hKey);
      }
    });
  }

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

  // -- OPTIMIZATION: Reuse established tooltip data via attributes for delegation --
  words.forEach((wd) => {
    if (wd.isSpace) {
      els.arabicDisplay.appendChild(document.createTextNode(" "));
      return;
    }

    const currentWordSpan = document.createElement("span");
    currentWordSpan.className =
      "quran-word px-0.5 rounded-md transition-all cursor-pointer hover:bg-emerald-500/20";
    currentWordSpan.dataset.index = wordIndex;

    if (activeHighlights.includes(wordIndex)) {
      currentWordSpan.classList.add("bg-emerald-600/60", "text-white");
    }

    // Append to document FIRST
    els.arabicDisplay.appendChild(currentWordSpan);

    if (useHighlightAPI) {
      const textNode = document.createTextNode(wd.text);
      currentWordSpan.appendChild(textNode);

      let currentOffset = 0;
      wd.segments.forEach((seg) => {
        const segLen = seg.text.length;
        if (seg.rule && seg.rule !== "none") {
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
              // Store tip in dataset for event delegation
              currentWordSpan.dataset.tipName = seg.tip.name;
              currentWordSpan.dataset.tipDesc = seg.tip.desc;
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
            // Store tip in dataset
            currentWordSpan.dataset.tipName = seg.tip.name;
            currentWordSpan.dataset.tipDesc = seg.tip.desc;
          }
        }
        currentWordSpan.appendChild(tSpan);
      });
    }

    wordIndex++;
  });

  // -- OPTIMIZATION: Use Event Delegation for word clicks and tooltips --
  // This replaces N listeners with 1 listener on the container
  els.arabicDisplay.onclick = (e) => {
    const wordSpan = e.target.closest(".quran-word");
    if (wordSpan) {
      const idx = parseInt(wordSpan.dataset.index);
      toggleWordHighlight(key, idx);
    }
  };

  els.arabicDisplay.onmouseover = (e) => {
    if (window.innerWidth < 768) return;
    const wordSpan = e.target.closest(".quran-word");
    if (wordSpan && wordSpan.dataset.tipName) {
      showTajweedTooltip(wordSpan, {
        name: wordSpan.dataset.tipName,
        desc: wordSpan.dataset.tipDesc,
      });
    }
  };

  els.arabicDisplay.onmouseout = (e) => {
    if (window.innerWidth < 768) return;
    const wordSpan = e.target.closest(".quran-word");
    if (wordSpan) hideTajweedTooltip();
  };

  // 2. Translation & Metadata
  els.translationDisplay.textContent = ayah.bs;
  els.ayahInput.value = AppState.currentAyahIndex + 1;
  els.totalAyahsNum.textContent = AppState.currentSurah.verses.length;

  // Juz & Page metadata (Medina Mushaf)
  if (typeof window.getJuzNumber === "function") {
    const pageNum = window.getPageNumber(AppState.currentSurah.id, ayah.id);

    // Page Progress Indicator (npr. (2/6))
    if (els.pageProgress && window.PAGE_DATA && AppState.data.length > 0) {
      const startObj = window.PAGE_DATA[pageNum];
      const endObj = pageNum < 604 ? window.PAGE_DATA[pageNum + 1] : [115, 1];

      let s = startObj[0];
      let a = startObj[1];
      let vCount = 0;
      let foundCurrent = 0;

      while (s < endObj[0] || (s === endObj[0] && a < endObj[1])) {
        vCount++;
        if (s === AppState.currentSurah.id && a === ayah.id) {
          foundCurrent = vCount;
        }

        const surahData = AppState.data[s - 1];
        if (!surahData) break;

        if (a < surahData.verses.length) {
          a++;
        } else {
          s++;
          a = 1;
        }
      }

      if (foundCurrent > 0) {
        els.pageProgress.textContent = `${foundCurrent}/${vCount}`;
        els.pageProgressContainer.classList.remove('hidden');
      } else {
        els.pageProgressContainer.classList.add('hidden');
      }
    }
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
      els.audioPlayback.pause();
      els.audioPlayback.removeAttribute("src");
      els.audioPlayback.load();
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
    // Explicitly clear src and load to release memory/buffers for the previous track
    els.ayahAudio.removeAttribute("src");
    els.ayahAudio.load();
    
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
      // Clear previous preloaded track
      window._audioPreloader.pause();
      window._audioPreloader.removeAttribute("src");
      window._audioPreloader.load();
      
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
  if (!verse) return; // Boundary check to prevent "verse is undefined" error when switching surahs
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
  }, 100);
  AppState._prevGridIndex = AppState.currentAyahIndex;
};

/**
 * Renders the side-by-side spread view using SVG data (RTL).
 */
const PAGE_SVG_CACHE = new Map();

/**
 * Pre-processes an SVG string to prevent ID collisions.
 */
function preprocessSvg(svgText, pageNum) {
  const prefix = `p${pageNum}-`;
  // Prefix id="..."
  let processed = svgText.replace(/id="([^"]+)"/g, `id="${prefix}$1"`);
  // Prefix url(#...)
  processed = processed.replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`);
  // Prefix xlink:href="#..."
  processed = processed.replace(/xlink:href="#([^"]+)"/g, `xlink:href="#${prefix}$1"`);
  // Replace original light green (#bfe8c1) with app's emerald green (#10b981)
  processed = processed.replace(/#bfe8c1/gi, "#10b981");

  // Ensure SVG is responsive: remove hardcoded width/height if they exist, add 100% and preserveAspectRatio
  processed = processed.replace(/<svg([^>]*)>/, (match, p1) => {
    // Remove existing width/height attributes from the tag
    let updated = p1.replace(/\s(width|height)="[^"]*"/g, '');
    return `<svg${updated} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="shape-rendering: geometricPrecision;">`;
  });

  return processed;
}

/**
 * Prefetches and caches adjacent pages for smoother navigation.
 */
async function prefetchAdjacentPages(pageNum) {
  const pagesToPrefetch = [pageNum + 1, pageNum + 2, pageNum - 1].filter(
    (p) => p >= 1 && p <= 604 && !PAGE_SVG_CACHE.has(p)
  );

  for (const p of pagesToPrefetch) {
    const paddedPage = String(p).padStart(3, "0");
    const svgUrl = `assets/optimized/${paddedPage}.svg`;
    fetch(svgUrl)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (text) PAGE_SVG_CACHE.set(p, preprocessSvg(text, p));
      })
      .catch(() => {});
  }
}

window.renderSpread = async function () {
  if (!els.spreadView) return;
  
  // Keep inputs in sync
  syncNavigationInputs();
  
  const currentAyah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  const currentPage = getPageNumber(AppState.currentSurah.id, currentAyah.id);

  let leftPageNum, rightPageNum;
  if (currentPage === 1) {
    leftPageNum = null;
    rightPageNum = 1;
  } else {
    // Medina Mushaf: Even on Left, Odd on Right
    if (currentPage % 2 === 0) {
      leftPageNum = currentPage;
      rightPageNum = currentPage + 1 <= 604 ? currentPage + 1 : null;
    } else {
      leftPageNum = currentPage - 1;
      rightPageNum = currentPage;
    }
  }

  els.spreadView.innerHTML = "";
  // We use the CSS class for row-reverse
  els.spreadView.className = "w-full flex-row-reverse-spread animate-fade-in";

  // Build promises for both pages [Right, Left]
  // Because of row-reverse:
  // idx 0 (Right) will appear on the RIGHT
  // idx 1 (Left) will appear on the LEFT
  const pagePromises = [leftPageNum, rightPageNum].map(async (pageNum, idx) => {
    const isRight = idx === 1; // Now the second element is the right page
    const pageCol = document.createElement("div");
    pageCol.className = "flex-1 flex flex-col items-center min-w-0 h-full scrollbar-hidden";

    if (pageNum === null) {
      pageCol.classList.add("hidden", "lg:flex", "invisible");
      return pageCol;
    }

    const pageCard = document.createElement("div");
    // Apply asymmetrical rounding for the spine effect
    pageCard.className = `w-full bg-transparent shadow-none flex flex-col h-full ${isRight ? 'quran-page-right' : 'quran-page-left'} quran-page-card`;

    const pageContent = document.createElement("div");
    pageContent.className = "flex-1 flex items-center justify-center quran-page-svg-container overflow-hidden";
    
    // SVG Path (Local)
    const paddedPage = String(pageNum).padStart(3, '0');
    const svgUrl = `assets/optimized/${paddedPage}.svg`;
    
    try {
      if (PAGE_SVG_CACHE.has(pageNum)) {
        pageContent.innerHTML = PAGE_SVG_CACHE.get(pageNum);
      } else {
        const response = await fetch(svgUrl);
        if (!response.ok) throw new Error("SVG not found");
        const svgText = await response.text();
        const processed = preprocessSvg(svgText, pageNum);
        PAGE_SVG_CACHE.set(pageNum, processed);
        pageContent.innerHTML = processed;
      }
    } catch (e) {
      console.error("Failed to load page SVG", e);
      pageContent.innerHTML = `<div class="text-rose-500 font-bold p-10">Stranica ${pageNum} nije pronađena</div>`;
    }

    pageCard.appendChild(pageContent);


    pageCol.appendChild(pageCard);
    return pageCol;
  });

  const columns = await Promise.all(pagePromises);
  columns.forEach((col) => els.spreadView.appendChild(col));

  // Background prefetch adjacent pages
  prefetchAdjacentPages(currentPage);
  // Sync Nav Inputs
  if (els.pageInput) els.pageInput.value = currentPage;
  if (els.juzInput) els.juzInput.value = getJuzNumber(AppState.currentSurah.id, currentAyah.id);
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
