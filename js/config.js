/**
 * @file config.js
 * @description GLOBAL STATE & DOM MAPPING
 * This file initializes the AppState (persistence and runtime data) and the 'els' object (DOM references).
 */

// ==========================================
// LOCALSTORAGE QUOTA MANAGEMENT
// ==========================================

const STORAGE_CONFIG = {
  DEFAULT_QUOTA_BYTES: APP.DEFAULT_STORAGE_QUOTA_BYTES,
  MAX_NOTES_SIZE_BYTES: APP.MAX_NOTES_SIZE_BYTES,
  MAX_RECORDINGS_COUNT: QURAN_CONSTANTS.TOTAL_PAGES,
  MAX_NOTE_LENGTH: APP.MAX_NOTE_LENGTH,
  STORAGE_WARNING_THRESHOLD: APP.STORAGE_WARNING_THRESHOLD,
};

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
    let quotaBytes = STORAGE_CONFIG.DEFAULT_QUOTA_BYTES;
    return {
      usedBytes,
      quotaBytes,
      availableBytes: quotaBytes - usedBytes,
      usagePercentage: (usedBytes / quotaBytes) * 100,
      isNearLimit: STORAGE_CONFIG.STORAGE_WARNING_THRESHOLD <= (usedBytes / quotaBytes),
      keyCount: keys.length,
    };
  } catch (e) {
    return null;
  }
}

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

function cleanupRecordings(keepCount = STORAGE_CONFIG.MAX_RECORDINGS_COUNT) {
  const recordings = AppState.runtime?.recordings || {};
  if (Object.keys(recordings).length <= keepCount) return { cleaned: 0, freedBytes: 0 };

  const sortedKeys = Object.keys(recordings).sort((a, b) => {
    const timeA = AppState.user?.notes[a]?.updated || 0;
    const timeB = AppState.user?.notes[b]?.updated || 0;
    return timeB - timeA;
  });

  const keysToRemove = sortedKeys.slice(0, sortedKeys.length - keepCount);
  let freedBytes = 0;

  for (const key of keysToRemove) {
    const blobUrl = recordings[key];
    if (blobUrl && typeof URL !== "undefined" && URL.revokeObjectURL) {
      URL.revokeObjectURL(blobUrl);
    }
    delete recordings[key];
    freedBytes += new Blob([localStorage.getItem(key) || ""]).size;
  }

  const recentKeys = sortedKeys.slice(keepCount - 100, keepCount);
  AppState.runtime.recordings = recordings;
  AppState.runtime.recordingKeys = recentKeys;

  return { cleaned: keysToRemove.length, freedBytes, remaining: Object.keys(recordings).length };
}

function safeParseStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === "") return fallback;
    try {
      return JSON.parse(item);
    } catch (e) {
      if (typeof fallback === "string") return item;
      return fallback;
    }
  } catch (e) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  const stats = getStorageStats();
  if (stats && stats.isNearLimit) {
    cleanupRecordings();
  }
  try {
    const serialized = JSON.stringify(value);
    if (key.includes("notes") && serialized.length > STORAGE_CONFIG.MAX_NOTES_SIZE_BYTES) {
      const truncated = JSON.stringify({ ...value, _truncated: true });
      localStorage.setItem(key, truncated);
    } else {
      localStorage.setItem(key, serialized);
    }
    return true;
  } catch (e) {
    return false;
  }
}

function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

function migrateSizeValue(key, fallback) {
  try {
    const v = parseFloat(localStorage.getItem(key) || fallback);
    if (isNaN(v)) return parseFloat(fallback);
    if (v < 10) return Math.round(v * 100);
    if (v > 10 && v < (window.GRID?.ROW_HEIGHT || 52)) return Math.round((v / (window.GRID?.CELL_HEIGHT || 44)) * 100);
    return v;
  } catch (e) {
    return parseFloat(fallback);
  }
}

