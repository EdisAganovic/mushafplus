/**
 * @file i18n.js
 * @description Bosnian translations for the Quran Recitation app UI.
 */
window.T = {
  // Header
  appTitle: "Mushaf Plus",
  searchPlaceholder: "Pretraži tekst ili ajet (2:255)...",
  selectSurah: "Izaberi suru...",
  noResults: "Nema rezultata",

  // Ayah Card
  quickJump: "Brzi skok: Klikni na broj",
  ayahLabel: "Ajet",
  juzLabel: "Džuz",
  pageLabel: "Str.",
  record: "Snimi",
  recordAgain: "Snimi ponovo",
  stop: "Stop",
  valid: "Tačno",
  bookmark: "Zapamti",

  // Audio Players
  recitation: "Recitacija",
  yourRecording: "Tvoj snimak",
  playbackSpeed: "Brzina",
  loopAyah: "Ponavljaj ajet",

  // Notes
  notesTitle: "Lične bilješke (Automatski se snimaju)",
  notesPlaceholder:
    "Dodaj podsjetnik (npr. 'Obrati pažnju na tedžvid kod riječi X')...",

  // Navigation
  previous: "Prethodni",
  next: "Sljedeći",

  // Sidebar
  menu: "Meni",
  surahProgress: "Proučeno ajeta",
  ayahGrid: "Ajeti",
  bookmarks: "Zapamćeno",
  noBookmarks: "Još nema oznaka",
  keyboardShortcuts: "Kratice na tastaturi",
  navAyahs: "Navigacija",
  recordStop: "Snimi / Stop",
  markValid: "Označi tačno",
  playRecitation: "Pusti recitaciju",
  playRecording: "Pusti snimak",
  systemStatus: "Status sistema",

  // Settings Drawer
  preferences: "Postavke",
  arabicFontSize: "Veličina arapskog fonta",
  translationFontSize: "Veličina prijevoda",
  arabicLineHeight: "Razmak redova (arapski)",
  appTheme: "Tema aplikacije",
  themeEmerald: "Smaragdna (Podrazumijevano)",
  themeBlue: "Kraljevski plava",
  themeAmber: "Zlato",
  themeRose: "Ruža",
  themePurple: "Ljubičasta",
  themeTeal: "Tirkizna",
  lightMode: "Svijetli mod",
  lightModeDesc: "Čistiji prikaz za čitanje",
  autoPlayNext: "Automatski sljedeći",
  autoPlayDesc: "Nastavi kad audio završi",
  tajweedFormatting: "Tedžvidska pravila",
  tajweedDesc: "Pravila učenja u bojama",
  tajweedLegend: "Nazivi tedžvidskih pravila",
  tajweedLegendDesc: "Prikaži legendu ispod ajeta",
  showNotes: "Lične bilješke",
  showNotesDesc: "Prikaži polje za podsjetnike",

  // Data Transfer
  dataTransfer: "Backup",
  export: "Izvezi",
  import: "Uvezi",

  // Status
  loading: "Učitavanje...",
  ready: "Spreman",
  error: "Greška",

  // Alerts
  micError: "Mikrofon nije dostupan ili pristup odbijen.",
};

/**
 * Applies all translations from the T object to the DOM.
 * Scans for [data-i18n] and [data-i18n-placeholder] attributes.
 * Call this on page load to sync i18n.js with the UI.
 */
window.applyTranslations = function () {
  // Text content
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (T[key] !== undefined) el.textContent = T[key];
  });
  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (T[key] !== undefined) el.placeholder = T[key];
  });
  // Titles (Tooltips)
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (T[key] !== undefined) el.title = T[key];
  });
  // Title & page title
  const titleEl = document.getElementById("app-title");
  if (titleEl) titleEl.textContent = T.appTitle;
  document.title = T.appTitle;
};
