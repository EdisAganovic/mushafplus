# TODO: Standardize UI Component Naming

## Problem

Current naming inconsistencies make searching and maintenance difficult:

1. **Inconsistent "Drawer" vs "Overlay" terminology** - Multiple elements for same component
2. **Generic names** - `sidebar`, `main-action-toolbar` are hard to search
3. **Mobile vs Desktop duplication** - `-mobile` suffix creates confusion
4. **Mixed naming patterns** - No consistent convention across components

---

## Proposed Naming Convention

Use **prefix-based system** for unique, searchable IDs:

| Component Type | Prefix | Example |
|----------------|--------|---------|
| **Overlays** (backdrop) | `ovl-` | `ovl-settings`, `ovl-bookmarks`, `ovl-hifz`, `ovl-sidebar` |
| **Drawers** (slide panels) | `dwr-` | `dwr-settings`, `dwr-bookmarks`, `dwr-hifz`, `dwr-sidebar` |
| **Modals** | `mdl-` | `mdl-search`, `mdl-about`, `mdl-version`, `mdl-surah` |
| **Toolbars** | `tlb-` | `tlb-actions`, `tlb-header` |
| **Navigation** | `nav-` | `nav-bottom`, `nav-header` |
| **Buttons** | `btn-` | `btn-prev`, `btn-next`, `btn-record` |
| **Inputs** | `inp-` | `inp-search`, `inp-page`, `inp-juz` |
| **Displays** | `dsp-` | `dsp-arabic`, `dsp-translation` |
| **Cards** | `crd-` | `crd-ayah`, `crd-spread` |
| **Lists/Containers** | `lst-` / `cnt-` | `lst-bookmarks`, `cnt-grid` |

---

## Implementation Tasks

### Phase 1: Update HTML (`index.html`)

Rename all UI element IDs:

```
OLD                          → NEW
─────────────────────────────────────────────
settings-overlay             → ovl-settings
settings-drawer              → dwr-settings
bookmarks-overlay            → ovl-bookmarks
bookmarks-drawer             → dwr-bookmarks
hifz-overlay                 → ovl-hifz
hifz-drawer                  → dwr-hifz
sidebar-overlay              → ovl-sidebar
sidebar                      → dwr-sidebar

search-modal                 → mdl-search
about-modal                  → mdl-about
version-modal                → mdl-version
surah-hifz-modal             → mdl-surah

main-action-toolbar          → tlb-actions
desktop-toolbar-placeholder  → cnt-toolbar-placeholder

mobile-bottom-nav            → nav-bottom
surah-select                 → inp-surah
search-input                 → inp-search
page-input                   → inp-page
juz-input                    → inp-juz
ayah-input                   → inp-ayah

arabic-display               → dsp-arabic
translation-display          → dsp-translation
bismillah-display            → dsp-bismillah
current-surah-name           → dsp-surah-name

ayah-card                    → crd-ayah
spread-card                  → crd-spread
spread-view                  → cnt-spread-view

ayah-grid                    → cnt-ayah-grid
ayah-grid-mobile             → cnt-ayah-grid-mobile
bookmarks-list               → lst-bookmarks
bookmarks-list-mobile        → lst-bookmarks-mobile
modal-surah-list             → lst-surah-modal

prev-btn                     → btn-prev
next-btn                     → btn-next
record-btn                   → btn-record
valid-btn                    → btn-valid
bookmark-btn                 → btn-bookmark
spread-toggle                → btn-spread-toggle
settings-toggle              → btn-settings-toggle
mobile-grid-toggle           → btn-menu-toggle

nav-surah-btn                → btn-nav-surah
nav-hifz-btn                 → btn-nav-hifz
nav-search-btn               → btn-nav-search
nav-bookmarks-btn            → btn-nav-bookmarks
nav-settings-btn             → btn-nav-settings

settings-close               → btn-close-settings
sidebar-close                → btn-close-sidebar
bookmarks-close              → btn-close-bookmarks
hifz-close-mobile            → btn-close-hifz

hifz-toggle                  → chk-hifz
hifz-toggle-mobile           → chk-hifz-mobile
hifz-range-text              → dsp-hifz-range
hifz-range-text-mobile       → dsp-hifz-range-mobile

reciter-select               → inp-reciter
theme-select                 → inp-theme
page-theme-select            → inp-page-theme
lightmode-toggle             → chk-lightmode
autoplay-toggle              → chk-autoplay
tajweed-toggle               → chk-tajweed
tajweed-legend-toggle        → chk-tajweed-legend
notes-toggle                 → chk-notes
audio-toggle                 → chk-audio
word-audio-toggle            → chk-word-audio

export-btn                   → btn-export
import-btn                   → btn-import
import-file                  → inp-import-file

ayah-audio-container         → cnt-ayah-audio
ayah-audio                   → aud-ayah
ayah-play-btn                → btn-ayah-play
ayah-progress-bg             → prg-ayah
reciter-name-label           → dsp-reciter-name

user-audio-container         → cnt-user-audio
user-play-btn                → btn-user-play
user-progress-bg             → prg-user
audio-playback               → aud-playback

ayah-notes-container         → cnt-notes
ayah-notes                   → inp-notes

page-progress-container      → cnt-page-progress
page-progress                → dsp-page-progress

progress-percent             → dsp-progress-percent
progress-bar-fill            → prg-bar-fill

ar-size-slider               → rng-ar-size
ar-size-val                  → dsp-ar-size
bs-size-slider               → rng-bs-size
bs-size-val                  → dsp-bs-size
ar-lh-slider                 → rng-ar-lh
ar-lh-val                    → dsp-ar-lh

settings-preview-ar          → prv-arabic
settings-preview-bs          → prv-translation

mic-meter-container          → cnt-mic-meter
mic-meter-bar                → bar-mic-meter

swipe-toast                  → toast-swipe
```

---

### Phase 2: Update JavaScript

#### `js/config.js`
- [ ] Update all `window.els.*` mappings to new IDs

#### `js/ui-state.js`
- [ ] Update all `els.*` references
- [ ] Consider renaming functions for consistency (optional)

#### `js/app.js`
- [ ] Update all `els.*` references
- [ ] Update event listener registrations

#### Other JS files
- [ ] `js/actions.js` - Update references
- [ ] `js/render.js` - Update references
- [ ] `js/audio.js` - Update references
- [ ] `js/search-handler.js` - Update references
- [ ] `js/spread_engine.js` - Update references
- [ ] Any other files with DOM references

---

### Phase 3: Update CSS (`css/styles.css`)

- [ ] Update all CSS selectors using old IDs
- [ ] Search for `#old-id` patterns and replace

---

### Phase 4: Verification

- [ ] Run application and test all UI components
- [ ] Verify all drawers/modals open/close correctly
- [ ] Test mobile and desktop layouts
- [ ] Check browser console for errors
- [ ] Verify search functionality works with new namesInvalid URI. Load of media resource  failed. localhost:8000


---

## Benefits

✅ **Searchable** - Typing `ovl-` shows all overlays, `dwr-` shows all drawers  
✅ **Consistent** - Clear pattern across entire codebase  
✅ **Maintainable** - Easy to understand component type at a glance  
✅ **LLM-friendly** - Clear semantic meaning for AI assistance  
✅ **Scalable** - Easy to add new components following the same pattern

---

## Notes

- Use `replace_all` for systematic replacements
- Update all files in sequence to avoid broken references
- Test thoroughly after each phase
- Consider creating a reference document for the naming convention
