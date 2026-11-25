// Gera index.html (cards dos canais aprovados) a partir de data/channels.json.
// Uso direto: node build-html.js

const fs = require('fs');
const path = require('path');

function buildHtml(data) {
  const channels = data.channels.filter(c => c.approved);
  const payload = JSON.stringify({ generatedAt: data.generatedAt, channels }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Niche Finder Histórias</title>
<style>
:root {
  --bg: #f6f4f0; --surface: #ffffff; --surface-2: #efebe4; --text: #1d1b18; --muted: #6b655c;
  --border: #e2ddd4; --accent: #b4462f; --accent-soft: #f6e3dd; --good: #2f7a4a; --good-soft: #e0f0e5;
  --shadow: 0 1px 2px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #151412; --surface: #1f1d1a; --surface-2: #2a2724; --text: #f1ede6; --muted: #a39c91;
    --border: #36322d; --accent: #e57a60; --accent-soft: #3a2621; --good: #6cc48c; --good-soft: #1f3327;
    --shadow: none;
  }
}
:root[data-theme="dark"] {
  --bg: #151412; --surface: #1f1d1a; --surface-2: #2a2724; --text: #f1ede6; --muted: #a39c91;
  --border: #36322d; --accent: #e57a60; --accent-soft: #3a2621; --good: #6cc48c; --good-soft: #1f3327;
  --shadow: none;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.wrap { max-width: 1240px; margin: 0 auto; padding: 32px 16px 64px; }
header h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: -.02em; }
header p { margin: 0; color: var(--muted); }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; margin: 24px 0 8px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
select, input[type=search] { font: inherit; font-size: 14px; text-transform: none; letter-spacing: 0; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; min-width: 160px; }
.count { color: var(--muted); margin: 8px 0 20px; font-size: 14px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
@media (max-width: 420px) { .grid { grid-template-columns: 1fr; } select, input[type=search] { min-width: 0; width: 100%; } .field { flex: 1 1 140px; } }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow); padding: 16px; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.head { display: flex; gap: 12px; align-items: center; min-width: 0; }
.avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--surface-2); flex: none; object-fit: cover; }
.name { font-weight: 650; font-size: 16px; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.name a { color: inherit; text-decoration: none; }
.name a:hover { text-decoration: underline; }
.handle { color: var(--muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: var(--surface-2); color: var(--muted); }
.tag.new { background: var(--good-soft); color: var(--good); font-weight: 600; }
.tag.lang { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.stat { background: var(--surface-2); border-radius: 10px; padding: 8px 10px; min-width: 0; }
.stat b { display: block; font-size: 17px; font-variant-numeric: tabular-nums; }
.stat span { font-size: 11.5px; color: var(--muted); }
.best { display: flex; gap: 10px; text-decoration: none; color: inherit; min-width: 0; }
.best img { width: 128px; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; flex: none; background: var(--surface-2); }
.best .t { font-size: 13.5px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.best .m { font-size: 12px; color: var(--muted); margin-top: 4px; }
.label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin-bottom: 6px; }
.thumbs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.thumbs a { display: block; }
.thumbs img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px; background: var(--surface-2); display: block; }
.btn { display: inline-block; text-align: center; background: var(--accent); color: #fff; text-decoration: none; padding: 9px 12px; border-radius: 9px; font-weight: 600; font-size: 14px; margin-top: auto; }
.empty { text-align: center; color: var(--muted); padding: 48px 16px; border: 1px dashed var(--border); border-radius: 14px; }
footer { margin-top: 32px; color: var(--muted); font-size: 13px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Niche Finder · Histórias</h1>
    <p>Canais novos (primeiro vídeo há até 3 semanas) de histórias emocionantes, novelinhas e histórias narradas, só com vídeos longos e já performando bem.</p>
  </header>
  <div class="toolbar">
    <label class="field">Idioma<select id="lang"><option value="">Todos</option><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option><option value="other">Outros idiomas</option></select></label>
    <label class="field">Nicho<select id="niche"><option value="">Todos</option></select></label>
    <label class="field">Ordenar por<select id="sort">
      <option value="viewsPerDay">Views por dia</option>
      <option value="avgViews">Média de views por vídeo</option>
      <option value="totalViews">Views totais</option>
      <option value="subscribers">Inscritos</option>
      <option value="firstVideoDays">Mais novos</option>
    </select></label>
    <label class="field">Buscar<input type="search" id="q" placeholder="nome do canal ou vídeo"></label>
  </div>
  <div class="count" id="count"></div>
  <div class="grid" id="grid"></div>
  <footer id="foot"></footer>
</div>
<script id="data" type="application/json">${payload}</script>
<script>
const DATA = JSON.parse(document.getElementById('data').textContent);
const LANG = { pt: 'Português', en: 'English', es: 'Español', other: 'Outro idioma' };
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + ' mi' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + ' mil' : String(n);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
[...new Set(DATA.channels.map(c => c.niche))].sort().forEach(n => $('niche').insertAdjacentHTML('beforeend', '<option>' + esc(n) + '</option>'));
$('foot').textContent = 'Dados coletados em ' + new Date(DATA.generatedAt).toLocaleString('pt-BR') + '. Views e datas são aproximadas, como o YouTube exibe publicamente.';

function card(c) {
  const b = c.bestVideo;
  const thumbs = c.recentVideos.slice(0, 3).map(v => '<a href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener" title="' + esc(v.title) + '"><img loading="lazy" src="https://i.ytimg.com/vi/' + esc(v.id) + '/mqdefault.jpg" alt=""></a>').join('');
  return '<article class="card">' +
    '<div class="head">' + (c.avatar ? '<img class="avatar" loading="lazy" src="' + esc(c.avatar) + '" alt="">' : '<div class="avatar"></div>') +
      '<div style="min-width:0"><div class="name"><a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.name) + '</a></div>' +
      '<div class="handle">' + esc(c.handle || '') + (c.subscribersLabel ? ' · ' + esc(c.subscribersLabel.replace('subscribers', 'inscritos')) : '') + '</div></div></div>' +
    '<div class="tags"><span class="tag lang">' + esc(LANG[c.lang] || c.lang) + '</span><span class="tag">' + esc(c.niche) + '</span><span class="tag new">1º vídeo há ' + c.firstVideoDays + ' dias</span></div>' +
    '<div class="stats">' +
      '<div class="stat"><b>' + fmt(c.viewsPerDay) + '</b><span>views/dia</span></div>' +
      '<div class="stat"><b>' + fmt(c.avgViews) + '</b><span>média/vídeo</span></div>' +
      '<div class="stat"><b>' + fmt(c.totalViews) + '</b><span>views totais</span></div>' +
      '<div class="stat"><b>' + c.longVideoCount + '</b><span>vídeos longos</span></div>' +
      '<div class="stat"><b>' + fmt(c.subscribers) + '</b><span>inscritos</span></div>' +
      '<div class="stat"><b>' + c.shorts + '</b><span>shorts</span></div>' +
    '</div>' +
    (b ? '<div><div class="label">Melhor vídeo</div><a class="best" href="https://www.youtube.com/watch?v=' + esc(b.id) + '" target="_blank" rel="noopener"><img loading="lazy" src="https://i.ytimg.com/vi/' + esc(b.id) + '/mqdefault.jpg" alt=""><div style="min-width:0"><div class="t">' + esc(b.title) + '</div><div class="m">' + fmt(b.views) + ' views · ' + esc(b.lengthText) + '</div></div></a></div>' : '') +
    (thumbs ? '<div><div class="label">Vídeos recentes</div><div class="thumbs">' + thumbs + '</div></div>' : '') +
    '<a class="btn" href="' + esc(c.url) + '/videos" target="_blank" rel="noopener">Abrir canal</a>' +
  '</article>';
}

function render() {
  const lang = $('lang').value, niche = $('niche').value, sort = $('sort').value, q = $('q').value.trim().toLowerCase();
  let list = DATA.channels.filter(c => (!lang || c.lang === lang) && (!niche || c.niche === niche) &&
    (!q || (c.name + ' ' + c.recentVideos.map(v => v.title).join(' ')).toLowerCase().includes(q)));
  list.sort((a, b) => sort === 'firstVideoDays' ? a.firstVideoDays - b.firstVideoDays : b[sort] - a[sort]);
  $('count').textContent = list.length + ' canal(is) encontrado(s)';
  $('grid').innerHTML = list.length ? list.map(card).join('') : '<div class="empty">Nenhum canal com esses filtros.</div>';
}
['lang', 'niche', 'sort'].forEach(id => $(id).addEventListener('change', render));
$('q').addEventListener('input', render);
render();
</script>
</body>
</html>
`;
}

module.exports = { buildHtml };

if (require.main === module) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'channels.json'), 'utf8'));
  fs.writeFileSync(path.join(__dirname, 'index.html'), buildHtml(data));
  console.log('index.html gerado com', data.channels.filter(c => c.approved).length, 'canais');
}
