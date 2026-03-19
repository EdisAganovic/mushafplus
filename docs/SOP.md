# Standard Operating Procedures (SOP) - Add/Modify Features Safely

**Purpose:** Guide LLMs when adding/modifying features to prevent breaking existing functionality.

## 🔴 CRITICAL: Before Making ANY Changes

### 1. Validate Data Integrity
LLM MUST verify these first:
```javascript
// Check config.js is loaded properly
console.assert(window.QURAN_DATA && Array.isArray(window.QURAN_DATA));
console.assert(window.els && typeof els !== 'undefined');
```

### 2. Understand the Data Flow Path
Any feature change must account for this sequence:

```
User Action → index.html (event) 
  → app.js (init/setup) 
  → Module Handler (audio/render/actions/ui-state, etc.) 
  → config.AppState (state update) 
  → localStorage (persistence via actions.js) 
  → Service Worker (offline cache)
```

### 3. Module Load Order (index.html <script> tags matter!)
**REQUIRED ORDER:**
1. config.js (AppState + DOM refs) ⭐️ MUST LOAD FIRST
2. i18n.js
3. quranMeta.js  
4. [Other modules in any order after these]

**Why?** `window.AppState` and `window.els` are only available after config.js loads.

---

## 🧩 Module Interaction Rules

### File: app.js (ORCHESTRATOR)
**Role:** Entry point, coordinates everything  
**Can You Add Logic Here?** ❌ NO - except in these specific functions:
- `init()` - Only startup sequencing
- `loadSurah()` - Surah-specific initialization
- `setupEventListeners()` - Event wiring only

**Must Import First:** config.js  
**Outputs To:** AppState, localStorage (via actions.js)

---

### File: config.js (STATE MANAGER)
**Role:** Global AppState + DOM element registry  
**Can You Add Logic Here?** ⚠️ ONLY these patterns:
```javascript
// 1. New state field (safe)
AppState.newState = defaultValue;

// 2. New DOM ref lookup (safe)
els.newButton = document.getElementById('new-button');

// 3. New constant in QURAN_CONSTANTS (safe)
QURAN_CONSTANTS.NEW_LIMIT = 100;
```

**What to AVOID:**
- ❌ Modifying existing AppState properties without checking first
- ❌ Deleting/overwriting DOM refs
- ❌ Changing localStorage key names

---

### File: audio.js (AUDIO ENGINE)
**Role:** Sheikh playback + user recording  
**Safe Addition Points:**
```javascript
// ✅ Add new audio source handler
async function playNewAudioSource(url) { ... }

// ✅ Extend existing config object safely
function getSupportedMimeType() {
  const types = [...existingTypes, "new/mime/type"];
}
```

**Critical Boundaries:**
- Must respect `AppState.mediaRecorder` lifecycle
- Must call `config.safeSetStorage()` for persistence
- Must handle MIME type fallbacks (audio/mp4 → audio/webm)
- **NEVER** modify the MediaStream object directly - always through existing methods

---

### File: render.js (DOM MANAGER)
**Role:**ayah cards, grids, animations  
**Safe Addition Points:**
```javascript
// ✅ Add new UI element to existing container
function createNewUIElement() {
  els.sidebarContainer.appendChild(document.createElement(...));
}
```

**Critical Boundaries:**
- **NEVER** modify QuranData directly (immutable)
- Must use `updateUI()` for consistency
- Must respect virtual scroll cleanup (cleanup() method at line 89)
- **ALWAYS** check if element exists before updating:
  ```javascript
  if (els.targetElement && els.targetElement.style) { ... }
  ```

---

### File: actions.js (PERSISTENCE MANAGER)
**Role:** localStorage operations  
**Safe Addition Points:**
```javascript
// ✅ Wrap existing operations in safe storage
function toggleNewFeature(id, active) {
  const state = getState();
  return safeSetStorage("quran_new", newMap);
}
```

**CRITICAL RULE:** 
- **ALL localStorage operations MUST go through `safeSetStorage()`**
- Never call localStorage.setItem() directly in any module
- Must handle quota warnings via config.js monitoring

---

## 🔄 Data Flow Patterns

### Pattern 1: User Action → State Update → UI Refresh
```javascript
// Example: Click on bookmark button
els.bookmarkBtn.addEventListener('click', () => {
  toggleBookmark(currentAyah); // actions.js
  updateUI(); // render.js - refreshes badge/grid
});
```

