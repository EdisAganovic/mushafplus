# Mushaf Plus UI/UX Layout Specification

This document serves as the ground truth for positioning key UI elements across different screen sizes. All future modifications should adhere to these patterns.

## 1. Main Action Toolbar (`#tlb-actions`)
Primary interaction bar containing "Prev", "Record", "Valid", "Bookmark", and "Next".

### Positioning Strategy

| Viewport | Parent Container | Positioning Mode | Z-Index | Width/Horizontal | Vertical Anchor |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop** (>=768px) | `#cnt-toolbar-placeholder` (inside `.ayah-card`) | Static / Flow-based | Auto | Full container width | Directly below audio players |
| **Mobile** (<768px) | Placed before `#nav-bottom` in body | Fixed | 9999 | `calc(100% - 1rem)` (with 0.5rem padding) | `bottom: 5.5rem` |

### Relocation Logic (`window.relocateToolbar()`)
```javascript
// Desktop: Move inside card for natural flow
else {
  // Mobile: Fixed positioning at bottom, before nav bar
  els.mainActionToolbar.style.position = "fixed";
  els.mainActionToolbar.style.bottom = "5.5rem";
  els.mainActionToolbar.style.left = "0.5rem";
  els.mainActionToolbar.style.right = "0.5rem";
  els.mainActionToolbar.style.width = "calc(100% - 1rem)";
  els.mainActionToolbar.style.zIndex = "9999";
  
  // Insert before mobile nav to maintain document order
  if (els.mobileBottomNav) {
    document.body.insertBefore(els.mainActionToolbar, els.mobileBottomNav);
  } else {
    document.body.appendChild(els.mainActionToolbar);
  }
}
```

**Triggers**: Resize events, spread mode toggle, initial window load.

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

### Detection Pipeline
Detection runs automatically on page load via `detectSVGLayers(svgEl, currentTheme)`:

1. **Filter & classify paths** based on:
   - Color (stroke) matching
   - Path length thresholds (`getLength()`)
   - Subpath count (`subpaths.length`)

2. **Apply attributes**: Add `data-layer-type` to each element

3. **Color via CSS**: Styles apply through `.quran-theme-[name]` selectors

### Layer Classification Criteria

| Layer | Selector Criteria | Default Color | Purpose |
| :--- | :--- | :--- | :--- |
| Border & Frame | `fill:#bfe8c1` AND `subpaths.length >= 2` | `#C4922A` | Page borders, corner frames |
| Teardrop Shapes | `fill` same + `subpaths <= 1` + `length 800-2500` | `#1B7A6A` | Ornamental medallions |
| Arabic Text | `!fill:#231f20` + **largest length** | `#1e293b` | Primary Arabic calligraphy |
| Verse Numerals | `!fill:#231f20` + `subpaths <= 0` + `length < 2000` | `#ffffff` | Small numbers in teardrops |
| Surah/Juz Header | `!fill:#231f20` + `length 5000-20000` + `subpaths <= 4` | `#E8943A` | Title text, surah names |
| Ornamental Marker | `!fill:#231f20` + `subpaths > 5` + `length > 5000` | `#9B6ED4` | Decorative flourishes |
| Page Number | Remaining `!fill:#231f20` paths | `#4a90d9` | Numerals at page bottom |

### Theme System Integration
- Each theme defines color palettes in `.quran-theme-[name]` CSS classes
- Layer colors update dynamically via `window.updateSVGLayerTheme(newTheme)` on theme change
- Supports: Original, Sepia, Night, Emerald

### Implementation Hooks
```javascript
// Apply when theme changes
window.updateSVGLayerTheme = function(newTheme) {
  const containers = document.querySelectorAll(
    '.quran-svg-container, #svg-container, .spread-page-svg, .quran-page-svg-container'
  );
  
  containers.forEach(container => {
    const svg = container.querySelector('svg');
    if (svg) {
      const layers = detectSVGLayers(svg, newTheme);
      applySVGLayerColors(layers, newTheme);
    }
  });
};
```

### Detection Thresholds Reference
```javascript
const LAYER_CONFIG = {
  borderColor: "#bfe8c1",
  teardropLengthRange: [800, 2500],
  surahHeaderLengthRange: [5000, 20000],
  numeralSubpathLimit: 0,
  ornamentalSubpathLimit: 5,
  arabicTextMaxPath: Infinity
};
```



