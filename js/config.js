/**
 * @file config.js
 * @description GLOBAL STATE & DOM MAPPING
 * This file initializes the AppState (persistence and runtime data) and the 'els' object (DOM references).
 *
 * LLM CONTEXT:
 * - AppState: Centralized data store. Loaded from localStorage on init.
 * - els: Mapping of every interactive HTML element by ID.
 */

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

  // NEW RUNTIME STATE
  hifzEnabled: false,
  hifzRange: { start: null, end: null },
  currentReciter: localStorage.getItem("quran_reciter") || "Alafasy_128kbps",

  // PERSISTENT DATA (Loaded from localStorage)
  checkedAyats: new Set(
    JSON.parse(localStorage.getItem("quran_checked") || "[]"),
  ),
  bookmarks: new Set(
    JSON.parse(localStorage.getItem("quran_bookmarks") || "[]"),
  ),
  notes: JSON.parse(localStorage.getItem("quran_notes") || "{}"),
  highlights: JSON.parse(localStorage.getItem("quran_highlights") || "{}"),
  settings: (() => {
    // Helper: migrate old px/rem values to percentage (run once per load)
    const migrateSize = (key, fallback) => {
      const v = parseFloat(localStorage.getItem(key) || fallback);
      if (v < 10) return Math.round(v * 100); // was rem
      if (v > 10 && v < 80) return Math.round((v / 16) * 100); // was px
      return v; // already %
    };
    return {
      arSize: migrateSize("quran_ar_size", "140"),
      bsSize: migrateSize("quran_bs_size", "100"),
      arLineHeight: parseFloat(localStorage.getItem("quran_ar_lh") || "1.6"),
      tajweed: localStorage.getItem("quran_tajweed") !== "false",
      tajweedLegend: localStorage.getItem("quran_tajweed_legend") !== "false",
      lightMode: localStorage.getItem("quran_lightmode") === "true",
    };
  })(),
};

window.els = {
  // Navigation & Header
  surahSelect: document.getElementById("surah-select"),
  searchInput: document.getElementById("search-input"),
  searchResultsContainer: document.getElementById("search-results-container"),
  searchResultsList: document.getElementById("search-results-list"),
  searchEmptyState: document.getElementById("search-empty-state"),
  searchInputMobile: document.getElementById("search-input-mobile"),
  searchResultsContainerMobile: document.getElementById(
    "search-results-container-mobile",
  ),
  searchResultsListMobile: document.getElementById(
    "search-results-list-mobile",
  ),
  searchEmptyStateMobile: document.getElementById("search-empty-state-mobile"),
  syncStatus: document.getElementById("sync-status"),
  juzInput: document.getElementById("juz-input"),
  pageInput: document.getElementById("page-input"),
  ayahInput: document.getElementById("ayah-input"),

  // Main Display
  arabicDisplay: document.getElementById("arabic-display"),
  translationDisplay: document.getElementById("translation-display"),
  totalAyahsNum: document.getElementById("total-ayahs-num"),
  ayahNotes: document.getElementById("ayah-notes"),

  // Sidebar controls
  ayahGrid: document.getElementById("ayah-grid"),
  progressPercent: document.getElementById("progress-percent"),
  progressBarFill: document.getElementById("progress-bar-fill"),

  // Core Nav Buttons
  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),

  // Practice Action Buttons
  recordBtn: document.getElementById("record-btn"),
  recordText: document.getElementById("record-text"),
  validBtn: document.getElementById("valid-btn"),
  bookmarkBtn: document.getElementById("bookmark-btn"),
  bookmarksList: document.getElementById("bookmarks-list"),

  // Audio Playback
  audioPlayback: document.getElementById("audio-playback"), // Hidden user recording player

  // Custom Audio UI Elements (Recitation)
  ayahAudioContainer: document.getElementById("ayah-audio-container"),
  ayahAudio: document.getElementById("ayah-audio"),
  ayahPlayBtn: document.getElementById("ayah-play-btn"),
  ayahPlayIcon: document.getElementById("ayah-play-icon"),
  ayahPauseIcon: document.getElementById("ayah-pause-icon"),
  ayahAudioProgress: document.getElementById("ayah-audio-progress"),
  ayahAudioTime: document.getElementById("ayah-audio-time"),
  ayahProgressBg: document.getElementById("ayah-progress-bg"),
  reciterNameLabel: document.getElementById("reciter-name-label"),

  // Custom Audio UI Elements (User Practice)
  userAudioContainer: document.getElementById("user-audio-container"),
  userPlayBtn: document.getElementById("user-play-btn"),
  userPlayIcon: document.getElementById("user-play-icon"),
  userPauseIcon: document.getElementById("user-pause-icon"),
  userAudioTime: document.getElementById("user-audio-time"),
  userAudioProgress: document.getElementById("user-audio-progress"),
  userProgressBg: document.getElementById("user-progress-bg"),

  // Mic Meter UI
  micMeterContainer: document.getElementById("mic-meter-container"),
  micMeterBar: document.getElementById("mic-meter-bar"),

  // Typography sliders
  arSizeSlider: document.getElementById("ar-size-slider"),
  arSizeVal: document.getElementById("ar-size-val"),
  bsSizeSlider: document.getElementById("bs-size-slider"),
  bsSizeVal: document.getElementById("bs-size-val"),
  arLhSlider: document.getElementById("ar-lh-slider"),
  arLhVal: document.getElementById("ar-lh-val"),

  // Mobile Menu & Audio Controls
  mobileGridToggle: document.getElementById("mobile-grid-toggle"),
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebar-overlay"),
  sidebarClose: document.getElementById("sidebar-close"),
  ayahSpeedBtn: document.getElementById("ayah-speed-btn"),
  ayahLoopBtn: document.getElementById("ayah-loop-btn"),
  hifzToggle: document.getElementById("hifz-toggle"),
  hifzRangeText: document.getElementById("hifz-range-text"),

  // Data Transfer
  exportBtn: document.getElementById("export-btn"),
  importBtn: document.getElementById("import-btn"),
  importFile: document.getElementById("import-file"),

  // Settings Drawer and Preferences
  settingsToggle: document.getElementById("settings-toggle"),
  settingsDrawer: document.getElementById("settings-drawer"),
  settingsOverlay: document.getElementById("settings-overlay"),
  settingsClose: document.getElementById("settings-close"),
  themeSelect: document.getElementById("theme-select"),
  reciterSelect: document.getElementById("reciter-select"),
  autoplayToggle: document.getElementById("autoplay-toggle"),
  tajweedToggle: document.getElementById("tajweed-toggle"),
  tajweedLegendToggle: document.getElementById("tajweed-legend-toggle"),
  lightmodeToggle: document.getElementById("lightmode-toggle"),

  // Swipe UX Elements
  swipeToast: document.getElementById("swipe-toast"),
};
