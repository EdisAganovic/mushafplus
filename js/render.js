/**
 * @file render.js
 * @description UI RENDERING ENGINE
 * Handles dynamic content injection for Arabic text, Ayah grid, and persistence state UI feedback.
 */

// --- VIRTUAL SCROLLING CONSTANTS ---
// These values are centralized in GRID
const VIRTUAL_GRID = {
  ITEMS_PER_ROW: window.GRID.ITEMS_PER_ROW,
  ROW_HEIGHT: window.GRID.ROW_HEIGHT,
  BUFFER_ROWS: window.GRID.BUFFER_ROWS,
  CELL_HEIGHT: window.GRID.CELL_HEIGHT,
  GAP_SIZE: window.GRID.GAP_SIZE,
  SCROLL_OFFSET: window.GRID.SCROLL_OFFSET,
  AUTO_SCROLL_DELAY: window.GRID.AUTO_SCROLL_DELAY,
};

/**
 * VirtualGrid Class - Encapsulates virtual scrolling logic for Ayah grids
 * Eliminates code duplication between desktop and mobile grids
 */
class VirtualGrid {
  constructor(container, scrollParent, options = {}) {
    this.container = container;
    this.scrollParent = scrollParent;
    this.options = {
      itemsPerRow: VIRTUAL_GRID.ITEMS_PER_ROW,
      rowHeight: VIRTUAL_GRID.ROW_HEIGHT,
      bufferRows: VIRTUAL_GRID.BUFFER_ROWS,
      ...options
    };
    this.currentSurahId = null;
    this.boundScrollHandler = this._onScroll.bind(this);
    this.isInitialized = false;
  }

  /**
   * Initialize the virtual grid with scroll listener
   */
  init() {
    if (!this.container || !this.scrollParent || this.isInitialized) {
      console.warn('[VirtualGrid.init] Skipping init:', {
        hasContainer: !!this.container,
        hasScrollParent: !!this.scrollParent,
        isInitialized: this.isInitialized
      });
      return;
    }

    // Cleanup any existing nodes before initializing
    this.cleanup();
    
    this.scrollParent.addEventListener("scroll", this.boundScrollHandler, { passive: true });
    this.isInitialized = true;
    
    console.log('[VirtualGrid.init] Initialized, calling render(). Container:', this.container.id, 'Scroll parent height:', this.scrollParent.clientHeight);
    
    // Initial render to populate the grid
    this.render();
  }

