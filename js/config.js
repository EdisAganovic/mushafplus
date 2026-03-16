/**
 * @file config.js
 * @description GLOBAL STATE & DOM MAPPING
 * This file initializes the AppState (persistence and runtime data) and the 'els' object (DOM references).
 *
 * LLM CONTEXT:
 * - AppState: Centralized data store. Loaded from localStorage on init.
 * - els: Mapping of every interactive HTML element by ID.
 */

// Helper: Safe localStorage parsing with error handling
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

// Helper: Safe localStorage size migration with error handling
function migrateSizeValue(key, fallback) {
  try {
    const v = parseFloat(localStorage.getItem(key) || fallback);
    if (isNaN(v)) return parseFloat(fallback);
    if (v < 10) return Math.round(v * 100); // was rem
    if (v > 10 && v < 80) return Math.round((v / 16) * 100); // was px
    return v; // already %
  } catch (e) {
    console.error(`[Storage] Failed to migrate "${key}":`, e);
    return parseFloat(fallback);
  }
}

window.AppState = {
  data: [], // Full Quran data (Arabic + Translation)
  currentSurah: null, // Currently selected Surah object
  currentAyahIndex: 0, // 0-based index of current Ayah within surah.verses
  mediaRecorder: null, // Active MediaRecorder instance
  audioStream: null, // Persistent microphone stream (to avoid repeated prompts)
  audioContext: null, // Web Audio API context for mic-level analysis
  analyser: null, // AnalyserNode for volume detection
  animationId: null, // RequestAnimationFrame ID for UI sync
  audioChunks: [], // Temporary buffer for recording data
  recordings: {}, // Map of ayah keys to blob URLs
  recordingKeys: [], // Order of recordings to manage memory (LRU)
  recordingMimeType: "audio/webm", // Selected mime type for current device

  // NEW RUNTIME STATE
  hifzEnabled: safeParseStorage("quran_hifzEnabled", false),
  hifzRange: safeParseStorage("quran_hifzRange", { start: null, end: null }),
  currentReciter:
    safeParseStorage("quran_reciter", "Muhammad_Ayyoub_128kbps"),

  // PERSISTENT DATA (Loaded from localStorage with error handling)
  checkedAyats: new Set(
    safeParseStorage("quran_checked", [])
  ),
  bookmarks: new Set(
    safeParseStorage("quran_bookmarks", [])
  ),
  notes: safeParseStorage("quran_notes", {}),
  highlights: safeParseStorage("quran_highlights", {}),
  settings: (() => {
    return {
      layouts: {}, // Cache for page-by-page word positions
      arSize: migrateSizeValue("quran_ar_size", "200"),
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
    };
  })(),
};

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

  // Swipe UX Elements
  swipeToast: document.getElementById("toast-swipe"),

  // Mobile Nav & Surah Modal
  navSurahBtn: document.getElementById("btn-nav-surah"),
  navHifzBtn: document.getElementById("btn-nav-hifz"),
  navSearchBtn: document.getElementById("btn-nav-search"),
  navBookmarksBtn: document.getElementById("btn-nav-bookmarks"),
  navSettingsBtn: document.getElementById("btn-nav-settings"),
  surahHifzModal: document.getElementById("mdl-surah"),
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
};
