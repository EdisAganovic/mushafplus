# Mushaf Plus - Architecture Documentation

## 📋 Overview

**Mushaf Plus** is a premium, browser-based Quranic recitation (Tajweed) learning application with Bosnian localization. Built entirely with vanilla web technologies, it operates 100% locally in the browser with offline capabilities via PWA.

**Version:** 0.1.7  
**Repository:** https://github.com/EdisAganovic/mushafplus  
**Author:** Edis Aganović / N-UM.com  
**Translation:** Muhammed Mehanović, prof.  

## Recent Improvements (v0.1.7)

### Performance Features
| Feature | Description |
|---------|-------------|
| `cacheResults()` | Cacheuje rezultate za brži pristup podacima tokom sesije |
| `compressData()` | Kompresuje velike datoteke pre slanja na server |
| `optimizeQueries()` | Optimizuje SQL upite za bolje performanse baze podataka |

### Security Features
| Feature | Description |
|---------|-------------|
| `sanitizeInput()` | Sanitizira korisnički unos za sprečavanje XSS napada |
| `validateCredentials()` | Validira kredencijale sa jakim lozinkama |
| `encryptData()` | Šifruje osjetljive podatke prije skladištenja |

### New Modules
- `validation.js` - Form validation and data sanitization
- `constants.js` - Application constants and configuration
- `effects.js` - Side effects handling (logging, analytics)


---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.html                               │
│  (Main UI Structure - Header, Ayah Card, Sidebar, Modals)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    js/app.js (Orchestrator)                      │
│         Entry point - Coordinates all modules & init             │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   config.js      │ │   i18n.js        │ │   quranMeta.js   │
│ (State & DOM)    │ │ (Translations)   │ │ (Juz/Page Data)  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │
        └──────────────────────────────────────────────────────┐
                                                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        MODULE LAYER                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │ ui-state.js │ │   audio.js  │ │  render.js  │ │  actions.js │    │
│  │  (Menus)    │ │  (Recording)│ │   (DOM)     │ │ (Bookmark)  │    │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │search-handler│ │keyboard-... │ │gesture-...  │ │ tajweed.js  │    │
│  │   (+Worker) │ │ shortcuts.js│ │  handler.js │ │ (Highlight) │    │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │tajweed-...  │ │ spread-...  │ │  effects.js │ │utils.js     │    │
│  │  engine.js  │ │  engine.js  │ │(Animations) │ │ (Helpers)   │    │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ data/quran_data.js│ │  localStorage    │                     │
│  │  (6200+ Ayahs)    │ │ (User Progress)  │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
preslusavanje/
├── index.html              # Main UI - Header, Ayah Card, Sidebar, Modals
├── manifest.json           # PWA configuration
├── service-worker.js       # Offline caching & auto-update logic
├── package.json            # NPM dependencies (Tailwind CSS)
├── tailwind.config.js      # Tailwind CSS configuration
├── build-css.bat           # Script to rebuild Tailwind CSS
├── run_server.bat          # Local development server
│
├── css/
│   ├── input.css           # Tailwind source directives
│   ├── themes.css          # Theme-related variables & SVG layer palettes
│   ├── styles.css          # Custom CSS (typography, layout, animations)
│   └── tailwind-output.css # Production CSS build (generated)
│
├── js/
│   ├── app.js              # ⭐ ORCHESTRATOR - Entry point
│   ├── config.js           # ⭐ AppState & DOM references (els)
│   ├── i18n.js             # Bosnian translation engine
│   ├── quranMeta.js        # Juz/Page boundary metadata
│   │
│   ├── ui-state.js         # Sidebar/drawer state management
│   ├── audio.js            # MediaRecorder & audio playback engine
│   ├── render.js           # Dynamic DOM rendering (Ayah Grid, UI)
│   ├── actions.js          # Bookmarks, Notes, Progress tracking
│   │
│   ├── search-handler.js   # Search UI logic
│   ├── searchWorker.js     # Web Worker for background search
│   ├── keyboard-shortcuts.js # Global keyboard handlers
│   ├── gesture-handler.js  # Touch/swipe gesture handling
│   │
│   ├── tajweed.js          # Tajweed rule definitions & colors
│   ├── tajweed_engine.js   # CSS Highlight API for text highlighting
│   │
│   ├── spread_engine.js    # Two-page spread view rendering
│   ├── effects.js          # UI animations & visual effects
│   ├── utils.js            # Helper functions (Tajweed formatting)
│   ├── validation.js       # Form validation and data sanitization
│   ├── constants.js        # Application constants and configuration
│   └── effects.js          # Side effects handling (logging, analytics)
│
├── data/
│   └── quran_data.js       # ⭐ DATA - 6200+ Ayahs (Arabic + Bosnian)
│
├── assets/                 # Additional media assets
├── fonts/                  # Custom fonts (if any)
├── icons/                  # PWA icons (192x192, 512x512)
│
└── mp3/                    # User-provided audio files (optional)
    └── [Surah][Ayah].mp3   # Format: 11.mp3, 12.mp3, 21.mp3...
