/**
 * @file spread_engine.js
 * @description Logic for side-by-side spread view using SVG data.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Aggressive pre-caching of adjacent pages
 * - Non-blocking render with cached-first approach
 * - Progressive loading for uncached pages
 */

const PAGE_SVG_CACHE = new Map();
const PAGE_LOAD_QUEUE = new Set(); // Track pages being loaded

// MINOR FIX #1: Constants for magic numbers
const MAX_PAGE = 604;
const MIN_PAGE = 1;
const SVG_PATH = "assets/optimized";

/**
 * Pre-processes an SVG string to prevent ID collisions.
 * Optimized with single-pass regex replacements.
 */
function preprocessSvg(svgText, pageNum) {
  const prefix = `p${pageNum}-`;

  // Single-pass replacements for better performance
  let processed = svgText
    .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
    .replace(/xlink:href="#([^"]+)"/g, `xlink:href="#${prefix}$1"`)
    .replace(/fill="#231f20"/gi, 'class="quran-svg-text"');

  // Optimized path processing
  processed = processed.replace(
    /<path([^>]+)fill="#bfe8c1"([^>]*)\/>/gi,
    (match) => {
      const className = match.length > 3000 ? "quran-svg-border" : "quran-svg-ayah-frame";
      return match.replace(/fill="#bfe8c1"/i, `class="${className}"`);
    }
  );

  processed = processed.replace(/<svg([^>]*)>/, (match, p1) => {
    const updated = p1.replace(/\s(width|height)="[^"]*"/g, '');
    return `<svg${updated} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="shape-rendering:geometricPrecision;">`;
  });

  return processed;
}

/**
 * Aggressively prefetches pages around current position.
 * Uses priority loading: closer pages first.
 * @param {number} pageNum - Current page number
 */
window.prefetchAdjacentPages = function(pageNum) {
  // Priority order: immediate neighbors first, then next ones
  const pagesToPrefetch = [
    pageNum + 1, pageNum - 1,  // Immediate neighbors (highest priority)
    pageNum + 2, pageNum - 2,  // Next adjacent
    pageNum + 3, pageNum - 3   // Further pages (lower priority)
  ].filter((p) =>
    p >= MIN_PAGE && p <= MAX_PAGE &&
    !PAGE_SVG_CACHE.has(p) &&
    !PAGE_LOAD_QUEUE.has(p)
  );

  // Load with priority (closer pages first)
  pagesToPrefetch.forEach((p, index) => {
    PAGE_LOAD_QUEUE.add(p);

    // Stagger requests to avoid network congestion
    setTimeout(() => {
      const paddedPage = String(p).padStart(3, "0");
      const svgUrl = `${SVG_PATH}/${paddedPage}.svg`;

      fetch(svgUrl, { priority: index < 2 ? 'high' : 'low' })
        .then((res) => res.ok ? res.text() : null)
        .then((text) => {
          if (text && !PAGE_SVG_CACHE.has(p)) {
            PAGE_SVG_CACHE.set(p, preprocessSvg(text, p));
          }
        })
        .catch(() => {})
        .finally(() => {
          PAGE_LOAD_QUEUE.delete(p);
        });
    }, index * 50); // 50ms stagger
  });
};

/**
 * Preloads critical pages on app startup.
 * Called once during initialization.
 */
window.preloadCriticalPages = function() {
  const criticalPages = [1, 2, 3, 604, 603, 602]; // First and last pages

  criticalPages.forEach((p) => {
    if (!PAGE_SVG_CACHE.has(p)) {
      const paddedPage = String(p).padStart(3, "0");
      const svgUrl = `${SVG_PATH}/${paddedPage}.svg`;

      fetch(svgUrl)
        .then((res) => res.ok ? res.text() : null)
        .then((text) => {
          if (text) PAGE_SVG_CACHE.set(p, preprocessSvg(text, p));
        })
        .catch(() => {});
    }
  });
};

/**
 * Renders skeleton loader for smooth page transition.
 * @param {HTMLElement} container
 */
