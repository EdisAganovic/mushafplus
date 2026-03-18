/**
 * @file config.js
 * @description GLOBAL STATE & DOM MAPPING
 * This file initializes the AppState (persistence and runtime data) and the 'els' object (DOM references).
 *
 * LLM CONTEXT:
 * - AppState: Centralized data store with separated concerns:
 *   - current: Navigation state (current surah, ayah index)
 *   - user: User data (checked ayahs, bookmarks, notes, highlights) - persisted
 *   - settings: App preferences - persisted
 *   - runtime: Runtime-only state (audio context, mediaRecorder, etc.) - never persisted
 * - els: Mapping of every interactive HTML element by ID.
 */

// ==========================================
// LOCALSTORAGE QUOTA MANAGEMENT
// ==========================================

/**
 * Storage quota constants
 */
// Storage configuration - centralized constants
const STORAGE_CONFIG = {
  // Default browser quotas (varies by browser)
  DEFAULT_QUOTA_BYTES: APP.DEFAULT_STORAGE_QUOTA_BYTES, // 5MB default assumption
  // App-specific limits to stay safely under quota
  MAX_NOTES_SIZE_BYTES: APP.MAX_NOTES_SIZE_BYTES, // 500KB for notes
  MAX_RECORDINGS_COUNT: QURAN_CONSTANTS.TOTAL_PAGES, // Max ayahs in Quran (one recording per ayah)
  MAX_NOTE_LENGTH: APP.MAX_NOTE_LENGTH, // Characters per note
  STORAGE_WARNING_THRESHOLD: APP.STORAGE_WARNING_THRESHOLD, // Warn at 85% usage
};

/**
 * Gets current localStorage usage statistics
 * @returns {Object} Usage stats with used bytes, total quota, and percentage
 */
function getStorageStats() {
  try {
    const keys = Object.keys(localStorage);
    let usedBytes = 0;

    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        usedBytes += new Blob([value]).size;
      }
    }

    // Try to get actual quota, fallback to default
    let quotaBytes = STORAGE_CONFIG.DEFAULT_QUOTA_BYTES;
    if (typeof storageQuota !== "undefined") {
      quotaBytes = storageQuota;
    }

    return {
      usedBytes,
      quotaBytes,
      availableBytes: quotaBytes - usedBytes,
      usagePercentage: (usedBytes / quotaBytes) * 100,
      isNearLimit: STORAGE_CONFIG.STORAGE_WARNING_THRESHOLD <= (usedBytes / quotaBytes),
      keyCount: keys.length,
    };
  } catch (e) {
    console.warn("[Storage] Could not get storage stats:", e);
    return null;
  }
}

/**
 * Checks if localStorage is near quota limit
 * @returns {Object|null} Warning info or null if safe
 */
function checkStorageQuota() {
  const stats = getStorageStats();
  if (!stats) return null;

  if (stats.isNearLimit) {
    return {
      warning: true,
      usagePercentage: stats.usagePercentage.toFixed(2),
      availableBytes: stats.availableBytes,
      message: `Storage usage at ${stats.usagePercentage}% - approaching limit.`,
    };
  }

  return null;
}

/**
 * Cleans up old recordings to free space (LRU eviction)
 * Keeps only the most recent recording per ayah
 * @param {number} keepCount - Number of recent recordings to keep
 * @returns {Object} Info about cleaned recordings
 */
function cleanupRecordings(keepCount = STORAGE_CONFIG.MAX_RECORDINGS_COUNT) {
  const recordings = AppState.runtime?.recordings || {};
  const recordingKeys = AppState.runtime?.recordingKeys || [];
  
  if (Object.keys(recordings).length <= keepCount) {
    return { cleaned: 0, freedBytes: 0 };
  }

  // Sort keys by last access time (using notes as proxy for recency)
  const sortedKeys = Object.keys(recordings).sort((a, b) => {
    const timeA = AppState.user?.notes[a]?.updated || 0;
    const timeB = AppState.user?.notes[b]?.updated || 0;
    return timeB - timeA;
  });

  // Remove oldest recordings beyond keepCount
  const keysToRemove = sortedKeys.slice(0, sortedKeys.length - keepCount);
  let freedBytes = 0;

  for (const key of keysToRemove) {
    const blobUrl = recordings[key];
    if (blobUrl && typeof URL !== "undefined" && URL.revokeObjectURL) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.warn("[Storage] Failed to revoke recording URL:", e);
      }
    }
    delete recordings[key];
    freedBytes += new Blob([localStorage.getItem(key) || ""]).size;
  }

  // Update recordingKeys array
  const recentKeys = sortedKeys.slice(keepCount - 100, keepCount); // Keep last 100 keys for quick access
  AppState.runtime.recordings = recordings;
  AppState.runtime.recordingKeys = recentKeys;

  return {
    cleaned: keysToRemove.length,
    freedBytes,
    remaining: Object.keys(recordings).length,
  };
}