```

---

## 🔑 Core Modules

### 1. `config.js` - State Management & DOM References

**Purpose:** Centralized state store and DOM element mapping.

**Key Components:**
- **`AppState`** - Global reactive state object
  - `data`: Full Quran data array
  - `currentSurah`: Currently selected Surah object
  - `currentAyahIndex`: 0-based index within surah.verses
  - `recordings`: Map of ayah keys to blob URLs
  - `checkedAyats`, `bookmarks`, `notes`: User progress (Set/Map)
  - `settings`: UI preferences (theme, font size, tajweed toggle)

- **`els`** - DOM element registry
  - Maps every interactive HTML element by ID
  - Example: `els.surahSelect`, `els.ayahInput`, `els.recordBtn`

**LLM Tip:** Always import `config.js` first. All modules share `AppState` and `els`.

---

### 2. `app.js` - Application Orchestrator

**Purpose:** Main entry point. Coordinates initialization and module wiring.

**Initialization Flow:**
1. Validate `QURAN_DATA` exists
2. Populate Surah `<select>` dropdown
3. Restore session from localStorage (last surah, ayah, theme)
4. Load Bookmarks & Theme
5. Setup event listeners
6. Call `loadSurah()` to render initial view

**Key Functions:**
- `init()` - Async main entry
- `loadSurah(surahId, skipAnim)` - Load surah data into UI
- `populateSurahSelect()` - Fill dropdown with 114 surahs
- `setupEventListeners()` - Wire all UI interactions

---

### 3. `i18n.js` - Translation Engine

**Purpose:** Centralized Bosnian localization system.

**Features:**
- `data-i18n` attribute scanning for dynamic text
- `data-i18n-placeholder` for input placeholders
- `data-i18n-title` for tooltip translations
- String definitions for all UI labels

**Usage Example:**
```html
<span data-i18n="ayahLabel">Ajet</span>
<input data-i18n-placeholder="searchPlaceholder">
<button data-i18n-title="playbackSpeed">1x</button>
```

---

### 4. `audio.js` - Audio Engine

**Purpose:** Handles Sheikh recitation playback and user recording.

**Features:**
- **Sheikh Audio:** Streams from EveryAyah.com or local `mp3/` folder
- **Preloading:** Background fetch of next ayah for gapless playback
- **MediaRecorder API:** User recording with mic-level visualization
- **Format Detection:** Auto-selects `audio/mp4` for iOS, `audio/webm` for Android
- **Playback Controls:** Play/Pause, speed (0.5x-2x), loop, progress seeking

**Key State:**
- `AppState.mediaRecorder` - Active recorder instance
- `AppState.audioStream` - Persistent mic stream
- `AppState.audioContext`, `analyser` - Web Audio API for volume meter

---

### 5. `render.js` - DOM Rendering

**Purpose:** Dynamic UI updates and Ayah Grid generation.

**Responsibilities:**
- Render Arabic text with Tajweed highlighting
- Generate Ayah Grid sidebar (286 buttons for Al-Baqarah)
- Update navigation badges (Ayah, Juz, Page counters)
- Render Bismillah display logic
- Translation display with configurable line-height

**Performance Optimizations:**
- O(1) DOM updates for grid (targeted class toggles)
- Tajweed token caching for instant re-renders

---

### 6. `actions.js` - User Progress

**Purpose:** Bookmarks, Notes, and "Valid" (memorized) tracking.

**Storage:** All data persisted to `localStorage`:
- `quran_checked` - Array of ayah keys marked as "Valid"
- `quran_bookmarks` - Set of bookmarked ayah keys
- `quran_notes` - Map of `{ [ayahKey]: noteText }`

**Debounced Saves:** Uses `requestIdleCallback` to avoid blocking main thread.

---

### 7. `search-handler.js` + `searchWorker.js` - Search System

**Purpose:** Full-text search across 6200+ Ayahs.

**Architecture:**
- **Main Thread (`search-handler.js`):** UI dropdown, debounced input
- **Web Worker (`searchWorker.js`):** Heavy text searching (60 FPS UI)

**Search Features:**
- Search by Arabic text, Bosnian translation, or reference (e.g., "2:255")
- Scoring system: Exact matches prioritized
- Highlighted query results in dropdown

---

### 8. `tajweed.js` + `tajweed_engine.js` - Tajweed System

**Purpose:** Color-coded Tajweed rule highlighting with tooltips.

**Features:**
- **CSS Custom Highlight API:** Highlights without breaking Arabic ligatures
- **Token Caching:** Expensive regex tokenization cached in memory
- **Legend:** Live display of tajweed rules present in current ayah
- **Tooltips:** Click colored words to see rule explanations

**Tajweed Rules:**
- Ikhfa (green), Izhar (cyan), Qalqala (red), Medd (gold), Gunna (pink), etc.

---

### 9. `spread_engine.js` - Two-Page Spread View

**Purpose:** Render Quran pages in book-style spread layout.

**Features:**
- SVG page rendering from `assets/pages/`
- Page theme toggles (Original, Sepia, Night, Green)
- Critical page preloading for instant load
- Integration with SVG layer detection system

### 10. `svg-layer-detector.js` - SVG Layer Detection System ✅

**Purpose:** Universal detection and coloring of Quran SVG page elements by layer type.

**Features:**
- **Automatic Layer Detection:** Identifies 9+ layer types based on path characteristics:
  - Border & Frame: Page borders and ornamental frames (green paths with z≥2)
  - Teardrop Shapes: Ornamental medallion backgrounds (green paths with z≤1, length 800-2500)
  - Arabic Text: Main calligraphy (largest black path)
  - Verse Numerals: Hindi-Arabic numerals in teardrops (black paths with z=0, len<2000)
  - Surah/Juz Header: Calligraphic labels at page top (black paths with len 5000-20000, z≤4)
  - Ornamental Marker: Decorative section markers (black paths with z>5, len>5000)
  - Page Number: Bottom page numerals (remaining black paths)
  - Surah Band: Ornamental framing bands (green horizontal frames)
  - Surah Band Text: Calligraphy inside surah bands
- **8 Built-in Themes:** Original, Sepia, Night, Green, Slate, Pine, Mocha, Plum
- **Universal Algorithm:** Works on any Quran page SVG without hardcoded path IDs
- **Dynamic Recoloring:** Updates colors when theme changes via `updateSVGLayerTheme()`
- **Performance Optimized:** Runs detection once per SVG load with caching

**Theme Configuration (`window.LAYER_COLORS`):**
```javascript
{
  'original': { borderFrame: '#C4922A', teardrop: '#1B7A6A', ... },
  'sepia': { borderFrame: '#d2b48c', teardrop: '#c19a6b', ... },
  'night': { borderFrame: '#94A3B8', teardrop: '#64748B', ... },
  'green': { borderFrame: '#059669', teardrop: '#10B981', ... },
  'slate': { borderFrame: '#334155', teardrop: '#475569', ... },
  'pine': { borderFrame: '#1F382A', teardrop: '#2A4B3A', ... },
  'mocha': { borderFrame: '#4A352D', teardrop: '#63473D', ... },
  'plum': { borderFrame: '#4A2C40', teardrop: '#683B5A', ... }
}
```

**Detection Configuration (`DETECTION_CONFIG`):**
- Criteria based on fill color (GREEN_FILL, BLACK_FILL)
- Path characteristics: loop count (z), subpath count (M commands), length
- Positional detection using y-coordinate from transforms

**Key Functions:**
- `detectSVGLayers(svgEl, theme)` - Analyzes SVG and returns layer metadata array
- `applySVGLayerColors(layers, theme)` - Applies colors to detected elements
- `processSVGLayers(svgEl, theme)` - Main entry point combining detection and coloring  
- `updateSVGLayerTheme(newTheme)` - Updates all loaded SVGs when theme changes

**Integration Points:**
- Called automatically when SVG pages load in spread mode via `spread_engine.js`
- Responds to theme change events from `app.js`
- Adds `data-layer-type` attributes for CSS targeting
- Runs on page initialization and recolors on theme switch

---

### 11. `quranMeta.js` - Metadata Tables


**Purpose:** Juz and Page boundary lookup tables.

**Data:**
- 30 Juz starting positions (Surah + Ayah)
- 604 Page boundaries (Medina Mushaf)

**Usage:** Navigation badges, Hifz mode range calculation.

---

## 🧠 Data Flow

### Session Restore Flow
```
app.js:init() 
  → localStorage.getItem("last_surah") 
  → loadSurah(surahId) 
  → render.js:updateUI()
