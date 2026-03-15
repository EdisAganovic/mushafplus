/**
 * @file tajweed_engine.js
 * @description Logic for Tajweed rules tooltips and formatting.
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
    name: "Elif tefrik",
    desc: "Elif koji se piše ali se ne izgovara",
  },
  hamzatulWasli: {
    name: "Hemzetul-vasl",
    desc: "Hemze koje se čita samo na početku, inače se preskače",
  },
};

let globalTajweedTooltip = null;

function getGlobalTooltip() {
  if (!globalTajweedTooltip) {
    globalTajweedTooltip = document.createElement("div");
    globalTajweedTooltip.className = "tajweed-tooltip";
    globalTajweedTooltip.style.position = "fixed";
    globalTajweedTooltip.style.display = "none";
    globalTajweedTooltip.style.zIndex = "9999";
    document.body.appendChild(globalTajweedTooltip);
  }
  return globalTajweedTooltip;
}

window.showTajweedTooltip = function(target, tip) {
  const tooltip = getGlobalTooltip();
  tooltip.innerHTML = `<strong>${tip.name}</strong><div class="mt-1 opacity-90">${tip.desc}</div>`;

  tooltip.style.display = "block";
  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = rect.left + rect.width / 2;

  if (left - tooltipRect.width / 2 < 10) left = tooltipRect.width / 2 + 10;
  if (left + tooltipRect.width / 2 > window.innerWidth - 10)
    left = window.innerWidth - tooltipRect.width / 2 - 10;

  tooltip.style.left = left + "px";
  tooltip.style.top = "auto";
  tooltip.style.bottom = window.innerHeight - rect.top + 10 + "px";
};

window.hideTajweedTooltip = function() {
  if (globalTajweedTooltip) {
    globalTajweedTooltip.style.display = "none";
    globalTajweedTooltip.dataset.activeTarget = "";
  }
};

window.TAJWEED_TOOLTIPS = TAJWEED_TOOLTIPS;
window.getGlobalTooltip = getGlobalTooltip;
