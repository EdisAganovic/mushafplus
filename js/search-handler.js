/**
 * @file search-handler.js
 * @description SEARCH FUNCTIONALITY
 * Handles search input, debouncing, result rendering, and navigation.
 */

// Debounce timers map for multiple search inputs
const searchDebounceTimers = new Map();

/**
 * HTML escape helper to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Highlights search query in text with XSS protection
 */
function highlightMatch(text, query) {
  if (!text) return "";
  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(query.trim());
  const safeRegex = new RegExp(
    `(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return escapedText.replace(
    safeRegex,
    `<strong style="background-color: rgba(16, 185, 129, 0.3); color: #6ee7b7; padding: 0 4px; border-radius: 4px;">$&</strong>`
  );
}

/**
 * Renders search results to the DOM
 */
function renderSearchResults(results, listEl, containerEl, emptyEl, inputEl) {
  listEl.innerHTML = "";
  
  if (results.length === 0) {
    emptyEl?.classList.remove("hidden");
    containerEl?.classList.remove("hidden");
    return;
  }
  
  emptyEl?.classList.add("hidden");

  results.forEach((res) => {
    const item = document.createElement("div");
    item.className = "p-3 hover:bg-slate-800 border-b border-slate-800 cursor-pointer transition-colors search-result-item";

    const arHighlighted = highlightMatch(res.textAr, inputEl.value);
    const bsHighlighted = highlightMatch(res.textBs, inputEl.value);
    const surahNameSafe = escapeHtml(res.surahName);

    item.innerHTML = `
      <div class="flex justify-between items-center mb-1">
        <span class="text-xs font-bold text-emerald-500">${surahNameSafe} ${res.surahId}:${res.ayahId}</span>
      </div>
      <div class="text-sm text-slate-200 line-clamp-2 leading-relaxed" dir="rtl">${arHighlighted}</div>
      <div class="text-[11px] text-slate-400 mt-1 truncate">${bsHighlighted}</div>
    `;
    
    item.onclick = () => {
      containerEl?.classList.add("hidden");
      if (typeof closeModal === "function") closeModal("search-modal");
      inputEl.value = "";
      
      if (els.surahSelect) els.surahSelect.value = res.surahId;
      AppState.currentSurah = AppState.data.find((s) => s.id === res.surahId);
      AppState.currentAyahIndex = res.ayahIndex;
      localStorage.setItem("last_surah", res.surahId);
      localStorage.setItem("last_ayah_index", res.ayahIndex);
      
      if (typeof renderAyah === "function") renderAyah();
      if (typeof updateGridCellState === "function") {
        updateGridCellState(AppState.currentAyahIndex);
      } else if (typeof renderAyahGrid === "function") {
        renderAyahGrid();
      }
      if (typeof updateProgress === "function") updateProgress();
    };
    
    listEl.appendChild(item);
  });
  
  containerEl?.classList.remove("hidden");
}

/**
 * Handles search input with debouncing
 */
window.handleSearchInput = function(query, inputEl, containerEl, listEl, emptyEl) {
  if (!window.searchWorker) {
    window.searchWorker = new Worker("js/searchWorker.js");
    window.searchWorker.postMessage({ type: "init", data: AppState.data });
  }

  // Clear existing timer for this specific input
  const existingTimer = searchDebounceTimers.get(inputEl);
  if (existingTimer) clearTimeout(existingTimer);

  if (query.trim().length < 2) {
    containerEl?.classList.add("hidden");
    return;
  }

  // Set new timer for this specific input
  const timer = setTimeout(() => {
    window.searchWorker.onmessage = function(e) {
      if (e.data.type === "results") {
        renderSearchResults(e.data.results, listEl, containerEl, emptyEl, inputEl);
      }
    };

    window.searchWorker.postMessage({ type: "search", query: query });
  }, 300);

  // Store timer for this specific input
  searchDebounceTimers.set(inputEl, timer);
};

/**
 * Hides search results when clicking outside
 */
function hideSearchOnClickOutside() {
  document.addEventListener("click", (e) => {
    if (
      els.searchInput &&
      !els.searchInput.contains(e.target) &&
      els.searchResultsContainer &&
      !els.searchResultsContainer.contains(e.target)
    ) {
      els.searchResultsContainer.classList.add("hidden");
    }
    if (
      els.searchInputMobile &&
      !els.searchInputMobile.contains(e.target) &&
      els.searchResultsContainerMobile &&
      !els.searchResultsContainerMobile.contains(e.target)
    ) {
      els.searchResultsContainerMobile.classList.add("hidden");
    }
  });
}

/**
 * Initializes search input handlers for all search fields
 */
window.initSearchHandlers = function() {
  if (els.searchInput) {
    els.searchInput.oninput = (e) =>
      handleSearchInput(
        e.target.value,
        els.searchInput,
        els.searchResultsContainer,
        els.searchResultsList,
        els.searchEmptyState
      );
  }

  if (els.searchInputMobile) {
    els.searchInputMobile.oninput = (e) =>
      handleSearchInput(
        e.target.value,
        els.searchInputMobile,
        els.searchResultsContainerMobile,
        els.searchResultsListMobile,
        els.searchEmptyStateMobile
      );
  }

  if (els.searchInputModal) {
    els.searchInputModal.oninput = (e) => {
      handleSearchInput(
        e.target.value,
        els.searchInputModal,
        { classList: { remove: () => {}, add: () => {} } },
        els.searchResultsListModal,
        els.searchEmptyStateModal
      );
    };
  }

  // Hide search when clicking outside
  hideSearchOnClickOutside();
};
