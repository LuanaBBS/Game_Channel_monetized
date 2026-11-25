// Niche Finder: encontra canais novos de histórias (vídeos longos) que já estão performando bem.
// Funciona como um visitante comum: abre as páginas do YouTube num Chromium sem interface
// (Playwright) e lê os dados exibidos. Não usa a API do YouTube.
//
// Uso:  node finder.js            (busca + análise dos canais + gera index.html)
//       node finder.js --langs=pt,es
//       node build-html.js        (só regera a página a partir de data/channels.json)

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const cfg = require('./config');
const { ageDays, count, duration, detectLang } = require('./parse');
const { buildHtml } = require('./build-html');

const DATA_DIR = path.join(__dirname, 'data');
const SEARCH_PARAMS = {
  long: 'CAMSBggEEAEYAg%3D%3D',   // ordenar por views, este mês, vídeos, > 20 min
  medium: 'CAMSBggEEAEYAw%3D%3D', // ordenar por views, este mês, vídeos, 4 a 20 min
};

const argLangs = (process.argv.find(a => a.startsWith('--langs=')) || '').split('=')[1];
const langs = argLangs ? argLangs.split(',') : Object.keys(cfg.languages);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function scrollToEnd(page, times, selector) {
  let last = -1;
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    const n = await page.$$eval(selector, els => els.length);
    if (n === last) break;
    last = n;
  }
}

async function searchOne(page, lang, query, niche, kind) {
  const { gl } = cfg.languages[lang];
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=${SEARCH_PARAMS[kind]}&hl=en&gl=${gl}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  try { await page.waitForSelector('ytd-video-renderer', { timeout: 15000 }); } catch { return []; }
  await scrollToEnd(page, cfg.searchScrolls, 'ytd-video-renderer');
  const rows = await page.$$eval('ytd-video-renderer', els => els.map(e => {
    const d = e.data || (e.__data && e.__data.data);
    if (!d) return null;
    const owner = d.ownerText && d.ownerText.runs && d.ownerText.runs[0];
    return {
      videoId: d.videoId,
      title: d.title && d.title.runs && d.title.runs.map(r => r.text).join(''),
      published: d.publishedTimeText && d.publishedTimeText.simpleText,
      views: d.viewCountText && (d.viewCountText.simpleText || (d.viewCountText.runs || []).map(r => r.text).join('')),
      length: d.lengthText && d.lengthText.simpleText,
      channelId: owner && owner.navigationEndpoint && owner.navigationEndpoint.browseEndpoint && owner.navigationEndpoint.browseEndpoint.browseId,
      channelName: owner && owner.text,
    };
  }).filter(Boolean));
  return rows.map(r => ({ ...r, lang, niche, query }));
}

function lockupToVideo(l) {
  const md = l.metadata && l.metadata.lockupMetadataViewModel;
  const parts = (((md || {}).metadata || {}).contentMetadataViewModel || {}).metadataRows || [];
  const flat = parts.flatMap(r => r.metadataParts || []);
  const labels = flat.map(p => p.accessibilityLabel || (p.text && p.text.content) || '');
  const viewsLabel = labels.find(t => /view/i.test(t)) || '';
  const ageLabel = labels.find(t => /ago/i.test(t)) || '';
  const img = l.contentImage && l.contentImage.thumbnailViewModel;
  const badges = ((img && img.overlays) || []).flatMap(o => (o.thumbnailBottomOverlayViewModel || {}).badges || []);
  const lengthText = (badges.map(b => b.thumbnailBadgeViewModel && b.thumbnailBadgeViewModel.text).find(Boolean)) || '';
  return {
    id: l.contentId,
    title: md && md.title && md.title.content,
    viewsLabel, ageLabel, lengthText,
  };
}