  /**
   * Debounce utility for scroll events on slower devices
   */
  _debounceRender() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      requestAnimationFrame(() => this.render());
    }, 200); // 200ms debounce for better performance on slower devices
  }

  /**
   * Destroy the virtual grid (cleanup)
   */
  destroy() {
    if (!this.scrollParent) return;
    this.scrollParent.removeEventListener("scroll", this.boundScrollHandler);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.isInitialized = false;
  }

  /**
   * Cleanup off-screen DOM nodes immediately when switching surahs
   */
  cleanup() {
    // Remove all existing cells from the container
    const existingCells = this.container.querySelectorAll(".ayah-cell");
    existingCells.forEach(cell => cell.remove());
    
    // Clear any pending debounced renders
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
 * Scroll event handler with debouncing for slower devices
 */
  _onScroll() {
    // Always render on scroll - no need for complex performance.now check
    requestAnimationFrame(() => this.render());
  }

  /**
   * Render visible cells based on scroll position
   */
  render() {
    const verses = AppState.currentSurah?.verses;
    const surahId = AppState.currentSurah?.id;

    if (!verses || !surahId) {
      return;
    }

    // Update current surah ID if changed - cleanup off-screen nodes first
    if (this.currentSurahId !== surahId) {
      this.cleanup();
      this.container.dataset.surahId = surahId;
      this.container.innerHTML = "";
      
      // Prevent scroll event from triggering during surah change
      this.scrollParent.removeEventListener("scroll", this.boundScrollHandler);
      if (this.scrollParent) this.scrollParent.scrollTop = 0;
      setTimeout(() => {
        this.scrollParent.addEventListener("scroll", this.boundScrollHandler, { passive: true });
      }, 0);
      
      this.currentSurahId = surahId;
    }

    const totalItems = verses.length;
    const { itemsPerRow, rowHeight, bufferRows } = this.options;
    
    // Calculate total rows first to set container height
    const totalRows = Math.ceil(totalItems / itemsPerRow);
    this.container.style.height = `${totalRows * rowHeight}px`;
    
    // Now get accurate scroll position and parent height after container is sized
    const scrollTop = this.scrollParent.scrollTop;
    const parentHeight = this.scrollParent.clientHeight;

    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferRows);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + parentHeight) / rowHeight) + bufferRows
    );

    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(totalItems, endRow * itemsPerRow);

    // Set paddingTop to offset visible cells
    this.container.style.paddingTop = `${startRow * rowHeight}px`;

    // Create fragment for visible slice
    const frag = document.createDocumentFragment();
    const hasMetadata = typeof window.getJuzStartAt === "function";

    const hifzActive = AppState.hifzEnabled;
    const start = AppState.hifzRange.start;
    const end = AppState.hifzRange.end;
    const hasBoth = hifzActive && start !== null && end !== null;
    const hasOnlyStart = hifzActive && start !== null && end === null;

    const hifzMin = hasBoth ? Math.min(start, end) : (hasOnlyStart ? start : null);
    const hifzMax = hasBoth ? Math.max(start, end) : (hasOnlyStart ? start : null);

    const activeIdx = AppState.currentAyahIndex;

    for (let i = startIndex; i < endIndex; i++) {
      const verse = verses[i];
      const key = `${surahId}-${verse.id}`;
      const isActive = i === activeIdx;
      const isChecked = AppState.checkedAyats.has(key);
      const isHifzRange = hifzMin !== null && i >= hifzMin && i <= hifzMax;
      const hasNotes = !!AppState.notes[key];

      // GPU acceleration hint for animations
      const cell = document.createElement("button");
      
      // GPU acceleration hint for animations
      cell.style.willChange = "transform, opacity";
      cell.dataset.index = i;
      cell.className = "ayah-cell relative h-11 w-full px-1 flex rounded-lg text-xs font-medium transition-all items-center justify-center";

      // Indicators
      let juzStart = hasMetadata ? window.getJuzStartAt(surahId, verse.id) : null;
      let pageStart = hasMetadata ? window.getPageStartAt(surahId, verse.id) : null;
      const dots = [];

      if (isActive) {
        dots.push('<div class="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_4px_rgba(52,211,153,0.5)]"></div>');
      }
      if (isHifzRange && hifzActive) {
        dots.push('<div class="w-1.5 h-1.5 bg-rose-400 rounded-full shadow-[0_0_4px_rgba(251,113,133,0.5)]"></div>');
      }
      if (juzStart !== null) {
        dots.push('<div class="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>');
        cell.title = `Džuz ${juzStart}`;
      }
      if (pageStart !== null) {
        dots.push('<div class="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_4px_rgba(96,165,250,0.5)]"></div>');
        cell.title = (cell.title ? cell.title + " · " : "") + `Str. ${pageStart}`;
      }

      if (dots.length > 0) {
        cell.classList.add("flex-col", "gap-1");
        cell.innerHTML = `<span class="text-[10px] leading-none">${i + 1}</span><div class="flex items-center justify-center gap-1 opacity-90 w-full">${dots.join("")}</div>`;
      } else {
        cell.innerHTML = `<span class="text-xs">${i + 1}</span>`;
      }

      // Styles
      if (isChecked) {
        cell.classList.add("bg-emerald-600", "text-white");
      } else if (isHifzRange) {
        cell.classList.add("hifz-range-active");
      } else {
        cell.classList.add("bg-slate-800", "text-slate-300", "border", "border-slate-700", "hover:bg-slate-600");
      }

      if (isActive) {
        cell.classList.add("active-ayah-cell");
      }

      if (hasNotes) cell.style.borderBottom = "2px solid #f59e0b";
      frag.appendChild(cell);
    }

    this.container.innerHTML = "";
    this.container.appendChild(frag);
  }

  /**
   * Scroll to a specific index
   */
  scrollToIndex(index, options = { behavior: "smooth", block: "center" }) {
    const cell = this.container.querySelector(`[data-index="${index}"]`);
    if (cell) {
      cell.scrollIntoView(options);
      return true;
    }
    return false;
  }

