/**
 * @file render.js
 * @description UI RENDERING ENGINE
 * Handles dynamic content injection for Arabic text, Ayah grid, and persistence state UI feedback.
 */

/**
 * Renders the main Ayah display area.
 * - Splits Arabic text into interactive spans for word-highlighting.
 * - Loads translations, notes, and previous recording states.
 * - Synchronizes audio player sources.
 */
const TAJWEED_TOOLTIPS = {
  LAFZATULLAH: {
    name: "Lafzatullah",
    desc: "Ime Allaha se uvijek čita podebljano (tafkhim)",
  },
  izhar: {
    name: "Izhar",
    desc: "Jasno izgovaranje nun sakina ili tenvina bez spajanja",
  },
  ikhfaa: {
    name: "Ihfa",
    desc: "Skriveno izgovaranje nun sakina ili tenvina pred određenim harfovima",
  },
  idghamWithGhunna: {
    name: "Idgam me'al-gunne",
    desc: "Spajanje uz nazalni zvuk (gunnu) kod nun sakina",
  },
  iqlab: { name: "Iklab", desc: "Pretvaranje nun sakina u mim pred harfom ba" },
  qalqala: {
    name: "Kalkala",
    desc: "Odzvanjanje harfova ق ط ب ج د kad su sakin",
  },
  idghamWithoutGhunna: {
    name: "Idgam bila gunne",
    desc: "Spajanje bez nazalnog zvuka kod lam i ra",
  },
  ghunna: { name: "Gunna", desc: "Nazalni zvuk koji traje dva hareketa" },
  prolonging: {
    name: "Medd",
    desc: "Duženje samoglasnika preko uobičajenog trajanja",
  },
  alefTafreeq: {
    name: "Alef tefrik",
    desc: "Alef koji se piše ali se ne izgovara",
  },
  hamzatulWasli: {
    name: "Hemzetul-vasl",
    desc: "Hemze koje se čita samo na početku, inače se preskače",
  },
};