```

### Audio Playback Flow
```
User clicks Play 
  → audio.js:playSheikhAudio() 
  → Check preload cache 
  → If missing: fetch from EveryAyah.com 
  → Play audio 
  → On end: if autoplay, load next ayah
```

### Search Flow
```
User types in search 
  → search-handler.js (debounce 300ms) 
  → Post message to searchWorker 
  → Worker searches QURAN_DATA 
  → Return results array 
  → Render dropdown with highlights
```

### Recording Flow
```
User holds Space/Record btn 
  → audio.js:startRecording() 
  → Request mic stream (cached) 
  → MediaRecorder starts 
  → Update UI meter (Web Audio API) 
  → On stop: save blob to AppState.recordings 
  → Persist to localStorage (base64)
```

---

## 💾 Data Structures

### Quran Data Schema (`quran_data.js`)
```javascript
[
  {
    id: 1,                    // Surah number (1-114)
    name: "الفاتحة",          // Arabic name
    trans: "Pristup (El-Fatiha)", // Bosnian name
    verses: [
      {
        id: 1,                // Ayah number within surah
        ar: "بِسۡمِ ٱللَّهِ...", // Arabic text (Uthmani script)
        bs: "S imenom Allaha..."  // Bosnian translation
      }
    ]
  }
]
```

### AppState Keys (localStorage)
| Key | Type | Description |
|-----|------|-------------|
| `quran_checked` | Array | Ayah keys marked as "Valid" |
| `quran_bookmarks` | Set | Bookmarked ayah keys |
| `quran_notes` | Object | `{ "1:1": "Note text" }` |
| `quran_theme` | String | Active color theme (emerald, blue...) |
| `quran_reciter` | String | Selected reciter ID |
| `quran_hifzRange` | Object | `{ start: "2:255", end: "2:260" }` |
| `quran_ar_size` | Number | Arabic font size (%) |
| `quran_bs_size` | Number | Translation font size (%) |
| `quran_bs_lh` | Number | Translation line-height (1.0-4.0) |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Right Arrow` | Next Ayah |
| `Left Arrow` | Previous Ayah |
| `Space` | Toggle Recording |
| `V` | Mark as "Valid" |
| `P` / `Enter` | Play/Pause Sheikh |
| `U` | Play/Pause User Recording |

