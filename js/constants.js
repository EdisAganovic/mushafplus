/**
 * @file constants.js
 * @description Centralized constants for the Mushaf Plus application
 */

// ==========================================
// APP CONFIGURATION
// ==========================================

window.APP = {
  // Versioning
  VERSION: "0.1.7",
  CACHE_VERSION: "v0.1.7",
  STORAGE_VERSION: 2,

  // Storage Limits
  MAX_NOTES_SIZE_BYTES: 500 * 1024, // 500KB for notes
  MAX_NOTE_LENGTH: 500, // Characters per note
  STORAGE_WARNING_THRESHOLD: 0.85, // Warn at 85% usage

  // Default localStorage quota (varies by browser)
  DEFAULT_STORAGE_QUOTA_BYTES: 5 * 1024 * 1024, // 5MB default assumption

  // Recording System Limits
  MAX_RECORDINGS: 20, // Sliding window size for memory management
  MAX_RECORDINGS_COUNT: 604, // Max ayahs in Quran (one recording per ayah)
  RECORDING_MIME_TYPES: [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ],

  // Maximum recitations to cache (~30MB)
  MAX_RECITATIONS_CACHE: 20,
  MAX_WORDS_CACHE: 300, // ~20MB for word audio

  // Debounce Timings (ms)
  NAVIGATION_DEBOUNCE: 600,
  STORAGE_SAVE_DEBOUNCE: 300,
  RESIZE_DEBOUNCE: 250,
  SEARCH_DEBOUNCE: 300,

  // Toast Notifications
  TOAST_DURATION: 5000,
  TOAST_DELAY: 1000,
  SWIPE_TOAST_DURATION: 3600,

  // Modal & Animation Durations (ms)
  MODAL_ANIMATION_DURATION: 300,
  THEME_PREVIEW_DELAY: 100,

  // Audio Playback
  DEFAULT_PLAYBACK_SPEED: 1,
  AUDIO_PRELOAD_DELAY: 300,
  PLAYBACK_SPEEDS: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

  // Virtual Grid Constants (px)
  GRID_ITEMS_PER_ROW: 5,
  GRID_ROW_HEIGHT: 52,
  GRID_BUFFER_ROWS: 5,
  GRID_CELL_HEIGHT: 44,
  GRID_GAP_SIZE: 8,
  GRID_SCROLL_OFFSET: 20,
  GRID_AUTO_SCROLL_DELAY: 100,

  // Zoom Limits (Spread Mode)
  MIN_ZOOM: 50,
  MAX_ZOOM: 300,
  ZOOM_STEP: 10,
  DEFAULT_ZOOM: 100,

  // Swipe UX Thresholds (px)
  SWIPE_THRESHOLD: 60,
  SWIPE_VERTICAL_TOLERANCE: 80,
  SWIPE_TOAST_OFFSET: 80, // 5rem in px

  // Pull-to-Refresh Thresholds (px)
  PTR_THRESHOLD: 120,
  PTR_MAX_PULL: 180,

  // UI Timing
  SUCCESS_ANIMATION_DELAY: 80,
};

// ==========================================
// GESTURE CONSTANTS
// ==========================================

window.GESTURE = {
  SWIPE_THRESHOLD: 60,
  SWIPE_VERTICAL_TOLERANCE: 80,
  PTR_THRESHOLD: 120,
  PTR_MAX_PULL: 180,
};

// ==========================================
// GRID CONSTANTS
// ==========================================

window.GRID = {
  ITEMS_PER_ROW: 5,
  ROW_HEIGHT: 52,
  BUFFER_ROWS: 4,
  CELL_HEIGHT: 44,
  GAP_SIZE: 8,
  SCROLL_OFFSET: 20,
  AUTO_SCROLL_DELAY: 100,
};

// ==========================================
// QURAN CONSTANTS
// ==========================================

window.QURAN_CONSTANTS = {
  // Quran Structure
  TOTAL_SURAHS: 114,
  TOTAL_JUZS: 30,
  TOTAL_PAGES: 604,
  TOTAL_AYAHS: 6236,

  // Navigation Ranges
  MIN_JUZ: 1,
  MAX_JUZ: 30,
  MIN_PAGE: 1,
  MAX_PAGE: 604,
  MIN_SURAH: 1,
  MAX_SURAH: 114,

  // Surah-specific constants
  MAX_AYAHS_IN_SURAH: 286, // Al-Baqarah
  MIN_AYAHS_IN_SURAH: 3,   // Al-Kawthar, Al-Asr, An-Nasr

  // Special Ayahs
  FIRST_AYAH_INDEX: 1,

  // Page Data Special Cases
  LAST_PAGE: 604,
  LAST_SURAH: 114,
  LAST_AYAH: 6, // An-Nas

  // Surahs without Bismillah
  SURAHS_WITHOUT_BISMILLAH: [9], // At-Tawbah
  SURAHS_STARTING_WITH_BISMILLAH: [1], // Al-Fatiha
};

// ==========================================
// STORAGE KEYS
// ==========================================

window.STORAGE_KEYS = {
  LAST_SURAH: "last_surah",
  LAST_AYAH_INDEX: "last_ayah_index",
  CHECKED_AYATS: "quran_checked",
  BOOKMARKS: "quran_bookmarks",
  NOTES: "quran_notes",
  HIGHLIGHTS: "quran_highlights",
  THEME: "quran_theme",
  TAJWEED: "quran_tajweed",
  TAJWEED_LEGEND: "quran_tajweed_legend",
  LIGHT_MODE: "quran_lightmode",
  SHOW_NOTES: "quran_show_notes",
  SPREAD_MODE: "quran_spread_mode",
  SHOW_AUDIO_PLAYER: "quran_show_audio",
  DISABLE_WORD_AUDIO: "quran_disable_word_audio",
  PAGE_THEME: "quran_page_theme",
  AUTOPLAY: "quran_autoplay",
  SPREAD_ZOOM: "quran_spread_zoom",
  TRANSLATION_BELOW: "quran_translation_below",
  SHOW_ACTIONS_TOOLBAR: "quran_show_actions",
  HIFZ_ENABLED: "quran_hifzEnabled",
  HIFZ_RANGE: "quran_hifzRange",
  CURRENT_RECITER: "quran_reciter",
};

// ==========================================
// TAJWEED CONSTANTS
// ==========================================

window.TAJWEED = {
  CACHE_SIZE: 500,
};
