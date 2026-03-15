# Mushaf Plus - Developer Quick Reference

## 📁 Folder Structure

```
preslusavanje/
├── index.html              # Main UI (header, ayah card, sidebar, modals)
├── manifest.json           # PWA config
├── service-worker.js       # Offline caching
│
├── css/
│   ├── input.css           # Tailwind source
│   ├── styles.css          # Custom CSS (themes, animations)
│   └── tailwind-output.css # Production build
│
├── js/
│   ├── config.js           # ⭐ AppState + DOM refs (load FIRST)
│   ├── app.js              # ⭐ Entry point, orchestrator
│   ├── i18n.js             # Bosnian translations
│   ├── quranMeta.js        # Juz/Page boundary tables
│   │
│   ├── audio.js            # Sheikh playback + user recording
│   ├── render.js           # DOM rendering (grid, ayah card)
│   ├── actions.js          # Bookmarks, notes, progress
│   │
│   ├── search-handler.js   # Search UI + debouncing
│   ├── searchWorker.js     # Background thread search
│   ├── keyboard-shortcuts.js # Global hotkeys
│   ├── gesture-handler.js  # Touch/swipe gestures
│   ├── ui-state.js         # Sidebar/drawer toggles
│   │
│   ├── tajweed.js          # Tajweed rules + colors
│   ├── tajweed_engine.js   # CSS Highlight API
│   ├── spread_engine.js    # Two-page spread view
│   ├── effects.js          # Animations
│   └── utils.js            # Helpers
│
├── data/
│   └── quran_data.js       # 6200+ ayahs (Arabic + Bosnian)
│
└── mp3/                    # Optional: [Surah][Ayah].mp3
```

---

## 🔑 Key Functions

### `app.js`
| Function | Purpose |
|----------|---------|
| `init()` | Main entry - validates data, restores session |
| `loadSurah(id, skipAnim)` | Load surah into UI |
| `populateSurahSelect()` | Fill 114 surah dropdown |
| `setupEventListeners()` | Wire all UI interactions |

### `config.js`
| Object | Purpose |
|--------|---------|
| `AppState` | Global state (data, currentSurah, recordings, settings) |
| `els` | DOM element registry (`els.surahSelect`, `els.recordBtn`) |

### `audio.js`
| Function | Purpose |
|----------|---------|
| `playSheikhAudio()` | Stream/play current ayah |
| `pauseSheikhAudio()` | Pause playback |
| `startRecording()` | Start mic recording |
| `stopRecording()` | Save recording to localStorage |
| `playUserRecording()` | Play user's saved audio |

### `render.js`
| Function | Purpose |
|----------|---------|
| `updateUI()` | Refresh ayah card, badges, navigation |
| `renderAyahGrid()` | Generate sidebar grid (286 buttons) |
| `updateGridHighlight()` | O(1) active ayah indicator |
| `renderTajweedLegend()` | Show rules present in current ayah |

### `actions.js`
| Function | Purpose |
|----------|---------|
| `toggleBookmark()` | Add/remove bookmark |
| `saveNote()` | Persist ayah note (debounced) |
| `markValid()` | Mark ayah as memorized |
| `exportData()` / `importData()` | JSON backup/restore |

### `search-handler.js`
| Function | Purpose |
|----------|---------|
| `setupSearch()` | Initialize search listeners |
| `performSearch(query)` | Send to worker, render results |

### `tajweed_engine.js`
| Function | Purpose |
|----------|---------|
| `highlightTajweed(text)` | Apply CSS highlights to Arabic |
| `getTajweedRules(ayah)` | Extract rules present in ayah |

---

## 💾 State Keys (localStorage)

```javascript
"quran_checked"      // Array - marked ayahs
"quran_bookmarks"    // Set - bookmarks
"quran_notes"        // Object - { "1:1": "note" }
"quran_theme"        // String - color theme
"quran_reciter"      // String - reciter ID
"quran_hifzRange"    // Object - { start, end }
"quran_ar_size"      // Number - Arabic font %
"quran_bs_size"      // Number - Translation font %
"quran_page_theme"   // String - page theme
```

---

## ⚡ Quick Commands

### Rebuild CSS
```bash
npx tailwindcss -i ./css/input.css -o ./css/tailwind-output.css --minify
# Or double-click build-css.bat
```

### Force Cache Refresh
```javascript
// In index.html, update:
const APP_VERSION = "0.1.2"; // Increment version
```

### Run Server
```bash
# Use VS Code Live Server
# Or double-click run_server.bat
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` | Next Ayah |
| `←` | Previous Ayah |
| `Space` | Record |
| `V` | Mark Valid |
| `P` / `Enter` | Play/Pause Sheikh |
| `U` | Play/Pause User |

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| No audio | Check `mp3/` folder: `11.mp3`, `12.mp3`... |
| Recording fails | Needs HTTPS or localhost |
| Stale UI | Increment `APP_VERSION` |
| Tajweed broken | Check `tajweed-active` class on `<body>` |

---

*See `ARCHITECTURE.md` for full details.*
