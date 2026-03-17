/**
 * @file constants.js
 * @description Centralized constants for the Mushaf Plus application
 */

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

  // Storage & Versioning
  STORAGE_VERSION: 1,
  APP_VERSION: "0.1.5",

  // Recording System
  MAX_RECORDINGS: 20, // Sliding window size for memory management
  RECORDING_MIME_TYPES: [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ],

  // Virtual Grid Constants
  GRID_ITEMS_PER_ROW: 5,
  GRID_ROW_HEIGHT: 52, // 44px (h-11) + 8px (gap-2)
  GRID_BUFFER_ROWS: 4,
  GRID_CELL_HEIGHT: 44,
  GRID_GAP_SIZE: 8,
  GRID_SCROLL_OFFSET: 20,
  GRID_AUTO_SCROLL_DELAY: 100,

  // Audio Playback
  PLAYBACK_SPEEDS: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  DEFAULT_PLAYBACK_SPEED: 1,
  AUDIO_PRELOAD_DELAY: 300,

  // Tajweed Cache
  TAJWEED_CACHE_SIZE: 500,

  // Zoom Limits (Spread Mode)
  MIN_ZOOM: 50,
  MAX_ZOOM: 300,
  ZOOM_STEP: 10,
  DEFAULT_ZOOM: 100,

  // UI Timing
  TOAST_DURATION: 5000,
  TOAST_DELAY: 1000,
  MODAL_ANIMATION_DURATION: 300,
  SWIPE_TOAST_DURATION: 3600,
  THEME_PREVIEW_DELAY: 100,

  // Debounce Timings
  NAVIGATION_DEBOUNCE: 600,
  STORAGE_SAVE_DEBOUNCE: 300,
  RESIZE_DEBOUNCE: 250,

  // Swipe UX
  SWIPE_THRESHOLD: 50,
  SWIPE_TOAST_OFFSET: 80, // 5rem in px

  // Accessibility
  FOCUS_TRAP_SELECTOR: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',

  // Surahs without Bismillah
  SURAHS_WITHOUT_BISMILLAH: [9], // At-Tawbah
  SURAHS_STARTING_WITH_BISMILLAH: [1], // Al-Fatiha

  // Special Ayahs
  FIRST_AYAH_INDEX: 1,

  // Page Data Special Cases
  LAST_PAGE: 604,
  LAST_SURAH: 114,
  LAST_AYAH: 6, // An-Nas
};

// Freeze to prevent accidental modification
Object.freeze(window.QURAN_CONSTANTS);
