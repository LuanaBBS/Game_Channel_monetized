// Configuração do Niche Finder.
// Edite as buscas e os critérios à vontade e rode `node finder.js` de novo.

module.exports = {
  // Idade máxima do PRIMEIRO vídeo do canal, em dias (3 semanas = 21).
  // O YouTube mostra datas arredondadas ("3 weeks ago" = 21 a 27 dias),
  // por isso "3 semanas" é aceito como dentro do limite.
  maxChannelAgeDays: 27,

  // Critérios de "performando bem" (o canal precisa atingir PELO MENOS UM deles).
  performance: {
    minAvgViewsPerVideo: 5000, // média de views por vídeo longo
    minTotalViews: 50000,      // soma das views dos vídeos longos
    minBestVideoViews: 20000,  // views do melhor vídeo
  },

  // Regras de formato (somente vídeos longos).
  minLongVideos: 2,            // mínimo de vídeos longos publicados
  minLongVideoSeconds: 8 * 60, // o que conta como "vídeo longo"
  maxShortsRatio: 0.5,         // shorts / vídeos longos (acima disso o canal é descartado)

  // Pré-filtro nas buscas: só investiga canais cujo vídeo encontrado já tem esse mínimo de views.
  minSearchVideoViews: 3000,

  // Quantas vezes rolar a página de busca (cada rolagem carrega cerca de 20 vídeos).
  searchScrolls: 3,

  // Páginas de canal abertas em paralelo.
  concurrency: 4,

  languages: {
    pt: {
      label: 'Português', gl: 'BR',
      queries: [
        ['história emocionante', 'Histórias emocionantes'],
        ['histórias emocionantes narradas', 'Histórias emocionantes'],
        ['história comovente', 'Histórias emocionantes'],
        ['história real emocionante', 'Histórias emocionantes'],
        ['história para refletir', 'Histórias emocionantes'],
        ['novelinha', 'Novelinhas / drama familiar'],
        ['história de família emocionante', 'Novelinhas / drama familiar'],
        ['nora e sogra história', 'Novelinhas / drama familiar'],
        ['milionário disfarçado história', 'Novelinhas / drama familiar'],
        ['idosa abandonada pelos filhos história', 'Novelinhas / drama familiar'],
        ['história narrada', 'Histórias originais / narradas'],
        ['conto narrado emocionante', 'Histórias originais / narradas'],
      ],
    },
    en: {
      label: 'English', gl: 'US',
      queries: [
        ['emotional story', 'Histórias emocionantes'],
        ['heartwarming story', 'Histórias emocionantes'],
        ['touching life story', 'Histórias emocionantes'],
        ['inspirational story elderly', 'Histórias emocionantes'],
        ['family drama story', 'Novelinhas / drama familiar'],
        ['daughter in law story', 'Novelinhas / drama familiar'],
        ['billionaire disguised story', 'Novelinhas / drama familiar'],
        ['revenge story family', 'Novelinhas / drama familiar'],
        ['old woman abandoned by her children story', 'Novelinhas / drama familiar'],
        ['narrated story', 'Histórias originais / narradas'],
        ['audio drama story', 'Histórias originais / narradas'],
      ],
    },
    es: {
      label: 'Español', gl: 'MX',
      queries: [
        ['historia emocionante', 'Histórias emocionantes'],
        ['historias conmovedoras', 'Histórias emocionantes'],
        ['historia real conmovedora', 'Histórias emocionantes'],
        ['historia de reflexión', 'Histórias emocionantes'],
        ['historia de familia', 'Novelinhas / drama familiar'],
        ['mi nuera historia', 'Novelinhas / drama familiar'],
        ['millonario disfrazado historia', 'Novelinhas / drama familiar'],
        ['anciana abandonada por sus hijos historia', 'Novelinhas / drama familiar'],
        ['historia narrada', 'Histórias originais / narradas'],
        ['relatos de vida narrados', 'Histórias originais / narradas'],
      ],
    },
  },
};
