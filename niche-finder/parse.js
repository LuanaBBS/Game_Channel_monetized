// Conversores para os textos que o YouTube exibe (interface em inglês, hl=en).

const UNIT_DAYS = { second: 1 / 86400, minute: 1 / 1440, hour: 1 / 24, day: 1, week: 7, month: 30, year: 365 };
const SHORT_UNITS = { s: 'second', m: 'minute', min: 'minute', h: 'hour', d: 'day', w: 'week', mo: 'month', y: 'year', yr: 'year' };

// "3 weeks ago", "3w ago", "Streamed 2 days ago", "5d ago" -> dias
function ageDays(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  let m = t.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\b/);
  if (m) return Number(m[1]) * UNIT_DAYS[m[2]];
  m = t.match(/(\d+)\s*(mo|min|yr|s|m|h|d|w|y)\b/);
  if (m) return Number(m[1]) * UNIT_DAYS[SHORT_UNITS[m[2]]];
  return null;
}

// "1,188,242 views", "78 thousand views", "1.2 million views", "78K", "No views" -> número
function count(text) {
  if (!text) return 0;
  const t = text.toLowerCase().replace(/,/g, '');
  if (/^no /.test(t)) return 0;
  const m = t.match(/([\d.]+)\s*(k|m|b|thousand|million|billion)?/);
  if (!m) return 0;
  const mult = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 }[m[2]] || 1;
  return Math.round(Number(m[1]) * mult);
}

// "1:30:24" / "45:22" -> segundos
function duration(text) {
  if (!text || !/^\d+(:\d+)+$/.test(text.trim())) return null;
  return text.trim().split(':').reduce((acc, n) => acc * 60 + Number(n), 0);
}

module.exports = { ageDays, count, duration };

// Detecção simples de idioma (pt / en / es) por palavras comuns e acentos.
const WORDS = {
  pt: ['que', 'não', 'nao', 'ela', 'ele', 'uma', 'um', 'com', 'seu', 'sua', 'para', 'filho', 'filha', 'mãe', 'pai', 'você', 'mas', 'quando', 'história', 'marido', 'esposa', 'sogra', 'nora', 'dos', 'das', 'na', 'no', 'pela', 'pelo', 'foi', 'ao', 'os', 'as', 'é', 'e', 'o', 'a', 'de', 'do', 'da', 'em', 'idosa', 'velho', 'menina', 'milionário', 'emocionante'],
  es: ['que', 'no', 'ella', 'él', 'el', 'la', 'los', 'las', 'una', 'un', 'con', 'su', 'sus', 'para', 'hijo', 'hija', 'madre', 'padre', 'pero', 'cuando', 'historia', 'esposo', 'esposa', 'suegra', 'nuera', 'del', 'por', 'fue', 'al', 'y', 'es', 'de', 'en', 'mi', 'anciana', 'viejo', 'niña', 'millonario', 'emocionante', 'se', 'lo'],
  en: ['the', 'and', 'her', 'his', 'she', 'he', 'my', 'you', 'to', 'of', 'was', 'with', 'for', 'but', 'who', 'when', 'story', 'husband', 'wife', 'son', 'daughter', 'mother', 'father', 'in', 'law', 'a', 'an', 'is', 'they', 'him', 'old', 'man', 'woman', 'girl', 'billionaire', 'after', 'what', 'found', 'left', 'never'],
};
function detectLang(texts) {
  const joined = texts.filter(Boolean).join(' ').toLowerCase();
  if (!joined) return null;
  const letters = joined.match(/\p{L}/gu) || [];
  const latin = joined.match(/[a-zà-ÿ]/g) || [];
  if (!letters.length || latin.length / letters.length < 0.85) return null;
  const tokens = joined.match(/[a-zà-ÿñç]+/g) || [];
  const score = { pt: 0, es: 0, en: 0 };
  for (const t of tokens) for (const l of Object.keys(WORDS)) if (WORDS[l].includes(t)) score[l]++;
  score.pt += (joined.match(/[ãõç]/g) || []).length * 2;
  score.es += (joined.match(/[ñ¿¡]/g) || []).length * 2;
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return best[1] >= 2 ? best[0] : null;
}

module.exports.detectLang = detectLang;
