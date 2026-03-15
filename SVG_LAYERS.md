# Quran SVG Layer Detection System

This document explains the logic and implementation of the automatic layer detection and coloring system for Quran page SVGs in Mushaf Plus.

## Overview

The system dynamically analyzes SVG paths to identify functional layers like the border, main text, verse numbers, and ornamental markers. It then applies theme-specific colors and styles to these layers, enabling a modern, highly customizable reading experience while maintaining the authenticity of the original Page SVGs.

## Core Components

### 1. Detection Configuration (`DETECTION_CONFIG`)
The system uses specific criteria to differentiate between paths based on their **fill color**, **path length**, and **subpath count** (number of `z` commands in the path definition).

- **Colors:**
  - `GREEN_FILL (#bfe8c1)`: Original color for frames, borders, and teardrops.
  - `BLACK_FILL (#231f20)`: Original color for calligraphy, numerals, and ornaments.

- **Criteria:**
  - **Border & Frame:** Green paths with multiple subpaths.
  - **Teardrop Medallions:** Green paths with single subpaths and medium length.
  - **Arabic Body Text:** The single largest black path on the page.
  - **Teardrop Labels:** Complex black paths (Juz/Hizb info) inside side teardrops.
  - **Verse Numerals:** Small black paths with no internal subpaths.
  - **Surah/Juz Headers:** Medium-length black paths at the top.

### 2. Detection Logic (`detectSVGLayers`)
The detector performs a single pass over all paths:
1.  **Metadata Extraction:** Calculates length and subpath count for every `<path>`.
2.  **Layer Assignment:** Iteratively assigns paths to layers based on the priority:
    -   `borderFrame` -> `teardrop` -> `arabicText` -> `teardropLabel` -> `verseNumerals` -> `surahHeader` -> `pageNumber`.
3.  **Element Tagging:** Each element is labeled with a `data-layer-type` attribute for easy CSS targeting and debugging.

### 3. Theme Subsystem (`LAYER_COLORS`)
The system supports multiple premium themes out of the box:
-   **Original:** Classic Medina Mushaf aesthetics.
-   **Sepia:** Warm, high-contrast palette for reduced eye strain.
-   **Night:** Dark mode optimized for low-light reading.
-   **Green:** Traditional emerald aesthetics with improved clarity.

## Integration Points

### rendering Engine (`js/spread_engine.js`)
When a new SVG is loaded (either from cache or network), the engine immediately calls:
```javascript
window.processSVGLayers(svgEl, theme);
```
This ensures that "ghost" pages (newly loaded) match the current application theme instantly.

### Theme Management (`js/app.js`)
When the user changes the page theme via the UI, the application triggers a global update:
```javascript
window.updateSVGLayerTheme(newTheme);
```
This function broadcasts the change to all visible SVG containers (main card and spread view columns).

## Technical Implementation Details
- **Stroke Enhancement:** For `verseNumerals`, the system applies a matching stroke (`stroke-width: 0.5`) to ensure readability across all themes and resolutions.
- **Performance:** Detection is performed once per SVG load and cached via DOM attributes. Theme updates are efficient, only modifying styles of previously identified layers.
- **Robustness:** The system uses `.quran-page-svg-container` and other shared selectors to find SVG elements regardless of which view (Card vs Spread) is active.
