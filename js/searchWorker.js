self.onmessage = function (e) {
  if (e.data.type === "init") {
    self.quranData = e.data.data;
  } else if (e.data.type === "search") {
    const query = e.data.query;
    if (!query || query.trim().length < 2) {
      self.postMessage({ type: "results", results: [] });
      return;
    }
    const q = query.trim().toLowerCase();

    // Check for Ayah exact reference "surah:ayah" e.g "2:255"
    const refMatch = q.match(/^(\d+):(\d+)$/);
    if (refMatch) {
      const sId = parseInt(refMatch[1], 10);
      const aId = parseInt(refMatch[2], 10);
      const surah = self.quranData.find((s) => s.id === sId);
      if (surah && surah.verses[aId - 1]) {
        self.postMessage({
          type: "results",
          results: [
            {
              surahId: sId,
              surahName: surah.trans,
              ayahId: aId,
              ayahIndex: aId - 1,
              textAr: surah.verses[aId - 1].ar,
              textBs: surah.verses[aId - 1].bs,
              score: 100,
            },
          ],
        });
        return;
      }
      self.postMessage({ type: "results", results: [] });
      return;
    }

    // Free text search
    const results = [];
    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedQ = escapeRegExp(q);
    const boundaryRegex = new RegExp(
      `(^|[\\s.,!?;:'"()\\-])(${escapedQ})([\\s.,!?;:'"()\\-]|$)(?![^<]*>)`,
      "i",
    );

    for (let s of self.quranData) {
      for (let i = 0; i < s.verses.length; i++) {
        const v = s.verses[i];
        const bsLower = v.bs.toLowerCase();
        const sTransLower = s.trans.toLowerCase();

        let matched = false;
        let score = 0;

        if (bsLower.includes(q)) {
          matched = true;
          score += boundaryRegex.test(bsLower) ? 10 : 1;
        }
        if (v.ar.includes(q)) {
          matched = true;
          score += boundaryRegex.test(v.ar) ? 10 : 1;
        }
        if (sTransLower.includes(q)) {
          matched = true;
          score += boundaryRegex.test(sTransLower) ? 10 : 1;
        }

        if (matched) {
          results.push({
            surahId: s.id,
            surahName: s.trans,
            ayahId: v.id,
            ayahIndex: i,
            textAr: v.ar,
            textBs: v.bs,
            score: score,
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    self.postMessage({ type: "results", results: results.slice(0, 50) });
  }
};
