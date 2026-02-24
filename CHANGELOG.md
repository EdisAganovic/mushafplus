# Changelog

All notable changes to the Mushaf Plus project will be documented in this file.

## [0.0.3] - 2026-02-24

### Added

- **Formal Build System**: Initialized `package.json` and installed Tailwind CSS v3 locally. This allows for proper recompilation of the design system, ensuring all new design classes (like `hidden md:flex`) are correctly generated and visible in the production build.

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