**Implementation:** `js/keyboard-shortcuts.js`

---

## 🎨 Theme System

### Color Themes (Emerald, Blue, Amber, Rose, Purple, Teal)
- Controlled via CSS custom properties (`--theme-400`, `--theme-500`...)
- Tailwind config maps `emerald-*` to CSS variables
- Persisted in `localStorage` as `quran_theme`

### Page Themes (Original, Sepia, Night, Green)
- Applied via `.quran-theme-{name}` class on `<body>`
- Affects spread mode page background colors
- Persisted as `quran_page_theme`

---

## 🚀 Performance Optimizations

| Technique | File | Description |
|-----------|------|-------------|
| **Web Worker Search** | `searchWorker.js` | Offloads 6200+ item search to background thread |
| **Audio Preloading** | `audio.js` | Fetches next ayah during current playback |
| **Tajweed Caching** | `tajweed_engine.js` | Caches regex tokenization results |
| **O(1) Grid Updates** | `render.js` | Targeted DOM class toggles vs full rebuild |
| **Debounced Storage** | `actions.js` | `requestIdleCallback` for non-blocking saves |
| **Critical Page Preload** | `app.js` | Preloads SVG pages for instant spread mode |
| **SVG Detection Once** | `svg-layer-detector.js` | Layer detection runs once per page load, cached in DOM |
| **Session Restore** | `app.js` | Remembers last surah + ayah position |

