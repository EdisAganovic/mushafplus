# Changelog

All notable changes to the Mushaf Plus project will be documented in this file.

## [0.0.10] - 2026-02-27

### Added

- **Lebdeći mobilni meni**: Uvedena je nova navigacijska traka na dnu ekrana koja elegantno lebdi iznad sadržaja, omogućavajući brz i jednostavan pristup svim bitnim funkcijama aplikacije na pametnim telefonima.

### Fixed

- **Problem sa skrolanjem**: Riješen problem gdje je prevlačenje prsta za prijelaz na drugi ajet slučajno prekidalo vertikalno skrolanje po cijeloj stranici.
- **Mobilna navigacija**: Popravljeno zatvaranje sakrivenih izbornika ("Oznake", "Postavke") kada se ponovo klikne ista ikona na donjoj navigacijskoj traci.
- **Prekrivanje sadržaja**: Dodan prostor na dnu ekrana kako bi se spriječilo da mobilni meni prekriva audio kontrole.

## [0.0.9] - 2026-02-27

### Added

- **Mobilna navigacija**: Dodan potpuno novi "Zapamćeno" (Bookmarks) izbornik (drawer) koji se izvlači sa strane specijalno za mobilne uređaje, te novi interaktivni "Traži" (Search) modal preko cijelog ekrana.
- **Naziv Sure**: Dodan dinamični prikaz imena trenutne sure iznad navigacijskih polja (Brzi skok) kako bi korisnici u svakom trenutku znali gdje se nalaze na prvi pogled.
- **Instalacija (PWA)**: Aplikacija sada podržava instalaciju na telefone i računare (Progressive Web App) i može raditi offline bez interneta nakon prvog otvaranja.
- **Tedžvid objašnjenja**: Klikom na nazive pojedinačnih tedžvidskih pravila (npr. Medd, Gunna) u legendi ispod teksta, sada se prikazuje elegantan oblačić sa objašnjenjem pravila.
- **Automatsko osvježavanje (PWA)**: Aplikacija automatski prepoznaje nove verzije u pozadini i nudi neporecivo dugme 'Osvježi' na dnu ekrana sa popravljenom logikom za trenutnu nadogradnju.
- **Postavke bilješki**: Korisnici sada mogu isključiti polje za "Lične bilješke" u postavkama ukoliko ga ne koriste, čime se dobija čistiji izgled ekrana.

### Fixed

- **Reciter Label Sync**: Riješen problem gdje se ime odabranog učača nije ispravno prikazivalo u audio plejeru pri pokretanju aplikacije. Sada se ime učača automatski učitava i osvježava pri svakoj promjeni.

## [0.0.8] - 2026-02-26

### Fixed

- **Firefox Rendering**: Riješen problem odsijecanja arapskih znakova (Yaa itd.) u Firefoxu.
- **Tedžvid boje**: Implementiran **CSS Custom Highlight API** za precizno dodavanje Tedžvid boja bez sjeckanja riječi na `span` elemente u DOM-u, čime je očuvano originalno ligaturno spajanje slova (shaping).

## [0.0.7] - 2026-02-25

### Improved

- **Tajweed Tooltips**: Reduced the font size and padding of the tajweed tooltips (which appear on hover over colored tajweed rules) to make them look more elegant and less intrusive on smaller screens.
- **Dynamic Versioning**: Changed the HTML file to use a static JavaScript variable to version all included CSS and JS files, replacing hardcoded cache-busting `?v=` tags.

## [0.0.6] - 2026-02-25

### Added

- **Last Read Ayah Memory**: The application now remembers the exact Ayah you were reading. Upon reopening the app or refreshing the page, it will automatically navigate back to your last viewed Ayah instead of starting from the beginning of the Surah.
- **About Modal**: New "O aplikaciji" button in the Settings drawer opens a modal showing author credits (Edis Aganović / N-UM.com), collaborator (Zehrina Buljubašić, prof.), and Qur'an translation credit (Muhammed Mehanović, prof.).
- **Version & Changelog Modal**: New "Verzija" button in Settings opens a scrollable modal displaying the full version history in user-friendly Bosnian, with color-coded tags for new features, improvements, and fixes.
- **Modal System**: Reusable modal overlay system with blurred backdrop, slide-up animation, close-on-X, close-on-overlay-click, and Escape key support.

### Changed

- **Corrected Surah Translation Names**: Updated 37 Bosnian translation names for Surahs to match authoritative Bosnian Islamic terminology (e.g., "Otvaranje" → "Pristup", "Rimljani" → "Bizantinci", "Razlikovanje" → "Furkan", "Sedžda" → "Padanje ničice", "Vlakno" → "Plamen").

### Fixed

- **Arabic Text Clipping (YAA + Tashdeed)**: Fixed a rendering issue where Arabic letters with descenders (like YAA ي) combined with stacked diacritics (shadda ّ) were visually clipped. Added `overflow: visible` to `.quran-text` and `.quran-word` elements to prevent the browser from cutting off character parts.

## [0.0.5] - 2026-02-24

### Added

- **Zero-Latency Audio Preloading**: Implemented an intelligent background preloading mechanism that silently fetches the next Ayah's audio while the current one plays, ensuring perfectly seamless playback transitions without network delays.
- **Search Web Worker**: Extracted the heavy text searching functionality into a dedicated background Web Worker (`searchWorker.js`), ensuring the UI and css animations remain perfectly smooth (60 FPS) while querying the 6,200+ Ayah dataset.
- **Tajweed Token Caching**: Added memory caching for the expensive Tajweed regex tokenization process, resulting in instantaneous highlights when revisiting previously rendered Ayahs.
- **Integrated Ayah Navigation**: The Ayah counter on the main card is now an interractive input field, allowing users to jump to any Ayah in the current Surah instantly.
- **Smart Focus UX**:
  - **Auto-Clear on Focus**: Clicking any navigation badge (Ayah, Juz, Page) automatically clears the field for immediate typing.
  - **Auto-Restore on Blur**: If a field is left empty, it automatically restores the previous value to maintain UI consistency.