/**
 * Scroll to the top of the grid
 */
  scrollToTop() {
    if (!this.scrollParent) return;
    this.scrollToRow(0, -1);
  }

/**
 * Scroll to a specific row with optional offset
 */
  scrollToRow(rowIndex, offsetRows = 0) {
    if (!this.scrollParent) return;

    const targetScroll = Math.max(0, (rowIndex + offsetRows) * this.options.rowHeight);
    this.scrollParent.scrollTop = targetScroll;
    this.render();
  }

  /**
   * Find cell by index
   */
  getCell(index) {
    return this.container.querySelector(`[data-index="${index}"]`);
  }
}

// Store grid instances globally for access
window.ayahGridDesktop = null;
window.ayahGridMobile = null;

/**
 * Renders the main Ayah display area.
 * - Splits Arabic text into interactive spans for word-highlighting.
 * - Loads translations, notes, and previous recording states.
 * - Synchronizes audio player sources.
 */
// --- TAJWEED TOOLTIPS & LOGIC EXTRACTED TO tajweed_engine.js ---

// Global tracking for word interaction to handle re-renders correctly
let wordPressTimer = null;
let isWordLongPress = false;
let activeWordSpan = null;
let wordPressStartX = 0;
let wordPressStartY = 0;

// Global click listener to hide tooltip when clicking outside
document.addEventListener("click", () => {
  if (typeof hideTajweedTooltip === "function") hideTajweedTooltip();
});

/**
 * Dynamically moves the main action toolbar based on screen size.
 * - Desktop: Placed inside #desktop-toolbar-placeholder (relative/static flow).
 * - Mobile: Placed at bottom of document (viewport fixed).
 */
window.relocateToolbar = function () {
  // Guard clause: ensure els and AppState are defined before accessing their properties
  if (!window.els || !AppState) return;
  if (!els.mainActionToolbar || !els.desktopToolbarPlaceholder) return;

  const isDesktop = window.innerWidth >= 768;
  const isSpread = AppState.settings?.spreadMode;

  // CRITICAL: If spread mode is active, hide the toolbar
  if (isSpread) {
    els.mainActionToolbar.style.display = "none";
    if (typeof updateToolbarVisibility === "function") updateToolbarVisibility();
    return;
  }




  if (isDesktop) {
    // Standard Mode (Desktop): Move inside the card placeholder
    if (!els.desktopToolbarPlaceholder.contains(els.mainActionToolbar)) {
      els.desktopToolbarPlaceholder.appendChild(els.mainActionToolbar);
      els.mainActionToolbar.style.position = "";
      els.mainActionToolbar.style.bottom = "";
      els.mainActionToolbar.style.top = "";
      els.mainActionToolbar.style.left = "";
      els.mainActionToolbar.style.right = "";
      els.mainActionToolbar.style.width = "";
      els.mainActionToolbar.style.transform = "";
      els.mainActionToolbar.style.zIndex = "";
      els.mainActionToolbar.style.minWidth = "";
    }
  } else {
    // Mobile: Move to the bottom of the body (before mobile nav)
    if (!els.mobileBottomNav) return;

    els.mainActionToolbar.style.position = "fixed";
    els.mainActionToolbar.style.bottom = "5.5rem";
    els.mainActionToolbar.style.top = "auto";
    els.mainActionToolbar.style.left = "0.5rem";
    els.mainActionToolbar.style.right = "0.5rem";
    els.mainActionToolbar.style.width = "calc(100% - 1rem)";
    els.mainActionToolbar.style.transform = "";
    els.mainActionToolbar.style.zIndex = "9999";
    els.mainActionToolbar.style.minWidth = "";

    if (els.mobileBottomNav && els.mainActionToolbar.nextElementSibling !== els.mobileBottomNav) {
      document.body.insertBefore(els.mainActionToolbar, els.mobileBottomNav);
    } else if (!els.mobileBottomNav && els.mainActionToolbar.parentElement !== document.body) {
      document.body.appendChild(els.mainActionToolbar);
    }
  }

  // Ensure visibility state is respected after relocation (mobile hidden states)
  if (typeof updateToolbarVisibility === "function") updateToolbarVisibility();
};