## 7. Spread Mode UI Components

### Visual State Changes (`body.spread-mode-active`)
- **Sidebar**: Hidden (`.md:hidden` on `#dwr-sidebar`)
- **App Container**: Full width (`max-w-full`, no centering)
- **Standard Toolbar**: Hidden (display: none on `#tlb-actions`)

### Zoom Toolbar (`#tlb-zoom`)
*   **Visibility**: Only when spread mode active (`#show-spread-btn` visible conditionally)
*   **Position**: Fixed bottom-center
    *   `bottom: 2rem`
    *   `left: 50%` with `transform: translateX(-50%)`
*   **Z-index**: 10002 (overlays spread pages)
*   **Styling**:
    *   Glassmorphism: `backdrop-blur-md` + semi-transparent background
    *   Dynamic light mode: Background adjusts via `.light` class on document

### Page Theme Toolbar (`#cnt-page-theme-toggle`)
*   **Visibility**: Spread mode only
*   **Position**: Fixed right-side, vertically centered
    *   `top: 50%` with `transform: translateY(-50%)`
    *   `right: 1.5rem`
*   **Contents**:
    *   **Day/Night Toggle**: `#btn-spread-lightmode-toggle` - syncs HTML `.light`/`.dark` classes
    *   **Theme Buttons**: `.btn-theme-dot` - triggers theme change + SVG recoloring

### Spread Layout Structure
```css
#cnt-spread-view {
  display: flex;
  flex-direction: row-reverse;
  gap: 0;
  height: 100%;
}

/* Right Page (Page n) */
#cnt-spread-view > div:nth-child(1) {
  align-items: flex-start;
  margin-top: 4.5rem;
}

/* Left Page (Page n+1) */
#cnt-spread-view > div:nth-child(2) {
  align-items: flex-end;
  margin-top: 4.5rem;
}
```

### Key Design Principle
**Shared baseline**: Both pages use `margin-top: 4.5rem` to create a visual continuous line across the spine, mimicking traditional mushaf spreads.

## 8. Theme System (`css/themes.css`)

### Structure Pattern
```css
/* CSS Custom Properties scoped to theme classes */
.light {
  /* Inverted palette values */
  --slate-50: [light value];
  --slate-950: [dark value];
}

.quran-theme-[name] .layer[data-layer-type="arabic-text"] {
  fill: var(--theme-color-variable);
}

/* Combine global light/dark mode with specific page theme */
html.dark .quran-theme-emerald .btn-theme-dot {
  /* Apply dark theme overrides on top of emerald */
}
```

### Theme-Specific Adaptations
- Each page theme has **two** base definitions: `@dark` and `.light @light`
- This allows independent control regardless of app's global light/dark preference
- Styles use cascade: Base theme → Global mode modifier (`.light` or `html.dark`)

---
*Last updated: 2026-03-18*

## Developer Quick Reference

### Element Positioning Summary
| Element | Desktop Strategy | Mobile Strategy | Spread Mode |
| :--- | :--- | :--- | :--- |
| Main Toolbar | Static in card placeholder | Fixed bottom (5.5rem) | Hidden |
| Audio Players | In `.ayah-card`, visible | Same, pushed down by toolbar | Hidden/in spread container |
| Bismillah Card | Top of `#cnt-spread-view` | Same structure | Visible per page |
| SVG Container | Standard flex layout | `width: 100%` | Two containers side-by-side |

### Critical Functions & Files
- `window.relocateToolbar()` - **js/render.js:303** - Position toolbar based on viewport/state
- `window.updateSVGLayerTheme(theme)` - **js/svg-layer-detector.js:368** - Recolor SVG layers for new theme
- `window.toggleSpreadMode()` - **js/actions.js:322** - Toggle between viewing modes

### Common Positioning Classes
```css
desktop-static    /* Inside container, natural flow */
mobile-fixed-5_5  /* Fixed bottom: 5.5rem with padding */
fixed-bottom-full /* Full width fixed nav at bottom */
spread-z-index-10002  /* For zoom toolbar in spread mode */
```

### Detection Thresholds Reference
```javascript
const LAYER_CONFIG = {
  borderColor: "#bfe8c1",
  teardropLengthRange: [800, 2500],
  surahHeaderLengthRange: [5000, 20000],
  numeralSubpathLimit: 0,
  ornamentalSubpathLimit: 5,
  arabicTextMaxPath: Infinity
};
```
