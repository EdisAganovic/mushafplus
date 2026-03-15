/**
 * @file validation.js
 * @description DOM Element Validation
 * Validates that all required DOM elements exist before app initialization.
 * Helps catch HTML/ID mismatches early in development.
 */

/**
 * Validates that all elements in window.els are properly mapped.
 * Returns an array of missing element keys.
 * @returns {{missing: string[], warnings: string[]}}
 */
window.validateElements = function() {
  const missing = [];
  const warnings = [];

  if (!window.els) {
    return { missing: ['window.els not defined'], warnings: [] };
  }

  for (const [key, value] of Object.entries(window.els)) {
    if (value === null || value === undefined) {
      missing.push(key);
    } else if (value instanceof NodeList) {
      // For querySelectorAll results
      if (value.length === 0) {
        warnings.push(`${key}: querySelectorAll returned empty NodeList`);
      }
    }
  }

  return { missing, warnings };
};

/**
 * Runs validation and logs results to console.
 * In development mode, throws an error if critical elements are missing.
 * @param {boolean} throwOnError - Whether to throw on critical missing elements
 */
window.runElementValidation = function(throwOnError = false) {
  const { missing, warnings } = validateElements();

  if (warnings.length > 0) {
    console.warn('[Validation] Warnings:', warnings);
  }

  if (missing.length > 0) {
    const criticalMissing = missing.filter(key => {
      // Critical elements that must exist for app to function
      const criticalKeys = [
        'surahSelect', 'arabicDisplay', 'translationDisplay',
        'prevBtn', 'nextBtn', 'recordBtn', 'ayahCard',
        'sidebar', 'settingsDrawer', 'mainActionToolbar'
      ];
      return criticalKeys.includes(key);
    });

    if (criticalMissing.length > 0) {
      const errorMsg = `[Validation] Critical DOM elements missing: ${criticalMissing.join(', ')}`;
      console.error(errorMsg);
      console.error('[Validation] Check that index.html has the correct IDs');

      if (throwOnError) {
        throw new Error(errorMsg);
      }
    } else {
      console.error(`[Validation] Non-critical elements missing: ${missing.join(', ')}`);
    }
  } else {
    console.log('[Validation] All DOM elements validated successfully ✓');
  }

  return { missing, warnings, criticalCount: missing.filter(k => 
    ['surahSelect', 'arabicDisplay', 'translationDisplay', 'prevBtn', 'nextBtn', 'recordBtn', 'ayahCard'].includes(k)
  ).length };
};

/**
 * Validates modal IDs match between HTML and JS references.
 * Checks that modal close buttons have valid data-modal-close attributes.
 */
window.validateModals = function() {
  const issues = [];

  // Check modal close buttons
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    const modalId = btn.dataset.modalClose;
    const modal = document.getElementById(modalId);
    if (!modal) {
      issues.push(`Modal close button references non-existent modal: #${modalId}`);
    }
  });

  // Check that all modals have close buttons
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    const modalId = modal.id;
    const closeBtn = modal.querySelector(`[data-modal-close="${modalId}"]`);
    if (!closeBtn) {
      issues.push(`Modal #${modalId} has no close button`);
    }
  });

  if (issues.length > 0) {
    console.warn('[Validation] Modal issues:', issues);
  } else {
    console.log('[Validation] Modal structure validated ✓');
  }

  return issues;
};

/**
 * Validates that all data-i18n attributes have corresponding translations.
 * Requires i18n.js to be loaded first.
 */
window.validateTranslations = function() {
  if (!window.T) {
    console.warn('[Validation] Translation object (window.T) not loaded yet');
    return [];
  }

  const issues = [];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!(key in window.T)) {
      issues.push(`Missing translation key: ${key}`);
    }
  });

  if (issues.length > 0) {
    console.warn('[Validation] Missing translations:', issues);
  } else {
    console.log('[Validation] All translation keys exist ✓');
  }

  return issues;
};

/**
 * Main validation runner - call this during app initialization.
 */
window.runAllValidations = function() {
  console.group('[Validation] Running all checks...');
  
  const elementResult = runElementValidation(false);
  const modalIssues = validateModals();
  const translationIssues = validateTranslations();
  
  console.groupEnd();
  
  return {
    elements: elementResult,
    modals: modalIssues,
    translations: translationIssues,
    hasCriticalErrors: elementResult.criticalCount > 0
  };
};