// Add resize listener to handle dynamic swaps
window.addEventListener("resize", window.relocateToolbar);

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
  if (!AppState.currentSurah || !AppState.currentSurah.verses) return;

  const ayah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  if (!ayah) return;

  if (typeof window.getJuzNumber === "function" && typeof window.getPageNumber === "function") {
    const juzNum = window.getJuzNumber(AppState.currentSurah.id, ayah.id);
    const pageNum = window.getPageNumber(AppState.currentSurah.id, ayah.id);
    if (els.juzInput) els.juzInput.value = juzNum;
    if (els.pageInput) els.pageInput.value = pageNum;
    if (els.headerPageInput) els.headerPageInput.value = pageNum;
    if (els.surahSelect) els.surahSelect.value = AppState.currentSurah.id;
  }
};

window.renderAyah = function () {
  if (!AppState.currentSurah || !AppState.currentSurah.verses) {
    console.warn("[renderAyah] currentSurah or verses not loaded yet");
    return;
  }

  const ayah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  if (!ayah) {
    console.warn(`[renderAyah] Ayah at index ${AppState.currentAyahIndex} not found`);
    return;
  }

  const key = `${AppState.currentSurah.id}-${ayah.id}`;

  // Keep inputs in sync
  syncNavigationInputs();

  if (els.currentSurahName) {
    let nameText = `${AppState.currentSurah.id}. ${AppState.currentSurah.trans}`;
    if (AppState.hifzEnabled && AppState.hifzRange.start !== null && AppState.hifzRange.end !== null) {
      const min = Math.min(AppState.hifzRange.start, AppState.hifzRange.end) + 1;
      const max = Math.max(AppState.hifzRange.start, AppState.hifzRange.end) + 1;
      nameText += ` <span class="text-[10px] ml-2 px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30 uppercase tracking-tighter">Hifz: ${min}-${max}</span>`;
      els.currentSurahName.innerHTML = nameText;
    } else if (AppState.hifzEnabled && AppState.hifzRange.start !== null) {
        nameText += ` <span class="text-[10px] ml-2 px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30 uppercase tracking-tighter">Hifz: ${AppState.hifzRange.start + 1}...</span>`;
        els.currentSurahName.innerHTML = nameText;
    } else {
      els.currentSurahName.textContent = nameText;
    }
  }

  // Relocate toolbar based on current device constraints
  relocateToolbar();

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

  // 0. Bismillah Visibility Logic (before first ayah, except Surah 1 and 9)
  if (els.bismillahDisplay) {
    if (AppState.currentAyahIndex === 0 && AppState.currentSurah.id !== 1 && AppState.currentSurah.id !== 9) {
      els.bismillahDisplay.classList.remove("hidden");
    } else {
      els.bismillahDisplay.classList.add("hidden");
    }
  }

  // 1. Arabic word-by-word injection with Tajweed support
  els.arabicDisplay.innerHTML = "";
  const activeHighlights = AppState.highlights[key] || [];

  // Parse text using Tajweed tokenizer if available, otherwise fallback to single plain token
  const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
  const useHighlightAPI = isFirefox && window.CSS && CSS.highlights;

  // -- OPTIMIZATION: LRU Cache for Tajweed tokenization (prevents memory bloat) --
  if (!window._tajweedCache) {
    window._tajweedCache = new Map();
  }

  // LRU eviction: Move to end if exists, or evict oldest if at capacity
  const CACHE_LIMIT = TAJWEED.CACHE_SIZE || 500;

  let tokens;
  if (window.Tajweed) {
    if (window._tajweedCache.has(key)) {
      // Cache hit: remove and re-add to move to end (most recently used)
      tokens = window._tajweedCache.get(key);
      window._tajweedCache.delete(key);
      window._tajweedCache.set(key, tokens);
    } else {
      // Cache miss: tokenize and add to cache
      tokens = window.Tajweed.tokenize(ayah.ar);

      // Evict oldest entry if at capacity
      if (window._tajweedCache.size >= CACHE_LIMIT) {
        const oldestKey = window._tajweedCache.keys().next().value;
        window._tajweedCache.delete(oldestKey);
      }

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

  // -- Word Interaction: Click to play, Long Press (3s) to highlight --
  els.arabicDisplay.onpointerdown = (e) => {
    const wordSpan = e.target.closest(".quran-word");
    if (!wordSpan) return;

    // Reset everything
    isWordLongPress = false;
    wordPressStartX = e.clientX;
    wordPressStartY = e.clientY;

    if (activeWordSpan) activeWordSpan.classList.remove("word-pressing");
    activeWordSpan = wordSpan;
    activeWordSpan.classList.add("word-pressing");

    clearTimeout(wordPressTimer);
    wordPressTimer = setTimeout(() => {
      isWordLongPress = true;
      const idx = parseInt(activeWordSpan.dataset.index);
      toggleWordHighlight(key, idx);
      
      // Haptic/Visual feedback
      if (navigator.vibrate) navigator.vibrate(50);
      activeWordSpan.classList.remove("word-pressing");
      activeWordSpan.classList.add("animate-pulse"); // Quick flash on success
      setTimeout(() => {
          if (activeWordSpan) activeWordSpan.classList.remove("animate-pulse");
      }, 500);
    }, 2000);
  };

  els.arabicDisplay.onpointermove = (e) => {
    if (!activeWordSpan || isWordLongPress) return;
    
    // If moved more than 10px, cancel the press
    const dist = Math.hypot(e.clientX - wordPressStartX, e.clientY - wordPressStartY);
    if (dist > 10) {
      clearTimeout(wordPressTimer);
      activeWordSpan.classList.remove("word-pressing");
    }
  };

  els.arabicDisplay.onpointerup = (e) => {
    clearTimeout(wordPressTimer);
    if (activeWordSpan) activeWordSpan.classList.remove("word-pressing");
    
    if (!isWordLongPress) {
      const wordSpan = e.target.closest(".quran-word");
      if (wordSpan) {
        const idx = parseInt(wordSpan.dataset.index);
        playWordAudio(AppState.currentSurah.id, ayah.id, idx);
      }
    }
    // Cleanup reference after a delay to allow callbacks
    setTimeout(() => { activeWordSpan = null; }, 10);
  };

  els.arabicDisplay.onpointerleave = () => {
    clearTimeout(wordPressTimer);
    if (activeWordSpan) activeWordSpan.classList.remove("word-pressing");
    activeWordSpan = null;
  };

  els.arabicDisplay.onpointercancel = () => {
    clearTimeout(wordPressTimer);
    if (activeWordSpan) activeWordSpan.classList.remove("word-pressing");
    activeWordSpan = null;
  };

  // Disable context menu on words to prevent interference with long press
  els.arabicDisplay.oncontextmenu = (e) => {
    if (e.target.closest(".quran-word")) e.preventDefault();
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
  if (els.tajweedLegendContainer && els.tajweedLegend) {
    els.tajweedLegend.innerHTML = "";
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

          els.tajweedLegend.appendChild(chip);
        });
        els.tajweedLegendContainer.classList.remove("hidden");
      } else {
        els.tajweedLegendContainer.classList.add("hidden");
      }
    } else {
      els.tajweedLegendContainer.classList.add("hidden");
    }
  }

  // 3. Sync Recording State
  if (AppState.recordings[key]) {
    const rec = AppState.recordings[key];
    els.userAudioContainer.classList.remove("hidden");
    if (els.audioPlayback.src !== rec.url) {
      els.audioPlayback.pause();
      els.audioPlayback.removeAttribute("src");
      els.audioPlayback.load();
      els.audioPlayback.src = rec.url;
      els.audioPlayback._customDuration = rec.duration || 0;
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
  if (AppState.settings.showAudioPlayer !== false) {
    els.ayahAudioContainer.classList.remove("hidden");
  } else {
    els.ayahAudioContainer.classList.add("hidden");
  }

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
      const currentNote = els.ayahNotes.value;
      // Save note if it has changed
      if (currentNote !== (AppState.notes[key] || "")) {
        saveNote(key, currentNote);
      }
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

  // Scroll to current ayah in grid - only when navigating (not when toggling valid/bookmark)
  if (AppState._shouldScrollGrid !== false) {
    // For virtual grid, find element by data-index
    const cur = els.ayahGrid.querySelector(`[data-index="${AppState.currentAyahIndex}"]`);
    if (cur) {
      setTimeout(() => {
        cur.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    } else {
      // Fallback: If not in DOM (outside virtual buffer), manual scroll parent
      const targetRow = Math.floor(AppState.currentAyahIndex / VIRTUAL_GRID.ITEMS_PER_ROW);
      const targetScroll = (targetRow * VIRTUAL_GRID.ROW_HEIGHT) - 100;
      if (els.ayahGrid.parentElement) {
         els.ayahGrid.parentElement.scrollTop = Math.max(0, targetScroll);
         // The scroll listener will trigger updateVirtualGrid which adds it to DOM
      }
    }
  }
  AppState._prevGridIndex = AppState.currentAyahIndex;
  AppState._shouldScrollGrid = true; // Reset to default

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
    
    // Smooth scroll to top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    AppState.swipeDirection = null;
  }
};

/**
 * Updates a single grid cell's state classes (O(1) update) instead of rebuilding the entire grid.
 */
window.updateGridCellState = function (idx) {
  const cellsToUpdate = [];
  
  // Use data-index to find the correct cell in the virtual grid
  const cellDesktop = els.ayahGrid?.querySelector(`[data-index="${idx}"]`);
  if (cellDesktop) cellsToUpdate.push(cellDesktop);
  
  const cellMobile = els.ayahGridMobile?.querySelector(`[data-index="${idx}"]`);
  if (cellMobile) cellsToUpdate.push(cellMobile);

  if (cellsToUpdate.length === 0) return;

  const surahId = AppState.currentSurah.id;
  const verse = AppState.currentSurah.verses[idx];
  if (!verse) return; // Boundary check to prevent "verse is undefined" error when switching surahs
  const key = `${surahId}-${verse.id}`;

  const activeIdx = parseInt(AppState.currentAyahIndex);
  const isActive = parseInt(idx) === activeIdx;
  const isChecked = AppState.checkedAyats.has(key);
  const hasNotes = !!AppState.notes[key];

  const hifzActive = AppState.hifzEnabled;
  const start = AppState.hifzRange.start;
  const end = AppState.hifzRange.end;
  const hifzMin = hifzActive && start !== null ? (end !== null ? Math.min(start, end) : start) : null;
  const hifzMax = hifzActive && start !== null ? (end !== null ? Math.max(start, end) : start) : null;

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
      "hover:bg-slate-600",
      "text-slate-300",
      "border-slate-700",
      "border-2",
      "hifz-range-active",
      "active-ayah-cell"
    );    // Apply new state classes
    if (isChecked) {
       cell.classList.add("bg-emerald-600", "text-white");
    } else if (isHifzRange) {
       cell.classList.add("hifz-range-active");
    } else {
       cell.classList.add("bg-slate-800", "text-slate-300", "border", "border-slate-700", "hover:bg-slate-600");
    }
 
    // Active state adds border and shadow on top of background
    if (isActive) {
      cell.classList.add("active-ayah-cell");
      // Don't re-add bg-slate-800 here as it will override everything else
    }

    if (hasNotes) {
      cell.style.borderBottom = "2px solid #f59e0b";
    } else {
      cell.style.borderBottom = "";
    }
  });
};