/**
 * Safe localStorage parsing with error handling
 */
function safeParseStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === "") return fallback;
    try {
      return JSON.parse(item);
    } catch (e) {
      // If parsing fails, and the fallback is a string, assume it's a plain string
      if (typeof fallback === "string") return item;
      return fallback;
    }
  } catch (e) {
    console.error(`[Storage] Failed to parse "${key}":`, e);
    return fallback;
  }
}

/**
 * Safe localStorage set with quota checking and cleanup
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} True if successful, false if storage is full
 */
function safeSetStorage(key, value) {
  // Check quota before writing
  const stats = getStorageStats();
  if (stats && stats.isNearLimit) {
    console.warn("[Storage] Near quota limit, attempting cleanup...");
    cleanupRecordings();
    stats = getStorageStats();
    if (stats && stats.isNearLimit) {
      console.error("[Storage] Storage is full, cannot save data.");
      return false;
    }
  }

  try {
    const serialized = JSON.stringify(value);
    
    // Check note size limit
    if (key.includes("notes") && serialized.length > STORAGE_CONFIG.MAX_NOTES_SIZE_BYTES) {
      console.warn(`[Storage] Note too large (${serialized.length} bytes), truncating...`);
      // Truncate the value
      const truncated = JSON.stringify({
        ...value,
        _truncated: true,
        _originalLength: serialized.length
      });
      localStorage.setItem(key, truncated);
    } else {
      localStorage.setItem(key, serialized);
    }
    
    return true;
  } catch (e) {
    console.error(`[Storage] Failed to set "${key}":`, e);
    return false;
  }
}

/**
 * Safe localStorage remove with error handling
 */
function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`[Storage] Failed to remove "${key}":`, e);
    return false;
  }
}

// Helper: Safe localStorage size migration with error handling
function migrateSizeValue(key, fallback) {
  try {
    const v = parseFloat(localStorage.getItem(key) || fallback);
    if (isNaN(v)) return parseFloat(fallback);
    if (v < 10) return Math.round(v * 100); // was rem
    if (v > 10 && v < GRID.ROW_HEIGHT) return Math.round((v / GRID.CELL_HEIGHT) * 100); // was px
    return v; // already %
  } catch (e) {
    console.error(`[Storage] Failed to migrate "${key}":`, e);
    return parseFloat(fallback);
  }
}

window.AppState = {
  // ==========================================
  // NAVIGATION STATE (Current position)
  // ==========================================
  data: [], // Full Quran data (Arabic + Translation)
  current: {
    surah: null, // Currently selected Surah object
    ayahIndex: 0, // 0-based index of current Ayah within surah.verses
  },

  // ==========================================
  // USER DATA (Persisted)
  // ==========================================
  user: {
    checkedAyats: new Set(
      safeParseStorage("quran_checked", [])
    ),
    bookmarks: new Set(
      safeParseStorage("quran_bookmarks", [])
    ),
    notes: safeParseStorage("quran_notes", {}),
    highlights: safeParseStorage("quran_highlights", {}),
  },

  // ==========================================
  // SETTINGS (Persisted preferences)
  // ==========================================
  settings: {
    layouts: {}, // Cache for page-by-page word positions
    arSize: migrateSizeValue("quran_ar_size", "220"),
    bsSize: migrateSizeValue("quran_bs_size", "100"),
    arLineHeight: parseFloat(localStorage.getItem("quran_ar_lh") || "1.6"),
    tajweed: localStorage.getItem("quran_tajweed") !== "false",
    tajweedLegend: localStorage.getItem("quran_tajweed_legend") !== "false",
    lightMode: localStorage.getItem("quran_lightmode") === "true",
    showNotes: localStorage.getItem("quran_show_notes") !== "false",
    spreadMode: localStorage.getItem("quran_spread_mode") === "true",
    showAudioPlayer: localStorage.getItem("quran_show_audio") !== "false",
    disableWordAudio: localStorage.getItem("quran_disable_word_audio") === "true",
    pageTheme: localStorage.getItem("quran_page_theme") || "original",
    autoplay: localStorage.getItem("quran_autoplay") !== "false",
    spreadZoom: parseFloat(localStorage.getItem("quran_spread_zoom") || "100"),
    translationBelow: localStorage.getItem("quran_translation_below") === "true",
    showActionsToolbar: localStorage.getItem("quran_show_actions") !== "false",
  },

  // ==========================================
  // RUNTIME STATE (Never persisted)
  // ==========================================
  runtime: {
    // Hifz & Recitation
    hifzEnabled: safeParseStorage("quran_hifzEnabled", false),
    hifzRange: safeParseStorage("quran_hifzRange", { start: null, end: null }),
    currentReciter: safeParseStorage("quran_reciter", "Muhammad_Ayyoub_128kbps"),

    // Audio Recording
    mediaRecorder: null, // Active MediaRecorder instance
    audioStream: null, // Persistent microphone stream (to avoid repeated prompts)
    audioContext: null, // Web Audio API context for mic-level analysis
    analyser: null, // AnalyserNode for volume detection
    animationId: null, // RequestAnimationFrame ID for UI sync
    audioChunks: [], // Temporary buffer for recording data
    recordings: {}, // Map of ayah keys to blob URLs
    recordingKeys: [], // Order of recordings to manage memory (LRU)
    recordingMimeType: "audio/webm", // Selected mime type for current device
  },
};