### Pattern 2: AppState Read-Only Access
```javascript
// Safe read from any module
const count = AppState.checkedAyats.size;
const theme = AppState.settings.theme;
```

### Pattern 3: Write to AppState
```javascript
// Only modules with specific responsibility can modify
audio.playSheikhAudio() → AppState.currentSurah, currentAyahIndex
render.updateUI() → NO state writes (read-only)
actions.toggleBookmark() → localStorage write via safeSetStorage()
```

---

## ⚠️ Common Breaking Change Patterns to Avoid

### Pattern 1: Direct DOM Manipulation Without Config
```javascript
// ❌ WRONG - may conflict with existing refs
const btn = document.getElementById('bookmark');

// ✅ CORRECT - use config registry
els.bookmarkBtn.classList.toggle('active');
```

---

### Pattern 2: Modifying State Without Triggering Update
```javascript
// ❌ WRONG - UI won't refresh
 AppState.data.someField = newValue;

// ✅ CORRECT - also call updateUI or trigger relevant method
AppState.something = value; 
render.updateUI(); // or appropriate method
```

---

### Pattern 3: Adding localStorage Keys Without Monitoring
```javascript
// ❌ WRONG - may hit quota silently
localStorage.setItem("quran_newfeature", jsonString);

// ✅ CORRECT - always use safeSetStorage with monitoring
safeSetStorage("quran_newfeature", jsonString); // triggers quota check
```

---

### Pattern 4: Missing Error Boundary Checks
```javascript
// ❌ WRONG - crashes if AppState undefined
const theme = AppState.settings.theme;

// ✅ CORRECT - guard with null checks
function getTheme() {
  return AppState?.settings?.theme || 'emerald';
}
```

---

## 🧪 Pre-Commit Checklist (LLM MUST PERFORM)

Before "committing" (modifying files), verify:

### ✅ Module Integrity Checks
- [ ] config.js not modified unless adding truly new state/refs
- [ ] AppState properties not renamed or deleted
- [ ] localStorage keys follow pattern: `quran_*`
- [ ] All DOM refs prefixed with `els.` and in config registry

### ✅ Integration Points
- [ ] Functions respect module boundaries (no crossing file lines)
- [ ] Event listeners use proper cleanup (removeEventListener calls)
- [ ] Blob URLs cleaned up when no longer needed (audio.js pattern)
- [ ] Debouncing used for heavy operations if timing-sensitive

### ✅ Error Handling
- [ ] New code wrapped in try-catch or existing ErrorBoundary
- [ ] Fallback provided for missing AppState/els refs
- [ ] No direct `console.error()` - use structured logging pattern

### ✅ State Consistency
- [ ] UI updates sync with AppState changes
- [ ] localStorage reads match current app state
- [ ] No race conditions (checkAppState() guards if needed)

---

## 📝 Adding a New Feature: Step by Step

### Example: "Add Night Mode Toggle"

#### Step 1: Check existing patterns
```bash
# Search for similar toggle implementations
grep -r "darkMode\|toggleTheme" js/
```

#### Step 2: Update config.js if needed
```javascript
// Add to state
AppState.settings.nightMode = false;

// Add storage key (follows pattern)
safeSetStorage("quran_nightMode", isNight);
```

#### Step 3: Update i18n.js  
```javascript
translationStrings: {
  ...existing,
  nightModeLabel: "Noćni način",
  moonIcon: "🌙"
}
```

#### Step 4: Add UI in index.html using data-i18n
```html
<button id="btn-night-toggle" 
        class="bg-gray-700 text-white px-4 py-2 rounded"
        data-i18n-title="nightModeLabel">🌙</button>
```

**Register in config.js:**
```javascript
els.nightToggle = document.getElementById('btn-night-toggle');
```

#### Step 5: Add event handler (add to appropriate module)
```javascript
// In actions.js or event setup function
function toggleNightMode() {
  const isNight = !AppState.settings.nightMode;
  AppState.settings.nightMode = isNight;
  
  safeSetStorage("quran_nightMode", isNight);
  updateUI(); // Refresh icons/colors
  
  // Apply theme class to body
  if (isNight) document.body.classList.add('night');
  else document.body.classList.remove('night');
}

els.nightToggle?.addEventListener('click', toggleNightMode);
```

#### Step 6: Update render.js for visual changes
```javascript
function updateUI() {
  // ... exist