/**
 * Rebuilds the scrollable Ayah grid in the sidebar using a virtual scrolling approach
 * that only renders cells currently in or near the viewport.
 */
window.renderAyahGrid = function (skipScroll = false) {
  if (!AppState.currentSurah || !AppState.currentSurah.id) {
    console.warn("[renderAyahGrid] currentSurah not loaded yet");
    return;
  }

  const surahId = AppState.currentSurah.id;

  // Initialize VirtualGrid instances if not already created
  if (!window.ayahGridDesktop && els.ayahGrid) {
    window.ayahGridDesktop = new VirtualGrid(els.ayahGrid, els.ayahGrid?.parentElement);
    window.ayahGridDesktop.init();
  }
  if (!window.ayahGridMobile && els.ayahGridMobile) {
    window.ayahGridMobile = new VirtualGrid(els.ayahGridMobile, els.ayahGridMobile?.parentElement);
    window.ayahGridMobile.init();
  }

  // Setup Event Delegation for dynamic clicks (once)
  if (!window._gridClickInitialized) {
    const delegateClick = (e) => {
      const btn = e.target.closest("button.ayah-cell");
      if (!btn) return;
      const idx = parseInt(btn.dataset.index);

      // Visual feedback on click
      btn.classList.add("success-pop");
      setTimeout(() => btn.classList.remove("success-pop"), 400);

      if (AppState.hifzEnabled) {
        if (AppState.hifzRange.start === null) {
          AppState.hifzRange.start = idx;
          AppState.hifzRange.end = null;
          if (els.hifzRangeText) els.hifzRangeText.innerText = `Opseg: ${idx + 1} - ...`;
          if (els.hifzRangeTextMobile) els.hifzRangeTextMobile.innerText = `Opseg: ${idx + 1} - ...`;

          // Navigation: Jump to selection
          if (typeof goToAyah === "function") goToAyah(idx + 1);
        } else if (AppState.hifzRange.end === null) {
          AppState.hifzRange.end = idx;
          const min = Math.min(AppState.hifzRange.start, AppState.hifzRange.end);
          const max = Math.max(AppState.hifzRange.start, AppState.hifzRange.end);
          if (els.hifzRangeText) els.hifzRangeText.innerText = `Opseg: ${min + 1} - ${max + 1}`;
          if (els.hifzRangeTextMobile) els.hifzRangeTextMobile.innerText = `Opseg: ${min + 1} - ${max + 1}`;

          // Navigation: Jump to the start of the range
          if (typeof goToAyah === "function") goToAyah(min + 1);
        } else {
          AppState.hifzRange.start = idx;
          AppState.hifzRange.end = null;
          if (els.hifzRangeText) els.hifzRangeText.innerText = `Opseg: ${idx + 1} - ...`;
          if (els.hifzRangeTextMobile) els.hifzRangeTextMobile.innerText = `Opseg: ${idx + 1} - ...`;

          // Navigation: Jump to the starting point
          if (typeof goToAyah === "function") goToAyah(idx + 1);
        }
        localStorage.setItem("quran_hifzRange", JSON.stringify(AppState.hifzRange));
        renderAyahGrid(true); // skips autoscroll to keep user at their current selection point
      } else {
        if (typeof closeHifz === "function") closeHifz();
        if (window.innerWidth < 768 && typeof closeSidebar === "function") closeSidebar();
        goToAyah(idx + 1);
      }
    };

    if (els.ayahGrid) els.ayahGrid.onclick = delegateClick;
    if (els.ayahGridMobile) els.ayahGridMobile.onclick = delegateClick;
    window._gridClickInitialized = true;
  }

  // Force immediate refresh of currently visible grid cells to reflect state changes (Hifz mode, checks, etc.)
  if (window.ayahGridDesktop) window.ayahGridDesktop.render();
  if (window.ayahGridMobile) window.ayahGridMobile.render();

  // Auto-scroll active ayah into view (desktop only to prevent jerking)
  if (skipScroll) return;
  setTimeout(() => {
    const targetRow = Math.floor(AppState.currentAyahIndex / VIRTUAL_GRID.ITEMS_PER_ROW);

    if (window.ayahGridDesktop && window.ayahGridDesktop.scrollParent) {
      // Only scroll on desktop to prevent visual jerking from multiple scroll calls
      window.ayahGridDesktop.scrollToRow(targetRow, -1);
    }

    // After scroll position is set, scroll the cell into view smoothly
    setTimeout(() => {
      let found = false;
      if (window.ayahGridDesktop) {
        const cur = window.ayahGridDesktop.getCell(AppState.currentAyahIndex);
        if (cur) {
          cur.scrollIntoView({ behavior: "smooth", block: "center" });
          found = true;
        }
      } else if (!found) {
        console.warn("[Grid] Desktop grid not found.");
      }
    }, 100);
  });
  AppState._prevGridIndex = AppState.currentAyahIndex;
};

// --- SPREAD VIEW LOGIC EXTRACTED TO spread_engine.js ---

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