async function inspectChannel(page, channelId) {
  const base = `https://www.youtube.com/channel/${channelId}`;
  await page.goto(`${base}/videos?hl=en&gl=US`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const header = await page.evaluate(() => {
    const d = window.ytInitialData || {};
    const h = d.header && d.header.pageHeaderRenderer;
    const vm = h && h.content && h.content.pageHeaderViewModel;
    const rows = (vm && vm.metadata && vm.metadata.contentMetadataViewModel && vm.metadata.contentMetadataViewModel.metadataRows) || [];
    const parts = rows.flatMap(r => (r.metadataParts || []).map(p => p.text && p.text.content));
    const srcs = (vm && vm.image && vm.image.decoratedAvatarViewModel && vm.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources) || [];
    const tabs = ((d.contents && d.contents.twoColumnBrowseResultsRenderer && d.contents.twoColumnBrowseResultsRenderer.tabs) || [])
      .map(t => t.tabRenderer && t.tabRenderer.title).filter(Boolean);
    return {
      name: h && h.pageTitle,
      handle: parts.find(p => p && p.startsWith('@')),
      subscribers: parts.find(p => p && /subscriber/i.test(p)),
      videos: parts.find(p => p && /video/i.test(p)),
      avatar: (srcs[srcs.length - 1] || {}).url,
      tabs,
    };
  });
  const hasVideos = await page.waitForSelector('ytd-rich-item-renderer', { timeout: 10000 }).then(() => true).catch(() => false);
  if (!hasVideos) return { ...header, longVideos: [], complete: true, shorts: 0 };
  await scrollToEnd(page, 8, 'ytd-rich-item-renderer');
  const lockups = await page.$$eval('ytd-rich-item-renderer', els => els.map(e => {
    const c = (e.data && e.data.content) || (e.__data && e.__data.data && e.__data.data.content) || {};
    return c.lockupViewModel || null;
  }).filter(Boolean));
  const complete = await page.$$eval('ytd-continuation-item-renderer', els => els.length === 0);
  const longVideos = lockups.map(lockupToVideo);

  let shorts = 0;
  if (header.tabs.includes('Shorts')) {
    await page.goto(`${base}/shorts?hl=en&gl=US`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (await page.waitForSelector('ytd-rich-item-renderer', { timeout: 8000 }).then(() => true).catch(() => false)) {
      await scrollToEnd(page, 3, 'ytd-rich-item-renderer');
      shorts = await page.$$eval('ytd-rich-item-renderer', els => els.length);
    }
  }
  return { ...header, longVideos, complete, shorts };
}

function evaluate(ch, hit) {
  const vids = ch.longVideos.map(v => ({
    id: v.id,
    title: v.title,
    views: count(v.viewsLabel),
    ageDays: ageDays(v.ageLabel),
    ageLabel: v.ageLabel,
    seconds: duration(v.lengthText),
    lengthText: v.lengthText,
  }));
  const long = vids.filter(v => (v.seconds || 0) >= cfg.minLongVideoSeconds);
  const ages = vids.map(v => v.ageDays).filter(a => a != null);
  const firstAge = ages.length ? Math.max(...ages) : null;
  const totalViews = long.reduce((s, v) => s + v.views, 0);
  const avgViews = long.length ? Math.round(totalViews / long.length) : 0;
  const best = long.slice().sort((a, b) => b.views - a.views)[0];
  const p = cfg.performance;
  const reasons = [];
  const channelLang = detectLang(vids.map(v => v.title));
  if (hit.lang !== 'other' && channelLang !== hit.lang) reasons.push(`idioma dos títulos: ${channelLang || 'outro'}`);
  if (!ch.complete) reasons.push('canal com muitos vídeos (provavelmente mais antigo)');
  if (firstAge == null || firstAge > cfg.maxChannelAgeDays) reasons.push(`primeiro vídeo há ${firstAge == null ? '?' : Math.round(firstAge)} dias`);
  if (long.length < cfg.minLongVideos) reasons.push(`só ${long.length} vídeos longos`);
  if (long.length && ch.shorts / long.length > cfg.maxShortsRatio) reasons.push(`muitos shorts (${ch.shorts})`);
  const performing = avgViews >= p.minAvgViewsPerVideo || totalViews >= p.minTotalViews || (best && best.views >= p.minBestVideoViews);
  if (!performing) reasons.push('performance abaixo do critério');
  return {
    channelId: hit.channelId,
    name: ch.name || hit.channelName,
    handle: ch.handle || null,
    url: `https://www.youtube.com/channel/${hit.channelId}`,
    avatar: ch.avatar || null,
    subscribers: count(ch.subscribers),
    subscribersLabel: ch.subscribers || '',
    lang: hit.lang,
    niche: hit.niche,
    queries: hit.queries,
    longVideoCount: long.length,
    shorts: ch.shorts,
    firstVideoDays: firstAge == null ? null : Math.round(firstAge),
    firstVideoLabel: (vids.find(v => v.ageDays === firstAge) || {}).ageLabel || '',
    totalViews, avgViews,
    viewsPerDay: firstAge ? Math.round(totalViews / Math.max(firstAge, 1)) : totalViews,
    bestVideo: best || null,
    recentVideos: long.slice(0, 6),
    approved: reasons.length === 0,
    reasons,
  };
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; await fn(items[idx], idx); }
  }));
}