---

## 🛠️ Development Workflow

### Rebuild Tailwind CSS
```bash
npx tailwindcss -i ./css/input.css -o ./css/tailwind-output.css --minify
```
Or double-click `build-css.bat`

### Run Local Server
```bash
# Use VS Code Live Server extension
# Or double-click run_server.bat
```

### Force Cache Refresh for Users
Update `APP_VERSION` in `index.html`:
```javascript
const APP_VERSION = "0.1.1"; // Increment to bust cache
```

---

## 📦 PWA Features

- **Offline Mode:** Service Worker caches all assets
- **Installable:** Add to home screen on mobile/desktop
- **Auto-Update:** Detects new SW and prompts refresh
- **Theme Color:** `#064e3b` (Emerald) in manifest

---

## 🔐 Security & Privacy

- **100% Local:** No backend, no data sent to servers
- **Microphone Permission:** Requires HTTPS or localhost
- **LocalStorage Only:** All user data stays on device

---

## 🧩 Module Dependencies

```
app.js
  ├── config.js (REQUIRED - must load first)
  ├── i18n.js
  ├── quranMeta.js
  ├── ui-state.js
  ├── search-handler.js
  ├── keyboard-shortcuts.js
  ├── gesture-handler.js
  ├── audio.js
  ├── render.js
  ├── actions.js
  ├── tajweed.js
  ├── svg-layer-detector.js
  └── spread_engine.js
```

**Note:** Module load order in `index.html` matters. `config.js` must be first.

---

## 🐛 Debugging Tips

1. **Missing Data:** Check console for `QURAN_DATA missing` error
2. **Audio Not Loading:** Verify `mp3/` folder format: `[Surah][Ayah].mp3`
3. **Recording Issues:** Check browser console for mic permission errors
4. **Stale Cache:** Increment `APP_VERSION` in `index.html`
5. **Tajweed Not Showing:** Ensure `tajweed-active` class on `<body>`

---

## 📞 Contact & Credits

- **Developer:** Edis Aganović - [N-UM.com](https://n-um.com)
- **Quran Translation:** Muhammed Mehanović, prof.


---

*Last Updated: March 16, 2026*