function renderSpreadSkeleton(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="flex-1 flex flex-col items-center justify-center min-w-0 h-full p-4">
      <div class="w-full max-w-md aspect-[3:4] bg-slate-800/50 rounded-lg overflow-hidden">
        <div class="h-full w-full flex flex-col justify-between py-8 px-6">
          <div class="space-y-3">
            <div class="h-3 bg-slate-700/50 rounded w-3/4"></div>
            <div class="h-3 bg-slate-700/50 rounded w-full"></div>
            <div class="h-3 bg-slate-700/50 rounded w-5/6"></div>
          </div>
          <div class="space-y-2">
            <div class="h-2 bg-slate-700/50 rounded w-1/2 mx-auto"></div>
            <div class="h-2 bg-slate-700/50 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders error state for spread view.
 * @param {HTMLElement} container
 * @param {number} pageNum
 */
function renderSpreadError(container, pageNum) {
  if (!container) return;
  container.innerHTML = `
    <div class="flex-1 flex flex-col items-center justify-center min-w-0 h-full">
      <div class="text-rose-500 font-bold p-10 text-center">
        <div class="text-4xl mb-2">⚠️</div>
        <div>Stranica ${pageNum} nije pronađena</div>
        <div class="text-sm text-slate-400 mt-2">Provjerite internetsku vezu ili osvježite stranicu</div>
      </div>
    </div>
  `;
}

/**
 * Renders a single page column with optimized loading.
 * Returns cached content immediately, fetches if needed.
 */
async function renderPageColumn(pageNum, idx, isRight, progressBar) {
  const pageCol = document.createElement("div");
  pageCol.className = "flex-1 flex flex-col items-center min-w-0 h-full no-scrollbar opacity-0 transition-opacity duration-300 ease-out";

  // Start with skeleton loader
  renderSpreadSkeleton(pageCol);

  // Handle null/invalid pages
  if (pageNum === null || pageNum < MIN_PAGE || pageNum > MAX_PAGE) {
    pageCol.classList.add("hidden", "lg:flex", "invisible");
    return pageCol;
  }

  const pageCard = document.createElement("div");
  pageCard.className = `w-full bg-transparent shadow-none flex flex-col h-full`;

  const pageContent = document.createElement("div");
  pageContent.className = "flex-1 flex items-center justify-center quran-page-svg-container overflow-hidden";

  const paddedPage = String(pageNum).padStart(3, '0');
  const svgUrl = `${SVG_PATH}/${paddedPage}.svg`;

  // OPTIMIZATION: Check cache first (instant render)
  if (PAGE_SVG_CACHE.has(pageNum)) {
    pageContent.innerHTML = PAGE_SVG_CACHE.get(pageNum);
    pageCol.innerHTML = '';
    pageCol.appendChild(pageCard);
    pageCard.appendChild(pageContent);

    // Update progress bar
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.parentElement.classList.add('opacity-0');
    }

    // Trigger reflow for smooth animation
    requestAnimationFrame(() => {
      pageCol.classList.remove("opacity-0");
      pageCol.classList.add("opacity-100");
    });

    return pageCol;
  }

  // Fetch uncached page with progress tracking
  try {
    const response = await fetch(svgUrl, { priority: 'high' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Animate progress bar to 50% (headers received)
    if (progressBar) {
      progressBar.style.width = '50%';
    }

    const svgText = await response.text();
    const processed = preprocessSvg(svgText, pageNum);
    PAGE_SVG_CACHE.set(pageNum, processed);

    // Animate progress bar to 100%
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.parentElement.classList.add('opacity-0');
    }

    pageContent.innerHTML = processed;
    pageCol.innerHTML = '';
    pageCol.appendChild(pageCard);
    pageCard.appendChild(pageContent);

    requestAnimationFrame(() => {
      pageCol.classList.remove("opacity-0");
      pageCol.classList.add("opacity-100");
    });

  } catch (e) {
    console.error(`[Spread] Failed to load page ${pageNum}:`, e);
    renderSpreadError(pageContent, pageNum);
    pageCol.innerHTML = '';
    pageCol.appendChild(pageCard);
    pageCard.appendChild(pageContent);

    // Hide progress bar on error
    if (progressBar) {
      progressBar.parentElement.classList.add('opacity-0');
    }

    requestAnimationFrame(() => {
      pageCol.classList.remove("opacity-0");
    });
  }

  return pageCol;
}

/**
 * Renders top loading progress bar for spread view.
 * @returns {HTMLElement} Progress bar element
 */
function renderProgressBar() {
  const progressContainer = document.createElement("div");
  progressContainer.className = "fixed top-0 left-0 w-full h-1 z-[200] bg-slate-900/20";

  const progressBar = document.createElement("div");
  progressBar.className = "h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 w-0 transition-all duration-300 ease-out";
  progressBar.style.backgroundSize = "200% 100%";

  progressContainer.appendChild(progressBar);
  return progressContainer;
}

window.renderSpread = async function () {
  if (!els.spreadView) return;

  if (typeof syncNavigationInputs === "function") syncNavigationInputs();

  if (!AppState.currentSurah) {
    console.error("[Spread] No surah loaded");
    return;
  }

  const currentAyah = AppState.currentSurah.verses[AppState.currentAyahIndex];

  if (typeof getPageNumber !== "function") {
    console.error("[Spread] getPageNumber not available");
    return;
  }

  const currentPage = getPageNumber(AppState.currentSurah.id, currentAyah.id);

  // Determine page numbers
  let leftPageNum = null;
  let rightPageNum = null;

  if (currentPage % 2 !== 0) {
    rightPageNum = currentPage;
    leftPageNum = currentPage + 1 <= MAX_PAGE ? currentPage + 1 : null;
  } else {
    rightPageNum = currentPage - 1 >= MIN_PAGE ? currentPage - 1 : null;
    leftPageNum = currentPage;
  }

  // Validate page numbers
  if (rightPageNum && (rightPageNum < MIN_PAGE || rightPageNum > MAX_PAGE)) {
    rightPageNum = null;
  }
  if (leftPageNum && (leftPageNum < MIN_PAGE || leftPageNum > MAX_PAGE)) {
    leftPageNum = null;
  }

  // Create and show progress bar
  const existingProgress = document.querySelector('.fixed.top-0.h-1.z-\\[200\\]');
  if (existingProgress) existingProgress.remove();

  const progressContainer = renderProgressBar();
  const progressBar = progressContainer.querySelector('div');
  document.body.appendChild(progressContainer);

  // Start progress animation (20% initial)
  setTimeout(() => {
    progressBar.style.width = '20%';
  }, 10);

  // Update container
  els.spreadView.className = "w-full flex-row-reverse-spread animate-fade-in";

  // Update parent container background
  const themeClass = `quran-theme-${AppState.settings.pageTheme || 'original'}`;
  if (els.spreadCard) {
    const isHidden = els.spreadCard.classList.contains("hidden");
    els.spreadCard.className = `w-full flex-col items-center animate-fade-in ${themeClass} ${isHidden ? "hidden" : "flex"}`;
  }

  // OPTIMIZATION: Render pages with priority (right page first for RTL)
  const rightPagePromise = renderPageColumn(rightPageNum, 0, true, progressBar);
  const leftPagePromise = renderPageColumn(leftPageNum, 1, false, progressBar);

  // Clear and append as they become ready
  els.spreadView.innerHTML = "";

  const [rightCol, leftCol] = await Promise.all([rightPagePromise, leftPagePromise]);
  els.spreadView.appendChild(rightCol);
  els.spreadView.appendChild(leftCol);

  // Remove progress bar after short delay
  setTimeout(() => {
    progressContainer.style.opacity = '0';
    progressContainer.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => progressContainer.remove(), 300);
  }, 500);

  // OPTIMIZATION: Prefetch NEXT (already called by render, but ensure it happens)
  window.prefetchAdjacentPages(currentPage);

  // Update navigation inputs
  if (els.pageInput) els.pageInput.value = currentPage;
  if (els.juzInput && typeof getJuzNumber === "function") {
    els.juzInput.value = getJuzNumber(AppState.currentSurah.id, currentAyah.id);
  }
};
