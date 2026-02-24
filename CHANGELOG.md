# Changelog

All notable changes to the Mushaf Plus project will be documented in this file.

## [0.0.3] - 2026-02-24

### Added

- **Juz & Page Badges**: Added two new info badges next to the Ayah counter — Džuz number (sky blue) and page number in the Medina Mushaf (violet). Powered by a new `quranMeta.js` file containing the full Tanzil juz/page boundary tables.
- **Tajweed Rules Legend**: A live legend of tajweed rules present in the current ayah now appears directly below the Arabic text. Each rule is shown as a colored chip using the exact same colors as the in-text tajweed highlighting.
- **Tajweed Legend Setting**: New toggle in Settings — *"Nazivi tedžvidskih pravila"* — to show/hide the legend. Persisted to localStorage.
- **Tailwind Build Script**: Added `build-css.bat` — double-click to recompile `tailwind-output.css` without needing to open a terminal.
- **Formal Build System**: Initialized `package.json` and installed Tailwind CSS v3 locally for proper class generation.

### Changed

- **Tajweed Legend Position**: Legend rendered directly beneath Arabic text (above translation) for maximum contextual relevance.
- **Legend Chip Style**: Chips use `rounded-xl`, matching the button style in the Ayah card, with centered text and `whitespace-nowrap`.

## [0.0.2] - 2026-02-24

### Added

- **Search Highlighting**: Search results now include a visual emerald highlight on the matched query for both the Arabic text and Bosnian translation within the dropdown.
- **Swipe Tutorial Toast**: A one-time tutorial message (toast overlay) appears on first visit, indicating "Slijedeći ajet / Prethodni ajet" to teach users about the swipe capabilities.
- **Swipe Visual Cues**: Added brief screen-edge fading chevrons that appear seamlessly when an Ayah is swiped to provide subtle navigational feedback.

### Changed

- **Smart Search Ranking**: Completely overhauled search querying to include a scoring system. Exact, standalone whole-word matches (e.g., "svi") are now aggressively prioritized and appear at the top of the search results, followed by partial matches (e.g., where "svi" is inside "svijet").
- **Header Alignment**: Header internal layout has been restructured. The placement of the "Mushaf Plus" title and search bar now mathematically aligns with the true edges of the central Ayah card and the right-side gap. The dropdowns align perfectly with the width of the open sidebar, resolving visual balance issues on wider screens.
- **Swipe Mechanics**: Refined touch interaction logic so that swiping between Ayahs triggers a subtle animated CSS "nudge" effect on the central card element, improving the mobile feel.

### Fixed

- **Search Bar Visibility**: Fixed a bug on desktop views where the search input wrapper was disappearing completely due to a purged `md:flex` class. Allowed default `sm:flex` fallback.
