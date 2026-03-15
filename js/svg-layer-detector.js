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
    'verseNumerals': '#FFFFFF',    // White numerals for better contrast inside teardrops
    'surahHeader': '#E8943A',      // Orange headers
    'teardropLabel': '#9B6ED4',    // Purple labels (Hizb/Juz)
    'surahBand': '#C4922A',        // Gold horizontal band
    'pageNumber': '#4a90d9'        // Blue page numbers
  },
  sepia: {
    'borderFrame': '#8B7355',      // Brown border
    'teardrop': '#6B8E7E',         // Muted teal
    'arabicText': '#5d4037',       // Brown text
    'verseNumerals': '#FFFFFF',    // White numerals
    'surahHeader': '#D48846',      // Muted orange
    'teardropLabel': '#8B6BB8',    // Muted purple
    'surahBand': '#8B7355',        // Muted brown
    'pageNumber': '#5A7FA8'        // Muted blue
  },
  night: {
    'borderFrame': '#94A3B8',      // Slate gold
    'teardrop': '#64748B',         // Slate teal
    'arabicText': '#cbd5e1',       // Light text
    'verseNumerals': '#FFFFFF',    // White numerals
    'surahHeader': '#FBBF77',      // Light orange
    'teardropLabel': '#A78BDB',    // Light purple
    'surahBand': '#94A3B8',        // Slate gold
    'pageNumber': '#7FA8D4'        // Light blue
  },
  green: {
    'borderFrame': '#059669',      // Emerald gold
    'teardrop': '#10B981',         // Emerald
    'arabicText': '#064e3b',       // Dark green text
    'verseNumerals': '#FFFFFF',    // White numerals
    'surahHeader': '#F59E0B',      // Amber
    'teardropLabel': '#8B5CF6',    // Violet
    'surahBand': '#059669',        // Emerald gold
    'pageNumber': '#3B82F6'        // Blue
  }
};