// Agrupa os vídeos encontrados por canal. Retorna [canais no idioma pedido, melhores canais de outros idiomas].
function pickCandidates(hits) {
  const own = new Map(), other = new Map();
  for (const h of hits) {
    if (!h.channelId) continue;
    const age = ageDays(h.published);
    const views = count(h.views);
    if (age == null || age > cfg.maxChannelAgeDays || views < cfg.minSearchVideoViews) continue;
    const lang = detectLang([h.title]);
    const target = lang === h.lang ? own : other;
    const c = target.get(h.channelId) || { channelId: h.channelId, channelName: h.channelName, lang: lang === h.lang ? h.lang : 'other', niche: h.niche, queries: new Set(), bestHitViews: 0 };
    c.queries.add(h.query);
    c.bestHitViews = Math.max(c.bestHitViews, views);
    target.set(h.channelId, c);
  }
  for (const id of own.keys()) other.delete(id);
  const norm = m => [...m.values()].map(c => ({ ...c, queries: [...c.queries] }));
  const others = norm(other).sort((a, b) => b.bestHitViews - a.bestHitViews).slice(0, cfg.otherLanguages.maxChannels);
  return [norm(own), others];
}

async function analyze(context, candidates) {
  const results = [];
  await pool(candidates, cfg.concurrency, async (hit, idx) => {
    const p = await context.newPage();
    try {
      const ch = await inspectChannel(p, hit.channelId);
      const r = evaluate(ch, hit);
      results.push(r);
      log(`(${idx + 1}/${candidates.length}) ${r.approved ? 'APROVADO' : 'descartado'} ${r.name}${r.approved ? '' : ' — ' + r.reasons.join('; ')}`);
    } catch (e) {
      log(`(${idx + 1}/${candidates.length}) erro em ${hit.channelId}: ${e.message.split('\n')[0]}`);
    } finally { await p.close(); }
  });
  return results;
}

(async () => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const extrasOnly = process.argv.includes('--extras-only');
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 900 } });

  // 1) Buscas (ou reaproveita as já salvas com --extras-only)
  let hits = [];
  if (extrasOnly) {
    hits = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'search-hits.json'), 'utf8'));
  } else {
    const page = await context.newPage();
    for (const lang of langs) {
      for (const [query, niche] of cfg.languages[lang].queries) {
        for (const kind of Object.keys(SEARCH_PARAMS)) {
          try {
            const rows = await searchOne(page, lang, query, niche, kind);
            hits.push(...rows);
            log(`[${lang}] "${query}" (${kind}): ${rows.length} vídeos`);
          } catch (e) { log(`[${lang}] "${query}" (${kind}) falhou: ${e.message.split('\n')[0]}`); }
        }
      }
    }
    await page.close();
    fs.writeFileSync(path.join(DATA_DIR, 'search-hits.json'), JSON.stringify(hits, null, 1));
  }

  // 2) Pré-filtro
  const [own, others] = pickCandidates(hits);
  log(`${hits.length} vídeos encontrados, ${own.length} canais no idioma pedido + ${others.length} melhores de outros idiomas`);

  // 3) Analisa cada canal
  let results;
  if (extrasOnly) {
    const prev = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'channels.json'), 'utf8')).channels;
    const done = new Set(prev.map(c => c.channelId));
    results = prev.concat(await analyze(context, others.filter(c => !done.has(c.channelId))));
  } else {
    results = await analyze(context, own.concat(others));
  }
  await browser.close();

  const out = { generatedAt: new Date().toISOString(), criteria: cfg, channels: results };
  fs.writeFileSync(path.join(DATA_DIR, 'channels.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(__dirname, 'index.html'), buildHtml(out));
  log(`Pronto: ${results.filter(r => r.approved).length} canais aprovados de ${results.length}. Página: niche-finder/index.html`);
})();
