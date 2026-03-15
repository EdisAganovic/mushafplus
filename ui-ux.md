# Mushaf Plus UI/UX Layout Specification

This document serves as the ground truth for positioning key UI elements across different screen sizes. All future modifications should adhere to these patterns.

## 1. Main Action Toolbar (`#main-action-toolbar`)
This is the primary interaction bar containing "Prev", "Record", "Valid", "Bookmark", and "Next".

| Viewport | Positioning Mode | Vertical Anchor | Parent Container |
| :--- | :--- | :--- | :--- |
| **Desktop** (>=768px) | `relative` / Static | Flow after audio players | `#desktop-toolbar-placeholder` (inside `.ayah-card`) |
| **Mobile** (<768px) | `fixed` | `bottom: 5.5rem` | `document.body` (placed before `#mobile-bottom-nav`) |

### Relocation Logic
The `window.relocateToolbar()` function in `js/render.js` dynamically moves this element in the DOM to ensure reliable fixed positioning on mobile (avoiding parent `transform` clipping) and natural document flow on desktop.

## 2. Audio Recitation & Recording Players
| Element | Position | Visibility |
| :--- | :--- | :--- |
| `#ayah-audio-container` | Inside `.ayah-card` | Persistent (Top of vertical stack) |
| `#user-audio-container` | Inside `.ayah-card` | Toggle based on recording state |

On desktop, the `#main-action-toolbar` should sit **directly below** these players.

## 3. Bismillah Header (`#bismillah-display`)
*   **Condition**: Visible only when `AppState.currentAyahIndex === 0`.
*   **Exceptions**:
    *   **Surah 1 (Al-Fatiha)**: Hidden (Bismillah is part of Verse 1).
    *   **Surah 9 (At-Tawbah)**: Hidden (No Bismillah).

## 4. Mobile Bottom Navigation (`#mobile-bottom-nav`)
*   **Visibility**: `md:hidden` (Desktop: Hidden, Mobile: Visible).
*   **Position**: `fixed`, `bottom: 0`, `left: 0`, `right: 0`.
*   **Styling**: High blur (`backdrop-blur-md`), dark slate background.

## 5. View Modes (Ayah vs Spread)
State: `AppState.settings.spreadMode`

| Mode | Active Container | Rendering Engine | Focus |
| :--- | :--- | :--- | :--- |
| **Standard** | `#ayah-card` | `js/render.js` | Focused study / repetition |
| **Spread** | `#spread-card` | `js/spread_engine.js` | Reading flow (Side-by-side SVG) |

---
*Last updated: 2026-03-15*