// Legacy aliases for backwards compatibility (to be deprecated)
Object.defineProperties(window.AppState, {
  currentSurah: {
    get() { return this.current.surah; },
    set(val) { this.current.surah = val; }
  },
  currentAyahIndex: {
    get() { return this.current.ayahIndex; },
    set(val) { this.current.ayahIndex = val; }
  },
  checkedAyats: {
    get() { return this.user.checkedAyats; },
    set(val) { this.user.checkedAyats = val; }
  },
  bookmarks: {
    get() { return this.user.bookmarks; },
    set(val) { this.user.bookmarks = val; }
  },
  notes: {
    get() { return this.user.notes; },
    set(val) { this.user.notes = val; }
  },
  highlights: {
    get() { return this.user.highlights; },
    set(val) { this.user.highlights = val; }
  },
  mediaRecorder: {
    get() { return this.runtime.mediaRecorder; },
    set(val) { this.runtime.mediaRecorder = val; }
  },
  audioStream: {
    get() { return this.runtime.audioStream; },
    set(val) { this.runtime.audioStream = val; }
  },
  audioContext: {
    get() { return this.runtime.audioContext; },
    set(val) { this.runtime.audioContext = val; }
  },
  analyser: {
    get() { return this.runtime.analyser; },
    set(val) { this.runtime.analyser = val; }
  },
  animationId: {
    get() { return this.runtime.animationId; },
    set(val) { this.runtime.animationId = val; }
  },
  audioChunks: {
    get() { return this.runtime.audioChunks; },
    set(val) { this.runtime.audioChunks = val; }
  },
  recordings: {
    get() { return this.runtime.recordings; },
    set(val) { this.runtime.recordings = val; }
  },
  recordingKeys: {
    get() { return this.runtime.recordingKeys; },
    set(val) { this.runtime.recordingKeys = val; }
  },
  recordingMimeType: {
    get() { return this.runtime.recordingMimeType; },
    set(val) { this.runtime.recordingMimeType = val; }
  },
  hifzEnabled: {
    get() { return this.runtime.hifzEnabled; },
    set(val) { this.runtime.hifzEnabled = val; }
  },
  hifzRange: {
    get() { return this.runtime.hifzRange; },
    set(val) { this.runtime.hifzRange = val; }
  },
  currentReciter: {
    get() { return this.runtime.currentReciter; },
    set(val) { this.runtime.currentReciter = val; }
  },
});