window.AppState = {
  data: [],
  current: { surah: null, ayahIndex: 0 },
  user: {
    checkedAyats: new Set(safeParseStorage("quran_checked", [])),
    bookmarks: new Set(safeParseStorage("quran_bookmarks", [])),
    notes: safeParseStorage("quran_notes", {}),
    highlights: safeParseStorage("quran_highlights", {}),
  },
  settings: {
    layouts: {},
    arSize: migrateSizeValue("quran_ar_size", "220"),
    bsSize: migrateSizeValue("quran_bs_size", "100"),
    arLineHeight: parseFloat(localStorage.getItem("quran_ar_lh") || "1.6"),
    bsLineHeight: parseFloat(localStorage.getItem("quran_bs_lh") || "1.6"),
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
  runtime: {
    hifzEnabled: safeParseStorage("quran_hifzEnabled", false),
    hifzRange: safeParseStorage("quran_hifzRange", { start: null, end: null }),
    currentReciter: safeParseStorage("quran_reciter", "Muhammad_Ayyoub_128kbps"),
    mediaRecorder: null,
    audioStream: null,
    audioContext: null,
    analyser: null,
    animationId: null,
    audioChunks: [],
    recordings: {},
    recordingKeys: [],
    recordingMimeType: "audio/webm",
  },
};

Object.defineProperties(window.AppState, {
  currentSurah: { get() { return this.current.surah; }, set(val) { this.current.surah = val; } },
  currentAyahIndex: { get() { return this.current.ayahIndex; }, set(val) { this.current.ayahIndex = val; } },
  checkedAyats: { get() { return this.user.checkedAyats; }, set(val) { this.user.checkedAyats = val; } },
  bookmarks: { get() { return this.user.bookmarks; }, set(val) { this.user.bookmarks = val; } },
  notes: { get() { return this.user.notes; }, set(val) { this.user.notes = val; } },
  highlights: { get() { return this.user.highlights; }, set(val) { this.user.highlights = val; } },
  hifzEnabled: { get() { return this.runtime.hifzEnabled; }, set(val) { this.runtime.hifzEnabled = val; } },
  hifzRange: { get() { return this.runtime.hifzRange; }, set(val) { this.runtime.hifzRange = val; } },
  currentReciter: { get() { return this.runtime.currentReciter; }, set(val) { this.runtime.currentReciter = val; } },
  mediaRecorder: { get() { return this.runtime.mediaRecorder; }, set(val) { this.runtime.mediaRecorder = val; } },
  audioStream: { get() { return this.runtime.audioStream; }, set(val) { this.runtime.audioStream = val; } },
  audioContext: { get() { return this.runtime.audioContext; }, set(val) { this.runtime.audioContext = val; } },
  analyser: { get() { return this.runtime.analyser; }, set(val) { this.runtime.analyser = val; } },
  animationId: { get() { return this.runtime.animationId; }, set(val) { this.runtime.animationId = val; } },
  audioChunks: { get() { return this.runtime.audioChunks; }, set(val) { this.runtime.audioChunks = val; } },
  recordings: { get() { return this.runtime.recordings; }, set(val) { this.runtime.recordings = val; } },
  recordingKeys: { get() { return this.runtime.recordingKeys; }, set(val) { this.runtime.recordingKeys = val; } },
  recordingMimeType: { get() { return this.runtime.recordingMimeType; }, set(val) { this.runtime.recordingMimeType = val; } },
});

window.els = {
  surahTrigger: document.getElementById("btn-surah-trigger"),
  surahSelect: document.getElementById("inp-surah"), 
  surahModalFilter: document.getElementById("inp-surah-modal-filter"),
  searchInput: document.getElementById("inp-search"),
  searchResultsContainer: document.getElementById("cnt-search-results"),
  searchResultsList: document.getElementById("lst-search-results"),
  searchEmptyState: document.getElementById("dsp-search-empty"),
  searchInputMobile: document.getElementById("inp-search-mobile"),
  searchResultsContainerMobile: document.getElementById("cnt-search-results-mobile"),
  searchResultsListMobile: document.getElementById("lst-search-results-mobile"),
  searchEmptyStateMobile: document.getElementById("dsp-search-empty-mobile"),
  juzInput: document.getElementById("inp-juz"),
  pageInput: document.getElementById("inp-page"),
  ayahInput: document.getElementById("inp-ayah"),
  headerPageInput: document.getElementById("inp-page-header"),
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
  ayahGrid: document.getElementById("cnt-ayah-grid"),
  ayahGridMobile: document.getElementById("cnt-ayah-grid-mobile"),
  progressPercent: document.getElementById("dsp-progress-percent"),
  progressBarFill: document.getElementById("prg-bar-fill"),
  prevBtn: document.getElementById("btn-prev"),
  nextBtn: document.getElementById("btn-next"),
  recordBtn: document.getElementById("btn-record"),
  recordIcon: document.getElementById("icon-record"),
  recordText: document.getElementById("record-text"),
  validBtn: document.getElementById("btn-valid"),
  bookmarkBtn: document.getElementById("btn-bookmark"),
  bookmarksList: document.getElementById("lst-bookmarks"),
  audioPlayback: document.getElementById("aud-playback"),
  ayahAudioContainer: document.getElementById("cnt-ayah-audio"),
  ayahAudio: document.getElementById("aud-ayah"),
  ayahPlayBtn: document.getElementById("btn-ayah-play"),
  ayahPlayIcon: document.getElementById("icon-ayah-play"),
  ayahPauseIcon: document.getElementById("icon-ayah-pause"),
  ayahAudioProgress: document.getElementById("prg-ayah"),
  ayahAudioTime: document.getElementById("dsp-ayah-audio-time"),
  ayahProgressBg: document.getElementById("prg-ayah-bg"),
  reciterNameLabel: document.getElementById("dsp-reciter-name"),
  userAudioContainer: document.getElementById("cnt-user-audio"),
  userPlayBtn: document.getElementById("btn-user-play"),
  userPlayIcon: document.getElementById("icon-user-play"),
  userPauseIcon: document.getElementById("icon-user-pause"),
  userAudioTime: document.getElementById("dsp-user-audio-time"),
  userAudioProgress: document.getElementById("prg-user"),
  userProgressBg: document.getElementById("prg-user-bg"),
  micMeterContainer: document.getElementById("cnt-mic-meter"),
  micMeterBar: document.getElementById("bar-mic-meter"),
  arSizeSlider: document.getElementById("rng-ar-size"),
  arSizeVal: document.getElementById("dsp-ar-size"),
  bsSizeSlider: document.getElementById("rng-bs-size"),
  bsSizeVal: document.getElementById("dsp-bs-size"),
  arLhSlider: document.getElementById("rng-ar-lh"),
  arLhVal: document.getElementById("dsp-ar-lh"),
  bsLhSlider: document.getElementById("rng-bs-lh"),
  bsLhVal: document.getElementById("dsp-bs-lh"),
  mobileGridToggle: document.getElementById("btn-menu-toggle"),
  sidebar: document.getElementById("dwr-sidebar"),
  sidebarOverlay: document.getElementById("ovl-sidebar"),
  sidebarClose: document.getElementById("btn-close-sidebar"),
  ayahSpeedBtn: document.getElementById("btn-ayah-speed"),
  ayahLoopBtn: document.getElementById("btn-ayah-loop"),
  hifzToggle: document.getElementById("chk-hifz"),
  hifzToggleMobile: document.getElementById("chk-hifz-mobile"),
  hifzRangeText: document.getElementById("dsp-hifz-range"),
  hifzRangeTextMobile: document.getElementById("dsp-hifz-range-mobile"),
  exportBtn: document.getElementById("btn-export"),
  importBtn: document.getElementById("btn-import"),
  importFile: document.getElementById("inp-import-file"),
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
  swipeToast: document.getElementById("toast-swipe"),
  navSurahBtn: document.getElementById("btn-nav-surah"),
  navHifzBtn: document.getElementById("btn-nav-hifz"),
  navSearchBtn: document.getElementById("btn-nav-search"),
  navBookmarksBtn: document.getElementById("btn-nav-bookmarks"),
  navSettingsBtn: document.getElementById("btn-nav-settings"),
  surahModal: document.getElementById("mdl-surah"),
  modalSurahList: document.getElementById("lst-surah-modal"),
  searchModal: document.getElementById("mdl-search"),
  searchInputModal: document.getElementById("inp-search-modal"),
  searchResultsListModal: document.getElementById("lst-search-results-modal"),
  searchEmptyStateModal: document.getElementById("dsp-search-empty-modal"),
  bookmarksDrawer: document.getElementById("dwr-bookmarks"),
  bookmarksOverlay: document.getElementById("ovl-bookmarks"),
  bookmarksClose: document.getElementById("btn-close-bookmarks"),
  bookmarksListMobile: document.getElementById("lst-bookmarks-mobile"),
  hifzDrawer: document.getElementById("dwr-hifz"),
  hifzOverlay: document.getElementById("ovl-hifz"),
  hifzCloseMobile: document.getElementById("btn-close-hifz"),
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
  zoomToolbar: document.getElementById("tlb-zoom"),
  zoomInBtn: document.getElementById("btn-zoom-in"),
  zoomOutBtn: document.getElementById("btn-zoom-out"),
  zoomResetBtn: document.getElementById("btn-zoom-reset"),
  zoomValDisplay: document.getElementById("dsp-zoom-val"),
};
