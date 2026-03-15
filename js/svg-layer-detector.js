/**
 * @file svg-layer-detector.js
 * @description Universal Quran SVG Layer Detection System
 * Detects and colors different layers in Quran page SVGs based on path characteristics
 */

// ══ LAYER COLORS BY THEME ══
window.LAYER_COLORS = {
  original: {
    'borderFrame': '#C4922A',      // Gold border
    'teardrop': '#1B7A6A',         // Teal teardrop shapes
    'arabicText': '#1e293b',       // Dark text
    'verseNumerals': 'var(--page-bg)', // Cutout effect matching background
    'surahHeader': '#E8943A',      // Orange headers
    'teardropLabel': 'var(--page-bg)', // Cutout effect
    'surahBand': '#C4922A',        // Gold horizontal band
    'surahBandText': 'var(--page-bg)', // Cutout effect inside band
    'bigTeardrop': '#C4922A',      // Gold background for Juz/Hizb marker
    'pageNumber': '#4a90d9'        // Blue page numbers
  },
  sepia: {
    'borderFrame': '#8B7355',      // Brown border
    'teardrop': '#6B8E7E',         // Muted teal
    'arabicText': '#5d4037',       // Brown text
    'verseNumerals': 'var(--page-bg)',
    'surahHeader': '#D48846',      // Muted orange
    'teardropLabel': 'var(--page-bg)',
    'surahBand': '#8B7355',        // Muted brown
    'surahBandText': 'var(--page-bg)',
    'bigTeardrop': '#8B7355',      // Muted brown side marker
    'pageNumber': '#5A7FA8'        // Muted blue
  },
  night: {
    'borderFrame': '#94A3B8',      // Slate gold
    'teardrop': '#64748B',         // Slate teal
    'arabicText': '#cbd5e1',       // Light text
    'verseNumerals': 'var(--page-bg)',
    'surahHeader': '#FBBF77',      // Light orange
    'teardropLabel': 'var(--page-bg)',
    'surahBand': '#94A3B8',        // Slate gold
    'surahBandText': 'var(--page-bg)',
    'bigTeardrop': '#94A3B8',      // Slate gold side marker
    'pageNumber': '#7FA8D4'        // Light blue
  },
  green: {
    'borderFrame': '#059669',      // Emerald gold
    'teardrop': '#10B981',         // Emerald
    'arabicText': '#064e3b',       // Dark green text
    'verseNumerals': 'var(--page-bg)',
    'surahHeader': '#F59E0B',      // Amber
    'teardropLabel': 'var(--page-bg)',
    'surahBand': '#059669',        // Emerald gold
    'surahBandText': 'var(--page-bg)',
    'bigTeardrop': '#059669',      // Emerald gold side marker
    'pageNumber': '#3B82F6'        // Blue
  }
};

// ══ LAYER DETECTION CONFIGURATION ══
const DETECTION_CONFIG = {
  GREEN_FILL: '#bfe8c1',
  BLACK_FILL: '#231f20',
  
  // Border & Frame: Green paths with multiple closed loops
  BORDER_MIN_LOOPS: 2,
  
  // Teardrop: Green paths with a single loop and medium length
  TEARDROP_MAX_LOOPS: 1,
  TEARDROP_MIN_LEN: 800,
  TEARDROP_MAX_LEN: 2500,
  
  // Teardrop Labels: Black paths with multiple subpaths inside side teardrops
  LABEL_MIN_SUBPATHS: 5,
  LABEL_MIN_LEN: 3000,
  LABEL_MAX_LEN: 50000,
  
  // Surah Band: Green horizontal framing band
  SURAH_BAND_MAX_LOOPS: 1,
  SURAH_BAND_MIN_LEN: 1800,
  SURAH_BAND_MAX_LEN: 10000,
  
  // Verse Numerals: Small black paths
  NUMERAL_MAX_LEN: 2000,
  NUMERAL_MAX_SUBPATHS: 0,
  
  // Surah/Juz Headers: Medium-length black paths
  HEADER_MIN_LEN: 5000,
  HEADER_MAX_LEN: 20000,
  HEADER_MAX_SUBPATHS: 4
};

/**
 * Detects layers in a Quran page SVG element
 * @param {SVGElement} svgEl - The SVG element to analyze
 * @param {string} theme - Current theme name
 * @returns {Array} Array of detected layers with elements and colors
 */