window.renderAyah = function () {
  const ayah = AppState.currentSurah.verses[AppState.currentAyahIndex];
  const key = `${AppState.currentSurah.id}-${ayah.id}`;

  // 1. Arabic word-by-word injection with Tajweed support
  els.arabicDisplay.innerHTML = "";
  const activeHighlights = AppState.highlights[key] || [];

  // Parse text using Tajweed tokenizer if available, otherwise fallback to single plain token
  const tokens = window.Tajweed
    ? window.Tajweed.tokenize(ayah.ar)
    : [{ text: ayah.ar, rule: "none" }];

  let wordIndex = 0;
  let currentWordSpan = document.createElement("span");
  currentWordSpan.className =
    "quran-word px-0.5 rounded-md transition-all cursor-pointer hover:bg-emerald-500/20";

  function finishWord() {
    if (activeHighlights.includes(wordIndex)) {
      currentWordSpan.classList.add("bg-emerald-600/60", "text-white");
    }
    const captureIdx = wordIndex;
    currentWordSpan.onclick = (e) => {
      e.stopPropagation();
      toggleWordHighlight(key, captureIdx);
    };
    els.arabicDisplay.appendChild(currentWordSpan);
    wordIndex++;

    // Reset for next word
    currentWordSpan = document.createElement("span");
    currentWordSpan.className =
      "quran-word px-0.5 rounded-md transition-all cursor-pointer hover:bg-emerald-500/20";
  }

  tokens.forEach((token) => {
    const parts = token.text.split(" ");
    parts.forEach((part, i) => {
      if (part.length > 0) {
        const tSpan = document.createElement("span");
        tSpan.textContent = part;
        if (token.rule && token.rule !== "none") {
          tSpan.classList.add(`rule-${token.rule}`);
          const tip = TAJWEED_TOOLTIPS[token.rule];
          if (tip) {
            tSpan.style.position = "relative";
            tSpan.addEventListener("mouseenter", function () {
              const el = document.createElement("div");
              el.className = "tajweed-tooltip";
              const words = tip.desc.split(" ");
              const line1 = words.slice(0, 7).join(" ");
              const line2 = words.slice(7).join(" ");
              const descHtml = line2 ? `${line1}<br>${line2}` : line1;
              el.innerHTML = `<strong>${tip.name}</strong><br>${descHtml}`;
              tSpan.appendChild(el);
            });
            tSpan.addEventListener("mouseleave", function () {
              const t = tSpan.querySelector(".tajweed-tooltip");
              if (t) t.remove();
            });
          }
        }
        currentWordSpan.appendChild(tSpan);
      }

      // If there are more parts, it means a space was encountered
      if (i < parts.length - 1) {
        finishWord();
        els.arabicDisplay.appendChild(document.createTextNode(" "));
      }
    });
  });

  // Append the last word if it contains anything
  if (currentWordSpan.childNodes.length > 0) {
    finishWord();
  }

  // 2. Translation & Metadata
  els.translationDisplay.textContent = ayah.bs;
  els.currentAyahNum.textContent = AppState.currentAyahIndex + 1;
  els.totalAyahsNum.textContent = AppState.currentSurah.verses.length;

  // 3. Sync Recording State
  if (AppState.recordings[key]) {
    els.userAudioContainer.classList.remove("hidden");
    if (els.audioPlayback.src !== AppState.recordings[key]) {
      els.audioPlayback.src = AppState.recordings[key];
      els.audioPlayback.load();
      resetUserAudioUI();
    }
    els.recordText.innerText = T.recordAgain;
  } else {
    els.userAudioContainer.classList.add("hidden");
    if (els.audioPlayback.src) {
      els.audioPlayback.pause();
      els.audioPlayback.removeAttribute("src");
      els.audioPlayback.load();
    }
    els.recordText.innerText = T.record;
  }

  // 4. Sync Recitation Audio
  const suraStr = String(AppState.currentSurah.id).padStart(3, "0");
  const ayahStr = String(ayah.id).padStart(3, "0");
  const expectedSrc = `mp3/${suraStr}${ayahStr}.mp3`;

  if (!els.ayahAudio.src.endsWith(expectedSrc)) {
    els.ayahAudio.pause();
    els.ayahAudio.src = expectedSrc;
    els.ayahAudio.load();
    resetAyahAudioUI();
  }
  els.ayahAudioContainer.classList.remove("hidden");

  // 5. Notes, Checkmarks, & Bookmarks
  els.ayahNotes.value = AppState.notes[key] || "";
  if (AppState.checkedAyats.has(key)) {
    els.validBtn.classList.replace("bg-slate-800", "bg-emerald-600");
    els.validBtn.classList.add("border-emerald-400");
  } else {
    els.validBtn.classList.replace("bg-emerald-600", "bg-slate-800");
    els.validBtn.classList.remove("border-emerald-400");
  }

  if (AppState.bookmarks.has(key)) {
    els.bookmarkBtn.classList.replace("bg-slate-800", "bg-emerald-600");
    els.bookmarkBtn.classList.add("border-emerald-400");
    els.bookmarkBtn.querySelector("ion-icon").name = "bookmark";
  } else {
    els.bookmarkBtn.classList.replace("bg-emerald-600", "bg-slate-800");
    els.bookmarkBtn.classList.remove("border-emerald-400");
    els.bookmarkBtn.querySelector("ion-icon").name = "bookmark-outline";
  }

  // 6. Highlight active grid cell (O(1) — only touch prev + current)
  const cells = els.ayahGrid.children;
  // Deactivate previously active cell
  if (AppState._prevGridIndex != null && cells[AppState._prevGridIndex]) {
    const prev = cells[AppState._prevGridIndex];
    prev.classList.remove(
      "ring-4",
      "ring-emerald-500/50",
      "bg-emerald-800",
      "text-white",
    );
    if (!prev.classList.contains("bg-emerald-600")) {
      prev.classList.add("text-slate-400", "bg-slate-800");
    }
  }
  // Activate current cell
  const cur = cells[AppState.currentAyahIndex];
  if (cur) {
    if (!cur.classList.contains("bg-emerald-600")) {
      cur.classList.add("bg-emerald-800");
    }
    cur.classList.add("ring-4", "ring-emerald-500/50", "text-white");
    cur.classList.remove("text-slate-400", "bg-slate-800", "bg-slate-700");
    cur.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  AppState._prevGridIndex = AppState.currentAyahIndex;

  // 7. Swipe UX: Slide-fade transition (mobile only)
  if (AppState.swipeDirection) {
    if (window.innerWidth < 768) {
      const animClass =
        AppState.swipeDirection === "left"
          ? "animate-slide-left"
          : "animate-slide-right";
      els.arabicDisplay.classList.remove(
        "animate-slide-left",
        "animate-slide-right",
      );
      els.translationDisplay.classList.remove(
        "animate-slide-left",
        "animate-slide-right",
      );
      void els.arabicDisplay.offsetWidth; // force reflow
      els.arabicDisplay.classList.add(animClass);
      els.translationDisplay.classList.add(animClass);
    }

    // Play the physical swipe effect
    if (typeof window.playSwipeEffect === "function") {
      window.playSwipeEffect(AppState.swipeDirection);
    }

    AppState.swipeDirection = null;
  }
};

/**
 * Rebuilds the scrollable Ayah grid in the sidebar.
 * Uses event delegation — one handler on parent instead of per-cell.
 */
window.renderAyahGrid = function () {
  els.ayahGrid.innerHTML = "";

  // Use DocumentFragment for batch DOM insertion
  const frag = document.createDocumentFragment();
  AppState.currentSurah.verses.forEach((verse, index) => {
    const cell = document.createElement("div");
    const key = `${AppState.currentSurah.id}-${verse.id}`;
    cell.className =
      "ayah-cell h-8 w-8 flex items-center justify-center rounded-md text-xs font-bold cursor-pointer transition-all active:scale-95 ";

    if (AppState.checkedAyats.has(key)) {
      cell.classList.add("bg-emerald-600", "text-white");
    } else {
      cell.classList.add(
        "bg-slate-800",
        "text-slate-400",
        "hover:bg-slate-700",
      );
    }

    if (AppState.notes[key]) {
      cell.classList.add("border-b-2", "border-amber-500", "rounded-b-none");
    }

    if (index === AppState.currentAyahIndex) {
      if (!cell.classList.contains("bg-emerald-600")) {
        cell.classList.add("bg-emerald-800");
      }
      cell.classList.add("ring-2", "ring-emerald-500/50", "text-white");
      cell.classList.remove("text-slate-400", "bg-slate-800", "bg-slate-700");
    }

    cell.textContent = index + 1;
    cell.dataset.index = index;
    frag.appendChild(cell);
  });
  els.ayahGrid.appendChild(frag);

  // Event delegation — single click handler on the grid parent
  els.ayahGrid.onclick = (e) => {
    const cell = e.target.closest(".ayah-cell");
    if (!cell || cell.dataset.index == null) return;
    AppState.currentAyahIndex = parseInt(cell.dataset.index);
    renderAyah();
  };

  // Reset tracked index for the O(1) cell update in renderAyah
  AppState._prevGridIndex = AppState.currentAyahIndex;
};

/**
 * Renders the bookmarks list in the sidebar.
 */
window.renderBookmarks = function () {
  els.bookmarksList.innerHTML = "";
  if (AppState.bookmarks.size === 0) {
    els.bookmarksList.innerHTML = `<div class="text-slate-500 italic text-center w-full mt-4 text-xs">${T.noBookmarks}</div>`;
    return;
  }

  [...AppState.bookmarks].forEach((key) => {
    const [surahId, ayahId] = key.split("-").map(Number);
    const surah = AppState.data.find((s) => s.id === surahId);
    if (!surah) return;

    // Find absolute index of ayah in surah to be able to jump to it
    const verseIndex = surah.verses.findIndex((v) => v.id === ayahId);
    if (verseIndex === -1) return;

    const container = document.createElement("div");
    container.className = "flex items-center gap-2 w-full";

    const btn = document.createElement("button");
    btn.className =
      "flex-1 text-left bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300 font-bold transition-colors flex justify-between items-center group";

    btn.innerHTML = `
      <span>Surah ${surah.trans}, Ayah ${verseIndex + 1}</span>
      <ion-icon name="arrow-forward-outline" class="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400"></ion-icon>
    `;

    btn.onclick = () => {
      els.surahSelect.value = surahId;
      loadSurah(surahId);
      AppState.currentAyahIndex = verseIndex;
      renderAyah();
      renderAyahGrid();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className =
      "flex-shrink-0 bg-slate-800 hover:bg-rose-900 border border-transparent hover:border-rose-500 text-slate-400 hover:text-rose-400 p-2 rounded-lg transition-colors flex items-center justify-center";
    deleteBtn.innerHTML = `<ion-icon name="trash-outline" class="text-xl"></ion-icon>`;
    deleteBtn.title = "Remove Bookmark";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      AppState.bookmarks.delete(key);
      localStorage.setItem(
        "quran_bookmarks",
        JSON.stringify([...AppState.bookmarks]),
      );
      renderBookmarks();
      renderAyah();
    };

    container.appendChild(btn);
    container.appendChild(deleteBtn);
    els.bookmarksList.appendChild(container);
  });
};