// ══ LAYER DETECTION CONFIGURATION ══
const DETECTION_CONFIG = {
  GREEN_FILL: '#bfe8c1',
  BLACK_FILL: '#231f20',
  
  // Border & Frame: Green paths with multiple subpaths
  BORDER_MIN_SUBPATHS: 2,
  
  // Teardrop: Green paths with single subpath and medium length
  TEARDROP_MAX_SUBPATHS: 1,
  TEARDROP_MIN_LEN: 800,
  TEARDROP_MAX_LEN: 2500,
  
  // Teardrop Labels: Black paths with multiple subpaths inside side teardrops
  LABEL_MIN_SUBPATHS: 5,
  LABEL_MIN_LEN: 3000,
  LABEL_MAX_LEN: 50000,
  
  // Surah Band: Green horizontal framing band
  SURAH_BAND_SUBPATHS: 1,
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
  const paths = Array.from(svgEl.querySelectorAll('path[fill]'));
  const layers = [];
  const usedEls = new Set();
  const colors = LAYER_COLORS[theme] || LAYER_COLORS.original;

  // Gather path metadata
  const pathData = paths.map(el => {
    const d = el.getAttribute('d') || '';
    const fill = (el.getAttribute('fill') || '').toLowerCase();
    const zCount = (d.match(/z/gi) || []).length;
    return { el, fill, len: d.length, z: zCount };
  }).filter(p => p.fill && p.fill !== 'none');

  // ── LAYER 1: Border & Frame ──
  const borderEl = pathData.find(p => 
    p.fill === DETECTION_CONFIG.GREEN_FILL && p.z >= DETECTION_CONFIG.BORDER_MIN_SUBPATHS
  );
  if (borderEl) {
    const desc = borderEl.len > 5000
      ? `Rectangular frame + ornate border edge (${(borderEl.len/1000).toFixed(0)}K)`
      : `Page frame + ornament + circular window (${(borderEl.len/1000).toFixed(1)}K)`;
    layers.push({
      name: 'borderFrame',
      els: [borderEl.el],
      color: colors.borderFrame,
      desc,
      meta: `fill:${DETECTION_CONFIG.GREEN_FILL} · ${borderEl.z} subpaths`
    });
    usedEls.add(borderEl.el);
  }

  // ── LAYER 2: Teardrop Shapes ──
  const teardrops = pathData.filter(p =>
    p.fill === DETECTION_CONFIG.GREEN_FILL && 
    p.z <= DETECTION_CONFIG.TEARDROP_MAX_SUBPATHS && 
    p.len >= DETECTION_CONFIG.TEARDROP_MIN_LEN && 
    p.len <= DETECTION_CONFIG.TEARDROP_MAX_LEN && 
    !usedEls.has(p.el)
  );
  if (teardrops.length) {
    teardrops.forEach(p => usedEls.add(p.el));
    layers.push({
      name: 'teardrop',
      els: teardrops.map(p => p.el),
      color: colors.teardrop,
      desc: `${teardrops.length} ornamental teardrop medallion backgrounds`,
      meta: `fill:${DETECTION_CONFIG.GREEN_FILL} · open curves`
    });
  }

  // ── LAYER 3: Surah Band ──
  const surahBand = pathData.filter(p =>
    p.fill === DETECTION_CONFIG.GREEN_FILL && 
    p.z === DETECTION_CONFIG.SURAH_BAND_SUBPATHS && 
    p.len >= DETECTION_CONFIG.SURAH_BAND_MIN_LEN && 
    p.len <= DETECTION_CONFIG.SURAH_BAND_MAX_LEN && 
    !usedEls.has(p.el)
  );
  if (surahBand.length) {
    surahBand.forEach(p => usedEls.add(p.el));
    layers.push({
      name: 'surahBand',
      els: surahBand.map(p => p.el),
      color: colors.surahBand,
      desc: 'Decorative horizontal band framing the surah name',
      meta: `fill:${DETECTION_CONFIG.GREEN_FILL} · horizontal band`
    });
  }

  // ── LAYER 4: Arabic Body Text ──
  const blackPaths = pathData.filter(p => 
    p.fill === DETECTION_CONFIG.BLACK_FILL && !usedEls.has(p.el)
  );
  if (blackPaths.length) {
    const bodyText = blackPaths.reduce((a, b) => a.len > b.len ? a : b);
    usedEls.add(bodyText.el);
    layers.push({
      name: 'arabicText',
      els: [bodyText.el],
      color: colors.arabicText,
      desc: `Body calligraphy — all verses on this page`,
      meta: `fill:${DETECTION_CONFIG.BLACK_FILL} · ${(bodyText.len/1000).toFixed(0)}K chars`
    });
  }

  // ── LAYER 5: Teardrop Labels ──
  const tearLabels = pathData.filter(p =>
    p.fill === DETECTION_CONFIG.BLACK_FILL && 
    p.z > DETECTION_CONFIG.LABEL_MIN_SUBPATHS && 
    p.len >= DETECTION_CONFIG.LABEL_MIN_LEN && 
    p.len <= DETECTION_CONFIG.LABEL_MAX_LEN && 
    !usedEls.has(p.el)
  );
  if (tearLabels.length) {
    tearLabels.forEach(p => usedEls.add(p.el));
    layers.push({
      name: 'teardropLabel',
      els: tearLabels.map(p => p.el),
      color: colors.teardropLabel,
      desc: `Juzʾ & Ḥizb labels inside large side teardrop markers`,
      meta: `fill:${DETECTION_CONFIG.BLACK_FILL} · ${tearLabels[0].z} subpaths · ${(tearLabels[0].len/1000).toFixed(0)}K chars`
    });
  }

  // ── LAYER 6: Verse Numerals ──
  const numerals = pathData.filter(p =>
    p.fill === DETECTION_CONFIG.BLACK_FILL && 
    p.z === DETECTION_CONFIG.NUMERAL_MAX_SUBPATHS && 
    p.len < DETECTION_CONFIG.NUMERAL_MAX_LEN && 
    !usedEls.has(p.el)
  );
  if (numerals.length) {
    numerals.forEach(p => usedEls.add(p.el));
    layers.push({
      name: 'verseNumerals',
      els: numerals.map(p => p.el),
      color: colors.verseNumerals,
      desc: `Hindi-Arabic numeral strokes inside each teardrop medallion`,
      meta: `fill:${DETECTION_CONFIG.BLACK_FILL} · ${numerals.length} numeral${numerals.length > 1 ? 's' : ''}`
    });
  }

  // ── LAYER 7: Surah/Juzʾ Headers ──
  const headers = pathData.filter(p =>
    p.fill === DETECTION_CONFIG.BLACK_FILL && 
    p.len >= DETECTION_CONFIG.HEADER_MIN_LEN && 
    p.len <= DETECTION_CONFIG.HEADER_MAX_LEN && 
    p.z <= DETECTION_CONFIG.HEADER_MAX_SUBPATHS && 
    !usedEls.has(p.el)
  );
  if (headers.length) {
    headers.forEach(p => usedEls.add(p.el));
    const isBasmala = headers.length === 1 && headers[0].len < 15000;
    layers.push({
      name: 'surahHeader',
      els: headers.map(p => p.el),
      color: colors.surahHeader,
      desc: isBasmala
        ? 'Basmala / surah header calligraphic band'
        : `Surah name + Juzʾ label at top of page (${headers.length} elements)`,
      meta: `fill:${DETECTION_CONFIG.BLACK_FILL} · ${headers.map(p => (p.len/1000).toFixed(0)+'K').join(', ')}`
    });
  }

  // ── LAYER 8: Page Number ──
  const remaining = pathData.filter(p => 
    p.fill === DETECTION_CONFIG.BLACK_FILL && !usedEls.has(p.el)
  );
  if (remaining.length) {
    remaining.forEach(p => usedEls.add(p.el));
    layers.push({
      name: 'pageNumber',
      els: remaining.map(p => p.el),
      color: colors.pageNumber,
      desc: 'Page numeral at the bottom of the page',
      meta: `fill:${DETECTION_CONFIG.BLACK_FILL} · ${remaining.map(p => (p.len/1000).toFixed(1)+'K').join(', ')}`
    });
  }

  return layers;
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
