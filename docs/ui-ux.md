# Mushaf Plus UI/UX Layout Specification

This document serves as the ground truth for positioning key UI elements across different screen sizes. All future modifications should adhere to these patterns.

## 1. Main Action Toolbar (`#tlb-actions`)
This is the primary interaction bar containing "Prev", "Record", "Valid", "Bookmark", and "Next".

| Viewport | Positioning Mode | Vertical Anchor | Parent Container |
| :--- | :--- | :--- | :--- |
| **Desktop** (>=768px) | `relative` / Static | Flow after audio players | `#cnt-toolbar-placeholder` (inside `.ayah-card`) |
| **Mobile** (<768px) | `fixed` | `bottom: 5.5rem` | `document.body` (placed before `#nav-bottom`) |

### Relocation Logic
The `window.relocateToolbar()` function in `js/render.js` dynamically moves this element in the DOM to ensure reliable fixed positioning on mobile (avoiding parent `transform` clipping) and natural document flow on desktop.

## 2. Audio Recitation & Recording Players
| Element | Position | Visibility |
| :--- | :--- | :--- |
| `#cnt-ayah-audio` | Inside `.ayah-card` | Persistent (Top of vertical stack) |
| `#cnt-user-audio` | Inside `.ayah-card` | Toggle based on recording state |

On desktop, the `#tlb-actions` should sit **directly below** these players.

## 3. Bismillah Header (`#dsp-bismillah`)
*   **Condition**: Visible only when `AppState.currentAyahIndex === 0`.
*   **Exceptions**:
    *   **Surah 1 (Al-Fatiha)**: Hidden (Bismillah is part of Verse 1).
    *   **Surah 9 (At-Tawbah)**: Hidden (No Bismillah).

## 4. Mobile Bottom Navigation (`#nav-bottom`)
*   **Visibility**: `md:hidden` (Desktop: Hidden, Mobile: Visible).
*   **Position**: `fixed`, `bottom: 0`, `left: 0`, `right: 0`.
*   **Styling**: High blur (`backdrop-blur-md`), dark slate background.

## 5. View Modes (Ayah vs Spread)
State: `AppState.settings.spreadMode`

| Mode | Active Container | Rendering Engine | Focus |
| :--- | :--- | :--- | :--- |
| **Standard** | `#crd-ayah` | `js/render.js` | Focused study / repetition |
| **Spread** | `#crd-spread` | `js/spread_engine.js` | Reading flow (Side-by-side SVG) |

## 6. SVG Layer Detection System
The application now includes an automatic layer detection system that identifies and colors different elements in Quran SVG pages.

### Layer Types & Visual Representation
| Layer Name | Color (Original Theme) | Purpose | Detection Criteria |
| :--- | :--- | :--- | :--- |
| **Border & Frame** | `#C4922A` (Gold) | Page borders and ornamental frames | Green paths (`#bfe8c1`) with ≥2 subpaths |
| **Teardrop Shapes** | `#1B7A6A` (Teal) | Ornamental medallion backgrounds | Green paths with ≤1 subpath, length 800-2500 |
| **Arabic Text** | `#1e293b` (Dark) | Main calligraphy | Largest black path (`#231f20`) |
| **Verse Numerals** | `#ffffff` (White) | Ayah numbers in teardrops | Black paths with 0 subpaths, length <2000 |
| **Surah/Juz Header** | `#E8943A` (Orange) | Surah names and Juz labels | Black paths, length 5000-20000, ≤4 subpaths |
| **Ornamental Marker** | `#9B6ED4` (Purple) | Decorative section markers | Black paths with >5 subpaths, length >5000 |
| **Page Number** | `#4a90d9` (Blue) | Page numerals at bottom | Remaining black paths |

### Theme Integration
Each theme (Original, Sepia, Night, Green) has its own color palette for all 7 layers:
- **Original**: Warm golds, teals, and dark text
- **Sepia**: Earthy browns and muted tones
- **Night**: Light text on dark backgrounds
- **Green**: Emerald-based color scheme

### Technical Implementation
- Elements are tagged with `data-layer-type` attribute during detection
- CSS rules apply theme-specific colors based on layer type and current theme
- Detection runs automatically when SVG pages load in spread mode
- Colors update dynamically when theme changes via `updateSVGLayerTheme()`


## 7. Spread Mode UI Components
When Spread Mode is active (`document.body.classList.contains("spread-mode-active")`), the main UI transforms to prioritize reading:
*   **Sidebar**: Hidden (`md:hidden` applied to `#dwr-sidebar`).
*   **App Container**: Max-width is removed (`max-w-full`).
*   **Toolbars**: Specialized toolbars become visible.

### Zoom Toolbar (`#tlb-zoom`)
*   **Visibility**: Visible only in Spread Mode.
*   **Position**: Fixed to the bottom-center (`bottom: 2rem`, `left: 50%`, `transform: translateX(-50%)`).
*   **Z-index**: High enough to sit on top of the spread pages (`z-[10002]`).
*   **Styling**: Glassmorphism effect (`backdrop-blur-md`, semi-transparent background). Adjusts background color based on Light/Dark mode (via `.light` class on document).

### Spread Theme Toolbar (`#cnt-page-theme-toggle`)
*   **Visibility**: Visible only in Spread Mode. Display is flex column (`align-items: center`).
*   **Position**: Fixed to the right-center (`top: 50%`, `right: 1.5rem`, `transform: translateY(-50%)`).
*   **Contents**:
    *   **Day/Night Toggle**: `#btn-spread-lightmode-toggle`. Toggles between light and dark modes, syncing with the global app state. The sun/moon icon visibility is controlled by CSS based on the `.light`/`.dark` classes on the `<html>` element.
    *   **Theme Dots**: Buttons with class `.btn-theme-dot`. Applying a theme updates the `AppState.settings.pageTheme` and triggers the SVG Layer Recoloring.
*   **Responsive Styling**: Uses `.light` class to adjust background to a lighter blur if needed, though usually kept dark for contrast.

## 8. Theme System (`themes.css`)
All theme-related CSS variables and specific layer colorizations are isolated in `css/themes.css`.
*   **Structure**: Uses CSS custom properties defined within `.quran-theme-[name]` and `.quran-theme-[name].light` scopes.
*   **Light/Dark Adaptive**: Each theme has a dark version and a `.light` modified version to ensure perfect contrast regardless of the global app light/dark mode preference. The app dynamically handles combining the global mode with the specific page theme choice.

---
*Last updated: 2026-03-17*
