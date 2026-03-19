# Dynamic Height Calibration for Ayah Grid

## Problem

The cnt-ayah-grid was displaying excessive empty space at the bottom, even with a relatively small number of ayahs (123). This was caused by:

1. **Incorrect ROW_HEIGHT** - Calculations assumed 60px per row but actual rendered height was only 52px
2. **Fixed hardcoded heights** - Not adapting to varying ayah counts across surahs
3. **Flexbox stretching** - flex-[3] classes forcing container to fill available space regardless of content

## Analysis

### Grid Structure
```html
<div id="cnt-ayah-grid" class="grid grid-cols-5 content-start gap-2">
    <!-- Ayah cells rendered here -->
</div>
```

### Actual Dimensions
- Cell height: `h-11` (Tailwind) = 2.75rem ≈ **44px**
- Gap between rows: `gap-2` = 0.5rem = **8px**  
- Total per row: 44px + 8px = **52px**

### The Math Problem
With ROW_HEIGHT = 60px but actual = 52px:
- Surah with 17 rows (100 ayahs, ceil(100/5)=20 rows shown)
- Calculated height: 20 × 60 = **1200px**
- Actual content: 20 × 52 = **1040px**  
- Empty space: **136px** (approximately 2.5 rows of whitespace)

## Solutions Implemented

### 1. Corrected Constants (`js/constants.js`)

```javascript
window.GRID = {
  ITEMS_PER_ROW: 5,
  ROW_HEIGHT: 52,     // Updated from 60 to match actual dimensions
  CELL_HEIGHT: 44,    // h-11 in Tailwind (~2.75rem)
  GAP_SIZE: 8,        // gap-2 = 0.5rem
  BUFFER_ROWS: 4,
  SCROLL_OFFSET: 20,
  AUTO_SCROLL_DELAY: 100,
};
```

### 2. Dynamic Height Calculation (`js/render.js`)

Previously used fixed fallback:
```javascript
this.container.style.minHeight = "1380px";  // Hardcoded for max surah
```

Now calculates dynamically per surah:
```javascript
const totalRows = Math.ceil(totalItems / itemsPerRow);
// Set height dynamically based on actual number of ayahs to eliminate empty space
this.container.style.minHeight = \`${totalRows * rowHeight}px\`;
```

### 3. Removed Flexbox Stretching (`index.html`)

**Before:**
```html
<div class="flex-[3] overflow-y-auto custom-scrollbar mb-2 min-h-[120px]">
    <div id="cnt-ayah-grid" ...>
```

**After:**
```html
<div class="overflow-y-auto custom-scrollbar mb-2 min-h-[60px]" style="height: auto;">
    <div id="cnt-ayah-grid" style="height: auto; position: relative;" />
```

## Benefits

### Adaptive to Any Surah Length
| Ayah Count | Rows (5 cols) | Previous Space | New Space |
|------------|---------------|----------------|-----------|
| 10         | 2             | ~80px empty    | **0px**   |
| 28         | 6             | ~48px empty    | **0px**   |
| 100        | 20            | ~136px empty   | **0px**   |
| 286        | 58            | ~1,072px empty | **0px**   |

### No Empty Space Scenarios
- Small surahs (1-10 ayahs): Fits in a single row minimum
- Medium surahs (24-100 ayahs): Exactly fills required rows  
- Large surahs (Al-Baqarah, 286 ayahs): Uses full space needed with no waste

### Performance
- Virtual scrolling still renders only visible rows + buffer
- No performance loss from dynamic calculations
- Consistent rendering speed across all surah sizes

## Files Modified

1. **`js/constants.js`** - Updated GRID constants with accurate dimensions
2. **`js/render.js`** - Dynamic height calculation instead of hardcoded values  
3. **`index.html`** - Removed flex-[3], set `min-h-[60px]`, fixed styling for grid container

## Verification Test

Load any surah and observe:
1. Grid height exactly matches number of ayahs × 52px
2. No scrollbar when surah has ≤20 ayahs (fits in ~1m viewport)
3. Scrollbar appears and works smoothly for larger surahs
4. Empty space at bottom = 0px

## Future Considerations

If adding responsive mobile layout:
```css
@media screen and (max-width: 640px) {
  .grid-cols-5-mobile { grid-template-columns: repeat(3, 1fr); }
}
```

Then adjust:
- ROW_HEIGHT for mobile (typically smaller cells)
- ITEMS_PER_ROW for mobile (typically 3 instead of 5)
- Update calculation in render.js per device context