### Changed

- **O(1) Grid Updates**: Refactored the Ayah Grid sidebar rendering logic. Interactions like navigating, checking, or bookmarking an Ayah now perform a targeted, O(1) DOM class toggle on a single DOM node instead of destroying and rebuilding the entire 286-node grid, completely eliminating layout thrashing.
- **Debounced LocalStorage I/O**: Replaced blocking, synchronous `localStorage` saves with a custom `requestIdleCallback` queued saving mechanism. Frequent actions like typing long notes or spam-clicking checks now save asynchronously, fully unblocking the main browser thread.
- **Refined Navigation Design**: Overhauled the Ayah card navigation badges (Ajet, Džuz, Str.) for a more balanced and premium look:
  - **Standardized Typography**: Uniform font sizes across all labels and inputs.
  - **Modern Geometry**: Switched from `rounded-full` to a more professional `rounded-xl` corner radius.
  - **Mobile Optimized Gaps**: Tightened internal spacing and horizontal gaps to ensure the navigation row fits perfectly on smaller screens.
- **Header Layout Fixes**: Restructured the header HTML to fix alignment issues and expanded the search results width for better readability.

### Fixed

- **UI Translation Completeness**: Discovered and connected multiple hardcoded HTML UI labels (Džuz, Str., Ajet, Recitacija) to the robust `i18n.js` translation ecosystem.
- **Dynamic Tooltips**: Expanded the `i18n.js` engine to support scanning and translating raw HTML `title` attributes (`data-i18n-title`) for hover tooltips.
- **Cache Busting Strategy**: Enforced strict `?v=0.0.5` query-string versioning across all static asset payloads (CSS, Scripts, JSON data) to guarantee existing users receive new translation strings and features without needing to perform manual hard-refreshes.
- **Firefox Caching Issues**: Implemented CSS versioning (`?v=1.0.4`) to force browsers to reload the latest styles, resolving rendering bugs in Firefox.
- **Tajweed Arabic Rendering**: Fixed a critical bug where applying Tajweed tooltips caused Arabic letters within a single word to visibly break apart and disconnect. Tooltips now use a global fixed-positioning system that completely preserves native font ligatures.
- **Tooltip Text Wrapping**: Fixed awkward line breaks in the Tajweed rule descriptions. Tooltips now feature a responsive layout with increased width, smooth modern wrapping, and boundary collision detection.

## [0.0.4] - 2026-02-24

### Added

- **Minimalist Juz & Page Navigation**: Jump to any Juz (1-30) or Page (1-604) directly from the header via input boxes.
  - **Smart Auto-Jump**: Debounced input that automatically navigates to your selection after typing (no Enter required).
  - **Instant Input Sync**: Typing in the Juz box instantly calculates the starting Page, and vice-versa, keeping your position context always clear.
- **Hifz Mode (Memorization)**: A dedicated mode for looping specific Ayah ranges. Select a start and end Ayah, enable Auto-play, and the app will continuously loop within your selection.
  - **Auto-Navigation**: Automatically jumps to the first Ayah of the range once selection is finished.
  - **Red Selection Theme**: Hifz range highlights and toggles now use a consistent Rose/Red theme to distinguish from normal navigation.
- **Remote Reciters (EveryAyah)**: Access multiple world-class reciters (Mishary Alafasy, Al-Sudais, Al-Husary, Al-Muaiqly, ash-Shuraym) in the Settings to stream high-quality audio directly from EveryAyah.com.
- **Dynamic Reciter Display**: The audio player UI now shows the name of the currently selected reciter (e.g., "Mishary Alafasy") instead of a static "Recitacija" label.

### Changed

- **Detailed Progress Tracking**: The sidebar progress label now shows the exact count of recited Ayahs versus the total (e.g., "12 / 114") instead of a generic percentage. Localized label to "Proučeno ajeta".
- **Clean Ayah Grid Design**: Completely redesigned the Ayah sidebar grid for better readability and precision:
  - **Pill-shaped Cells**: Larger, accessible button-style cells with a fixed 5-column grid alignment.
  - **Active Ayah Indicator**: New "Border-only" theme-colored highlight (Emerald) to keep focus without overwhelming with background colors.
  - **Dot-based Markers**: Replaced heavy icons with minimalist colored dots (Red = Hifz, Amber = Juz, Blue = Page).
  - **Automatic Vertical Layout**: If an Ayah has markers, the layout automatically stacks them vertically to maintain alignment and prevent overflow.
- **Color Consistency**: Synchronized Juz (Amber) and Page (Blue) indicator colors across the entire UI, including header inputs, info badges, and grid legend.

## [0.0.3] - 2026-02-24

### Added

- **Juz & Page Badges**: Added two new info badges next to the Ayah counter — Džuz number (sky blue) and page number in the Medina Mushaf (violet). Powered by a new `quranMeta.js` file containing the full Tanzil juz/page boundary tables.
- **Tajweed Rules Legend**: A live legend of tajweed rules present in the current ayah now appears directly below the Arabic text. Each rule is shown as a colored chip using the exact same colors as the in-text tajweed highlighting.
- **Tajweed Legend Setting**: New toggle in Settings — _"Nazivi tedžvidskih pravila"_ — to show/hide the legend. Persisted to localStorage.
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