window.els = {
  // Navigation & Header
  surahTrigger: document.getElementById("btn-surah-trigger"),
  surahSelect: document.getElementById("inp-surah"), 
  surahModalFilter: document.getElementById("inp-surah-modal-filter"),
  searchInput: document.getElementById("inp-search"),
  searchResultsContainer: document.getElementById("cnt-search-results"),
  searchResultsList: document.getElementById("lst-search-results"),
  searchEmptyState: document.getElementById("dsp-search-empty"),
  searchInputMobile: document.getElementById("inp-search-mobile"),
  searchResultsContainerMobile: document.getElementById(
    "cnt-search-results-mobile",
  ),
  searchResultsListMobile: document.getElementById(
    "lst-search-results-mobile",
  ),
  searchEmptyStateMobile: document.getElementById("dsp-search-empty-mobile"),
  juzInput: document.getElementById("inp-juz"),
  pageInput: document.getElementById("inp-page"),
  ayahInput: document.getElementById("inp-ayah"),
  headerPageInput: document.getElementById("inp-page-header"),

  // Main Display
  currentSurahName: document.getElementById("dsp-surah-name"),
  bismillahDisplay: document.getElementById("dsp-bismillah"),
  arabicDisplay: document.getElementById("dsp-arabic"),
  translationDisplay: document.getElementById("dsp-translation"),
  totalAyahsNum: document.getElementById("dsp-total-ayahs"),
  ayahNotes: document.getElementById("inp-notes"),
  ayahNotesContainer: document.getElementById("cnt-notes"),
  pageProgressContainer: document.getElementById("cnt-page-progress"),
  pageProgress: document.getElementById("dsp-page-progress"),
  mainContent: document.getElementById("cnt-main-content"),
  appContainer: document.getElementById("cnt-app"),
  ayahCard: document.getElementById("crd-ayah"),
  spreadCard: document.getElementById("crd-spread"),
  spreadView: document.getElementById("cnt-spread-view"),
  spreadToggle: document.getElementById("btn-spread-toggle"),
  spreadLightToggle: document.getElementById("btn-spread-lightmode-toggle"),

  // Sidebar controls
  ayahGrid: document.getElementById("cnt-ayah-grid"),
  ayahGridMobile: document.getElementById("cnt-ayah-grid-mobile"),
  progressPercent: document.getElementById("dsp-progress-percent"),
  progressBarFill: document.getElementById("prg-bar-fill"),

  // Core Nav Buttons
  prevBtn: document.getElementById("btn-prev"),
  nextBtn: document.getElementById("btn-next"),

  // Practice Action Buttons
  recordBtn: document.getElementById("btn-record"),
  recordIcon: document.getElementById("icon-record"),
  recordText: document.getElementById("record-text"),
  validBtn: document.getElementById("btn-valid"),
  bookmarkBtn: document.getElementById("btn-bookmark"),
  bookmarksList: document.getElementById("lst-bookmarks"),

  // Audio Playback
  audioPlayback: document.getElementById("aud-playback"), // Hidden user recording player

  // Custom Audio UI Elements (Recitation)
  ayahAudioContainer: document.getElementById("cnt-ayah-audio"),
  ayahAudio: document.getElementById("aud-ayah"),
  ayahPlayBtn: document.getElementById("btn-ayah-play"),
  ayahPlayIcon: document.getElementById("icon-ayah-play"),
  ayahPauseIcon: document.getElementById("icon-ayah-pause"),
  ayahAudioProgress: document.getElementById("prg-ayah"),
  ayahAudioTime: document.getElementById("dsp-ayah-audio-time"),
  ayahProgressBg: document.getElementById("prg-ayah-bg"),
  reciterNameLabel: document.getElementById("dsp-reciter-name"),

  // Custom Audio UI Elements (User Practice)
  userAudioContainer: document.getElementById("cnt-user-audio"),
  userPlayBtn: document.getElementById("btn-user-play"),
  userPlayIcon: document.getElementById("icon-user-play"),
  userPauseIcon: document.getElementById("icon-user-pause"),
  userAudioTime: document.getElementById("dsp-user-audio-time"),
  userAudioProgress: document.getElementById("prg-user"),
  userProgressBg: document.getElementById("prg-user-bg"),

  // Mic Meter UI
  micMeterContainer: document.getElementById("cnt-mic-meter"),
  micMeterBar: document.getElementById("bar-mic-meter"),

  // Typography sliders
  arSizeSlider: document.getElementById("rng-ar-size"),
  arSizeVal: document.getElementById("dsp-ar-size"),
  bsSizeSlider: document.getElementById("rng-bs-size"),
  bsSizeVal: document.getElementById("dsp-bs-size"),
  arLhSlider: document.getElementById("rng-ar-lh"),
  arLhVal: document.getElementById("dsp-ar-lh"),

  // Mobile Menu & Audio Controls
  mobileGridToggle: document.getElementById("btn-menu-toggle"),
  sidebar: document.getElementById("dwr-sidebar"),
  sidebarOverlay: document.getElementById("ovl-sidebar"),
  sidebarClose: document.getElementById("btn-close-sidebar"),
  ayahSpeedBtn: document.getElementById("btn-ayah-speed"),
  ayahLoopBtn: document.getElementById("btn-ayah-loop"),
  // App State & Data transfer
  hifzToggle: document.getElementById("chk-hifz"),
  hifzToggleMobile: document.getElementById("chk-hifz-mobile"),
  hifzRangeText: document.getElementById("dsp-hifz-range"),
  hifzRangeTextMobile: document.getElementById("dsp-hifz-range-mobile"),

  // Data Transfer
  exportBtn: document.getElementById("btn-export"),
  importBtn: document.getElementById("btn-import"),
  importFile: document.getElementById("inp-import-file"),

  // Settings Drawer and Preferences
  settingsToggle: document.getElementById("btn-settings-toggle"),
  settingsDrawer: document.getElementById("dwr-settings"),
  settingsOverlay: document.getElementById("ovl-settings"),
  settingsClose: document.getElementById("btn-close-settings"),
  themeSelect: document.getElementById("inp-theme"),
  themeDots: document.querySelectorAll(".btn-theme-dot"),
  reciterSelect: document.getElementById("inp-reciter"),
  autoplayToggle: document.getElementById("chk-autoplay"),
  tajweedToggle: document.getElementById("chk-tajweed"),
  tajweedLegendToggle: document.getElementById("chk-tajweed-legend"),
  lightmodeToggle: document.getElementById("chk-lightmode"),
  notesToggle: document.getElementById("chk-notes"),
  audioToggle: document.getElementById("chk-audio"),
  wordAudioToggle: document.getElementById("chk-word-audio"),
  translationPositionToggle: document.getElementById("chk-translation-below"),
  actionsToolbarToggle: document.getElementById("chk-actions-toolbar"),

  // Swipe UX Elements
  swipeToast: document.getElementById("toast-swipe"),

  // Mobile Nav & Surah Modal
  navSurahBtn: document.getElementById("btn-nav-surah"),
  navHifzBtn: document.getElementById("btn-nav-hifz"),
  navSearchBtn: document.getElementById("btn-nav-search"),
  navBookmarksBtn: document.getElementById("btn-nav-bookmarks"),
  navSettingsBtn: document.getElementById("btn-nav-settings"),
  surahModal: document.getElementById("mdl-surah"),
  modalSurahList: document.getElementById("lst-surah-modal"),

  // Search Modal (Mobile)
  searchModal: document.getElementById("mdl-search"),
  searchInputModal: document.getElementById("inp-search-modal"),
  searchResultsListModal: document.getElementById("lst-search-results-modal"),
  searchEmptyStateModal: document.getElementById("dsp-search-empty-modal"),

  // Bookmarks Drawer (Mobile)
  bookmarksDrawer: document.getElementById("dwr-bookmarks"),
  bookmarksOverlay: document.getElementById("ovl-bookmarks"),
  bookmarksClose: document.getElementById("btn-close-bookmarks"),
  bookmarksListMobile: document.getElementById("lst-bookmarks-mobile"),

  // Hifz Drawer (Mobile)
  hifzDrawer: document.getElementById("dwr-hifz"),
  hifzOverlay: document.getElementById("ovl-hifz"),
  hifzCloseMobile: document.getElementById("btn-close-hifz"),

  // Missing elements from original code
  aboutBtn: document.getElementById("btn-about"),
  versionBtn: document.getElementById("btn-version"),
  versionModal: document.getElementById("mdl-version"),
  aboutModal: document.getElementById("mdl-about"),
  appTitle: document.getElementById("dsp-app-title"),
  tajweedLegendContainer: document.getElementById("cnt-tajweed-legend"),
  tajweedLegend: document.getElementById("dsp-tajweed-legend"),
  mainActionToolbar: document.getElementById("tlb-actions"),
  desktopToolbarPlaceholder: document.getElementById("cnt-toolbar-placeholder"),
  mobileBottomNav: document.getElementById("nav-bottom"),
  settingsPreviewAr: document.getElementById("prv-arabic"),
  settingsPreviewBs: document.getElementById("prv-translation"),
  pageThemeToggleContainer: document.getElementById("cnt-page-theme-toggle"),
  themePreview: document.getElementById("cnt-theme-preview"),
  themePaletteList: document.getElementById("lst-theme-palette"),
  previewThemeName: document.getElementById("dsp-preview-theme-name"),
  
  // Zoom Control
  zoomToolbar: document.getElementById("tlb-zoom"),
  zoomInBtn: document.getElementById("btn-zoom-in"),
  zoomOutBtn: document.getElementById("btn-zoom-out"),
  zoomResetBtn: document.getElementById("btn-zoom-reset"),
  zoomValDisplay: document.getElementById("dsp-zoom-val"),
};

