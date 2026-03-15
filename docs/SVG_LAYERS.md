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
  - **Surah Band Text:** White calligraphy rendered inside search band frames.

### 2. Detection Logic (`detectSVGLayers`) — V4 Top-Down
The system uses a hierarchical approach rather than simple path heuristics:
1.  **Metadata Extraction:** Calculates path length, loop count (`z`), and vertical translation (`ty`) for every element.
2.  **Semantic Container Identification:** Identifies major `<g>` groups under `g10` (Green frame group, Special group, Numeral group, Text group).
3.  **Group Classification:** 
    -   **Green Containers:** Processed for `borderFrame`, `surahBand`, and `teardrop` backgrounds.
    -   **Black Containers:** Classified based on path count and total length. "Body Text" is identified if paths > 10 or total length is huge, solving the "per-word" encoding issue.
4.  **Positional Detection:** Uses `ty` (Y-translation) to distinguish `surahHeader` (top) from `pageNumber` (bottom) when they reside in the same group.
5.  **Element Tagging:** Elements are labeled with `data-layer-type` attributes for CSS targeting.

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
- **Fill Rule Override:** For background elements (`teardrop`, `surahBand`, `bigTeardrop`), the system overrides `evenodd` with `nonzero` to ensure solid color filling and prevent transparent "holes" from the original SVG cutouts.
- **Performance:** Detection is performed once per SVG load and cached via DOM attributes. Theme updates are efficient, only modifying styles of previously identified layers.
- **Robustness:** The system uses `.quran-page-svg-container` and other shared selectors to find SVG elements regardless of which view (Card vs Spread) is active.
