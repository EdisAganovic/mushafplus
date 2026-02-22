// Tajweed Tokenizer ported from flutter/dart implementation
window.Tajweed = (function () {
  const smallHighLetters =
    "(\\u06DA|\\u06D6|\\u06D7|\\u06D8|\\u06D9|\\u06DB|\\u06E2|\\u06ED)";
  const optionalSmallHighLetters = `${smallHighLetters}?`;
  const smallHighLettersBetweenWords = `${smallHighLetters}?\\u0020*`;
  const fathaKasraDammaWithoutTanvin = "(\\u064F|\\u064E|\\u0650)";
  const fathaKasraDammaWithTanvin =
    "(\\u064B|\\u064C|\\u064D|\\u08F0|\\u08F1|\\u08F2)";
  const fathaKasraDammaWithOrWithoutTanvin = `(${fathaKasraDammaWithoutTanvin}|${fathaKasraDammaWithTanvin})`;
  const shadda = "\\u0651";
  const fathaKasraDammaWithTanvinWithOptionalShadda = `(\\u0651?${fathaKasraDammaWithTanvin}\\u0651?)`;
  const nonReadingCharactersAtEndOfWord = "(\\u0627|\\u0648|\\u0649|\\u06E5)?";
  const higherOrLowerMeem = "(\\u06E2|\\u06ED)";
  const sukoonWithoutGrouping = "\\u0652|\\u06E1|\\u06DF";
  const sukoon = `(${sukoonWithoutGrouping})`;
  const optionalSukoon = "(\\u0652|\\u06E1)?";
  const noonWithOptionalSukoon = `(\\u0646${optionalSukoon})`;
  const meemWithOptionalSukoon = `(\\u0645${optionalSukoon})`;
  const throatLetters =
    "(\\u062D|\\u062E|\\u0639|\\u063A|\\u0627|\\u0623|\\u0625|\\u0647)";
  const throatLettersWithoutExtensionAlef =
    "(\\u062D|\\u062E|\\u0639|\\u063A|\\u0627\\p{M}*\\p{L}|\\u0623|\\u0625|\\u0647)";

  const LAFZATULLAH = `(?<LAFZATULLAH>(\\u0627|\\u0671)?\\u0644\\p{M}*\\u0644\\u0651\\p{M}*\\u0647\\p{M}*(${smallHighLetters}?\\u0020|$))`;
  const ghunna = `(?<ghunna>(\\u0645|\\u0646)\\u0651\\p{M}*)`;
  const ikhfaaLetters =
    "(\\u0638|\\u0641|\\u0642|\\u0643|\\u062A|\\u062B|\\u062C|\\u062F|\\u0630|\\u0632|\\u0633|\\u0634|\\u0635|\\u0636|\\u0637)\\p{M}*";
  const ikhfaa_noonSakinAndTanweens = `((?<ikhfaa_noonSakinAndTanweens>${noonWithOptionalSukoon}|(\\p{L}${fathaKasraDammaWithTanvinWithOptionalShadda}))${nonReadingCharactersAtEndOfWord}${smallHighLettersBetweenWords}${ikhfaaLetters})`;
  const ikhfaa_meemSakin = `(?<ikhfaa_meemSakin>${meemWithOptionalSukoon}${smallHighLettersBetweenWords}\\u0628\\p{M}*)`;
  const ikhfaa = `${ikhfaa_noonSakinAndTanweens}|${ikhfaa_meemSakin}`;

  const idghamWithGhunna_noonSakinAndTanweens = `(?<idghamWithGhunna_noonSakinAndTanweens>(${noonWithOptionalSukoon}|(\\p{L}${fathaKasraDammaWithTanvinWithOptionalShadda}${nonReadingCharactersAtEndOfWord}))${smallHighLettersBetweenWords}(\\u064A|\\u06CC|\\u0645|\\u0646|\\u0648)\\p{M}*)`;
  const idghamWithGhunna_meemSakin = `(?<idghamWithGhunna_meemSakin>(${meemWithOptionalSukoon}${smallHighLettersBetweenWords}\\u0645\\p{M}*\\u0651\\p{M}*))`;
  const idghamWithGhunna = `${idghamWithGhunna_noonSakinAndTanweens}|${idghamWithGhunna_meemSakin}`;

  const idghamWithoutGhunna_noonSakinAndTanweens = `((?<idghamWithoutGhunna_noonSakinAndTanweens>((\\u0646(\\u0652|\\u06E1)?)|\\p{L}${fathaKasraDammaWithTanvinWithOptionalShadda}${nonReadingCharactersAtEndOfWord}))${smallHighLettersBetweenWords}(\\u0644|\\u0631)\\p{M}*)`;
  const idghamWithoutGhunna_shamsiyya = `((\\u0627|\\u0671)(?<idghamWithoutGhunna_shamsiyya>\\u0644)\\p{L}\\u0651\\p{M}*)`;
  const idghamWithoutGhunna = `${idghamWithoutGhunna_noonSakinAndTanweens}|${idghamWithoutGhunna_shamsiyya}`;

  // Adjusted capture group indices manually for JS
  const idghamWithoutGhunna_misleyn = `(?<idghamWithoutGhunna_misleyn>(?:(?!\\u0645)(\\p{L})))\\u0020*\\2\\u0651`;

  const idghamWithoutGhunna_mutajaniseyn_1 = `(?<idghamWithoutGhunna_mutajaniseyn_1>[\\u0637\\u062F\\u062A]${optionalSukoon}${optionalSmallHighLetters})\\u0020*(?!\\1)([\\u0637\\u062F\\u062A]${shadda})`;
  const idghamWithoutGhunna_mutajaniseyn_2 = `(?<idghamWithoutGhunna_mutajaniseyn_2>[\\u0638\\u0630\\u062B]${optionalSukoon}${optionalSmallHighLetters})\\u0020*(?!\\1)([\\u0638\\u0630\\u062B]${shadda})`;
  const idghamWithoutGhunna_mutajaniseyn_3 = `(?<idghamWithoutGhunna_mutajaniseyn_3>[\\u0628\\u0645]${optionalSukoon}${optionalSmallHighLetters})\\u0020*(?!\\1)([\\u0628\\u0645]${shadda})`;

  const idghamWithoutGhunna_mutagaribeyn_1 = `(?<idghamWithoutGhunna_mutagaribeyn_1>[\\u0642\\u0643]${optionalSukoon}${optionalSmallHighLetters})\\u0020*(?!\\1)([\\u0642\\u0643]${shadda})`;
  const idghamWithoutGhunna_mutagaribeyn_2 = `(?<idghamWithoutGhunna_mutagaribeyn_2>[\\u0646\\u0644\\u0631]${optionalSukoon}${optionalSmallHighLetters})\\u0020*(?!\\1)([\\u0646\\u0644\\u0631]${shadda})`;

  const iqlab_noonSakinAndTanweens = `(?<iqlab_noonSakinAndTanweens>\\p{L}\\p{M}*(\\u06E2|\\u06ED))`;

  const izhar_noonSakinAndTanweens = `((?<izhar_noonSakinAndTanweens>${noonWithOptionalSukoon}|(\\p{L}${fathaKasraDammaWithTanvin}))\\u0020*?${throatLettersWithoutExtensionAlef})`;

  const qalqala = `(?<qalqala>((\\u0642|\\u0637|\\u0628|\\u062C|\\u062F)\\u0651?(\\u0652|\\u06E1|(${fathaKasraDammaWithOrWithoutTanvin}?${smallHighLetters}?)$)))`;

  const followingExtensionByTwo = `${smallHighLetters}?((?!(\\p{M}|\\u0020\\u0671)))`;
  const prolonging_byTwo_1_1 = `(\\u064E(?<prolonging_byTwo_1_1>\\u0627)${followingExtensionByTwo})`;
  const prolonging_byTwo_1_2 = `(\\u064E(?<prolonging_byTwo_1_2>\\p{L}\\u0670)${followingExtensionByTwo})`;
  const prolonging_byTwo_1_3 = `(\\u064E(?<prolonging_byTwo_1_3>\\u200A?\\u0670\\u2060?)${followingExtensionByTwo})`;
  const prolonging_byTwo_2 = `(\\u064F(?<prolonging_byTwo_2>(\\u0648|\\u06E5))${followingExtensionByTwo})`;
  const prolonging_byTwo_3_1 = `(\\u0650(?<prolonging_byTwo_3_1>(\\u064A|\\u06CC|\\u06E6|\\u06E7))${followingExtensionByTwo})`;
  const prolonging_byTwo_3_2 = `((?<prolonging_byTwo_3_2>\\u0640\\u06E7)${followingExtensionByTwo})`;
  const prolonging_byTwo_3 = `${prolonging_byTwo_3_1}|${prolonging_byTwo_3_2}`;
  const prolonging_lin = `(\\u064E(?<prolonging_lin>(\\u0648|\\u06E5\\u064A|\\u06CC)${optionalSukoon})\\p{L}\\p{M}*${smallHighLetters}?$)`;
  const prolonging_ivad = `((\\u064B|\\u08F0|\\u0654\\u06E2|\\u064E\\u06E2)(?<prolonging_ivad>\\u0627${smallHighLetters}?)($|\\u0020))`;
  const extensionByTwo = `${prolonging_byTwo_1_1}|${prolonging_byTwo_1_2}|${prolonging_byTwo_1_3}|${prolonging_byTwo_2}|${prolonging_byTwo_3}|${prolonging_lin}|${prolonging_ivad}`;

  const maddLetters =
    "(\\p{L}?\\u200A?\\u0670|\\u0627|\\u0622|\\u0648|\\u06E5|\\u064A|\\u06CC|\\u06E6|\\u06E7)";
  const hamza = "\\u0621";
  const hamzaVariations =
    "(\\u0621|\\u0623|\\u0624|\\u0625|\\u0626|\\u0649\\u0655|\\u0648\\u0654|\\u0627\\u0654|\\u0654|\\u0655)";

  const prolonging_muttasil = `((?<prolonging_muttasil>${maddLetters}\\u2060?\\u06E4?)\\u0640?${hamzaVariations}[^${sukoonWithoutGrouping}])`;

  const prolonging_munfasil_1 = `((?<prolonging_munfasil_1>${maddLetters}\\u06E4?${smallHighLetters}?)(\\u0627${sukoon})?\\u0020${hamzaVariations})`;
  const prolonging_munfasil_2 = `((?<prolonging_munfasil_2>${maddLetters}\\u06E4)$)`;
  const prolonging_munfasil = `${prolonging_munfasil_1}|${prolonging_munfasil_2}`;

  const prolonging_lazim_1 = `((?<prolonging_lazim_1>${maddLetters}\\u06E4?)\\p{L}${shadda})`;
  const prolonging_lazim_2 = `(\\u0621\\u064E(?<prolonging_lazim_2>\\u0627\\u06E4)\\u0644(\\u06E1|\\u0652))`;
  const prolonging_lazim_3 = `(?<prolonging_lazim_3>\\p{L}\\u06E4)`;
  const extensionBySix = `${prolonging_lazim_1}|${prolonging_lazim_2}`;

  const alefTafreeq = `(((\\u0648|\\u06E5)\\p{M}*)(?<alefTafreeq>\\u0627${sukoon}${smallHighLetters}?))`;
  const hamzatulWasli = `([^\\^](?<hamzatulWasli>\\u0671))`;

  const allRules = [
    LAFZATULLAH,
    izhar_noonSakinAndTanweens,
    ikhfaa,
    idghamWithGhunna,
    iqlab_noonSakinAndTanweens,
    qalqala,
    ghunna,
    idghamWithoutGhunna,
    idghamWithoutGhunna_misleyn,
    idghamWithoutGhunna_mutajaniseyn_1,
    idghamWithoutGhunna_mutajaniseyn_2,
    idghamWithoutGhunna_mutajaniseyn_3,
    idghamWithoutGhunna_mutagaribeyn_1,
    idghamWithoutGhunna_mutagaribeyn_2,
    prolonging_muttasil,
    prolonging_munfasil,
    extensionBySix,
    extensionByTwo,
    alefTafreeq,
    hamzatulWasli,
  ];

  const RulePriority = {
    LAFZATULLAH: 1,
    izhar: 2,
    ikhfaa: 3,
    idghamWithGhunna: 4,
    iqlab: 5,
    qalqala: 6,
    idghamWithoutGhunna: 7,
    ghunna: 8,
    prolonging: 9,
    alefTafreeq: 10,
    hamzatulWasli: 11,
    none: 100,
  };

  // Compile regexes with global, unicode, and indices flags
  const compiledRegexes = allRules
    .map((r) => {
      try {
        return new RegExp(r, "gud");
      } catch (e) {
        console.warn("Tajweed Regex failed to compile:", e);
        return null;
      }
    })
    .filter((r) => r !== null);

  function tokenize(ayaText) {
    let results = [];

    for (let regex of compiledRegexes) {
      let match;
      // Reset lastIndex just in case
      regex.lastIndex = 0;
      while ((match = regex.exec(ayaText)) !== null) {
        // Prevent infinite loop if regex matches empty string
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        if (!match.groups) continue;

        for (let groupName in match.groups) {
          const groupValue = match.groups[groupName];
          if (
            groupValue !== undefined &&
            match.indices &&
            match.indices.groups[groupName]
          ) {
            let [start, end] = match.indices.groups[groupName];
            const [ruleName, subruleName, subruleSubindex] =
              groupName.split("_");

            results.push({
              rule: ruleName,
              start: start,
              end: end,
              text: ayaText.substring(start, end),
              priority: RulePriority[ruleName] || 100,
            });
          }
        }
      }
    }

    if (results.length === 0) {
      return [{ rule: "none", text: ayaText, start: 0, end: ayaText.length }];
    }

    results.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.priority - b.priority;
    });

    let hasDeletions = true;
    let delLoopCount = 0;
    while (hasDeletions) {
      delLoopCount++;
      if (delLoopCount > 1000) {
        console.log("Overlap resolution infinite loop detected");
        break;
      }
      hasDeletions = false;
      for (let i = results.length - 1; i > 0; i--) {
        const curr = results[i];
        const prev = results[i - 1];

        // check overlapping
        if (prev.end > curr.start) {
          if (curr.priority < prev.priority) {
            results.splice(i - 1, 1);
          } else {
            results.splice(i, 1);
          }
          hasDeletions = true;
          break;
        }
      }
    }

    let tokens = [];
    let lastEnd = 0;

    results.sort((a, b) => a.start - b.start);

    for (const token of results) {
      if (token.start > lastEnd) {
        tokens.push({
          rule: "none",
          text: ayaText.substring(lastEnd, token.start),
          start: lastEnd,
          end: token.start,
        });
      }
      tokens.push(token);
      lastEnd = token.end;
    }

    if (lastEnd < ayaText.length) {
      tokens.push({
        rule: "none",
        text: ayaText.substring(lastEnd, ayaText.length),
        start: lastEnd,
        end: ayaText.length,
      });
    }

    return tokens;
  }

  return {
    tokenize: tokenize,
  };
})();