function detectSVGLayers(svgEl, theme = 'original') {
  const colors = LAYER_COLORS[theme] || LAYER_COLORS.original;
  const layers = [];
  const usedEls = new Set();
  
  const GREEN = DETECTION_CONFIG.GREEN_FILL;
  const BLACK = DETECTION_CONFIG.BLACK_FILL;
  const WHITE = '#ffffff';

  // ── Helpers ──────────────────────────────────────────────
  const pInfo = (el) => {
    const d = el.getAttribute('d') || '';
    const fill = (el.getAttribute('fill') || '').toLowerCase();
    const loops = (d.match(/z/gi) || []).length;
    const subpaths = (d.match(/[Mm]/g) || []).length;
    
    // Normalize white fill
    const normalizedFill = (fill === '#fff' || fill === 'white' || fill === '#ffffff') ? WHITE : fill;
    
    // Y-position from nearest translate ancestor
    let ty = 200; // Default middle
    let cur = el.parentElement;
    while (cur && cur !== svgEl) {
      const tr = cur.getAttribute('transform') || '';
      const m = tr.match(/translate\s*\(\s*[\d.+-]+\s+([\d.+-]+)/);
      if (m) { ty = parseFloat(m[1]); break; }
      cur = cur.parentElement;
    }
    return { el, fill: normalizedFill, len: d.length, loops, subpaths, ty };
  };

  const getFirstMeaningfulGroup = (el) => {
    let cur = el;
    while (cur) {
      const gChildren = Array.from(cur.children).filter(c => c.tagName === 'g');
      const pChildren = Array.from(cur.children).filter(c => c.tagName === 'path');
      if (pChildren.length > 0 || gChildren.length !== 1) return cur;
      cur = gChildren[0];
    }
    return el;
  };

  // 1. GATHER ALL PATH DATA
  const allPaths = Array.from(svgEl.querySelectorAll('path[fill]')).map(pInfo)
    .filter(p => p.fill && p.fill !== 'none');

  // 2. IDENTIFY SEMANTIC CONTAINERS (TOP-DOWN)
  const g10 = svgEl.querySelector('#g10') || svgEl.querySelector('g');
  if (!g10) return [];

  const topGroups = Array.from(g10.children)
    .filter(c => c.tagName === 'g')
    .map(getFirstMeaningfulGroup);

  topGroups.forEach(group => {
    const groupPaths = allPaths.filter(p => group.contains(p.el) && !usedEls.has(p.el));
    if (!groupPaths.length) return;

    const greens = groupPaths.filter(p => p.fill === GREEN);
    const whites = groupPaths.filter(p => p.fill === WHITE);
    const blacks = groupPaths.filter(p => p.fill === BLACK);

    // ── WHITE PATHS (Surah Band Text) ──
    if (whites.length > 0) {
      addLayer('surahBandText', whites, layers, colors.surahBandText, 'Calligraphy inside ornamental band', usedEls);
    }

    // ── TYPE A: GREEN CONTAINER (Border + Teardrops + Surah Band) ──
    if (greens.length > 0) {
      // Border & Frame (Multiple loops or very long)
      const borders = greens.filter(p => !usedEls.has(p.el) && (p.loops >= DETECTION_CONFIG.BORDER_MIN_LOOPS || p.len > 15000));
      if (borders.length) addLayer('borderFrame', borders, layers, colors.borderFrame, 'Page frame and ornate border', usedEls);

      // Surah Band (Single loop, long)
      const bands = greens.filter(p => !usedEls.has(p.el) && p.loops === 1 && p.len >= DETECTION_CONFIG.SURAH_BAND_MIN_LEN);
      if (bands.length) addLayer('surahBand', bands, layers, colors.surahBand, 'Horizontal surah framing band', usedEls);

      // Big Side Teardrop (Single loop, medium)
      const bigTears = greens.filter(p => !usedEls.has(p.el) && p.loops === 1 && p.len < DETECTION_CONFIG.SURAH_BAND_MIN_LEN);
      if (bigTears.length) addLayer('bigTeardrop', bigTears, layers, colors.bigTeardrop, 'Large margin marker background', usedEls);

      // Normal Teardrops (Remainder of green)
      const drops = greens.filter(p => !usedEls.has(p.el));
      if (drops.length) addLayer('teardrop', drops, layers, colors.teardrop, 'Verse number backgrounds', usedEls);
    } 
    
    // ── TYPE B/C/D: BLACK CONTAINERS ──
    if (blacks.length > 0) {
      const remainingBlacks = blacks.filter(p => !usedEls.has(p.el));
      if (!remainingBlacks.length) return;

      const allSmall = remainingBlacks.every(p => p.len < 2000);
      const totalLen = remainingBlacks.reduce((acc, p) => acc + p.len, 0);
      const isBody = remainingBlacks.length > 10 || totalLen > 60000;

      if (allSmall && remainingBlacks.length <= 12) {
        // TYPE B: NUMERALS
        addLayer('verseNumerals', remainingBlacks, layers, colors.verseNumerals, 'Verse numerals', usedEls);
      } 
      else if (isBody) {
        // TYPE C: BODY TEXT
        addLayer('arabicText', remainingBlacks, layers, colors.arabicText, 'Main Arabic scripture calligraphy', usedEls);
      } 
      else {
        // TYPE D: MIXED (Headers, Page Numbers, Special labels)
        // 1. Teardrop Labels (Complex, Juz/Hizb info)
        const labels = remainingBlacks.filter(p => p.loops > 5 && p.len > 3000 && p.ty < 480);
        if (labels.length) addLayer('teardropLabel', labels, layers, colors.teardropLabel, 'Juzʾ & Ḥizb side labels', usedEls);

        // 2. Headers (Top position)
        const headers = remainingBlacks.filter(p => !usedEls.has(p.el) && p.ty > 480);
        if (headers.length) addLayer('surahHeader', headers, layers, colors.surahHeader, 'Surah or Juzʾ top header', usedEls);

        // 3. Page Numbers (Bottom position)
        const pages = remainingBlacks.filter(p => !usedEls.has(p.el) && p.ty < 60);
        if (pages.length) addLayer('pageNumber', pages, layers, colors.pageNumber, 'Page reference numeral', usedEls);

        // 4. Fallback for remaining mixed black
        const rest = remainingBlacks.filter(p => !usedEls.has(p.el));
        if (rest.length) addLayer('arabicText', rest, layers, colors.arabicText, 'Miscellaneous calligraphy', usedEls);
      }
    }
  });

  // 3. FINAL FALLBACK: Process any strays
  const strays = allPaths.filter(p => !usedEls.has(p.el));
  if (strays.length) {
    const sGreens = strays.filter(p => p.fill === GREEN);
    const sBlacks = strays.filter(p => p.fill === BLACK);
    if (sGreens.length) addLayer('teardrop', sGreens, layers, colors.teardrop, 'Stray ornamental shapes', usedEls);
    if (sBlacks.length) addLayer('arabicText', sBlacks, layers, colors.arabicText, 'Stray calligraphic elements', usedEls);
  }

  return layers;
}

// ══ HELPER: ADD LAYER CONVENIENCE ══
function addLayer(name, paths, layers, color, desc, usedElsSet) {
  const els = paths.map(p => {
    usedElsSet.add(p.el);
    return p.el;
  });
  
  const existing = layers.find(l => l.name === name);
  if (existing) {
    existing.els.push(...els);
  } else {
    layers.push({
      name,
      els,
      color,
      desc,
      meta: `group:${els.length} · fill:${paths[0].fill}`
    });
  }
}



/**
 * Applies layer colors to SVG elements
 * @param {Array} layers - Detected layers array
 * @param {string} theme - Current theme name
 */
function applySVGLayerColors(layers, theme = 'original') {
  // We prefer CSS-based coloring via [data-layer-type] selectors
  // But we apply the tags here.
  layers.forEach(layer => {
    layer.els.forEach(el => {
      el.setAttribute('data-layer-type', layer.name);
      
      // Specifically for ornament backgrounds, we override the evenodd fill rule
      // to prevent transparent "holes" appearing when we recolor.
      const BACKGROUND_LAYERS = ['teardrop', 'surahBand', 'bigTeardrop'];
      if (BACKGROUND_LAYERS.includes(layer.name)) {
        el.style.fillRule = 'nonzero';
      }

      // Specifically for verse numerals, we ensure they are visible with a stroke 
      // if the theme requires it. This can also be moved to CSS.
      if (layer.name === 'verseNumerals') {
        el.style.stroke = 'currentColor';
        el.style.strokeWidth = '0.5';
        el.style.strokeLinecap = 'round';
        el.style.strokeLinejoin = 'round';
        el.style.paintOrder = 'stroke fill';
      }
    });
  });
}

/**
 * Processes an SVG page and applies layer detection
 * @param {SVGElement} svgEl - The SVG element to process
 * @param {string} theme - Current theme name
 * @returns {Array} Detected layers
 */
window.processSVGLayers = function(svgEl, theme = 'original') {
  if (!svgEl) return [];
  
  const layers = detectSVGLayers(svgEl, theme);
  applySVGLayerColors(layers, theme);
  
  return layers;
};

/**
 * Updates layer colors when theme changes
 * @param {string} newTheme - New theme name
 */
window.updateSVGLayerTheme = function(newTheme) {
  const svgContainers = document.querySelectorAll('.quran-svg-container, #svg-container, .spread-page-svg, .quran-page-svg-container');
  
  svgContainers.forEach(container => {
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      // Re-detect and apply new theme colors
      const layers = detectSVGLayers(svgEl, newTheme);
      applySVGLayerColors(layers, newTheme);
    }
  });
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectSVGLayers,
    applySVGLayerColors,
    LAYER_COLORS,
    DETECTION_CONFIG
  };
}
