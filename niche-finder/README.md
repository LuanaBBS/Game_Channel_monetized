# Niche Finder · Histórias

Encontra **canais novos** do YouTube nos nichos de **histórias emocionantes, novelinhas / drama familiar e histórias narradas**, em **português, inglês e espanhol**, que:

- publicaram o **primeiro vídeo há 3 semanas ou menos**;
- postam **vídeos longos** (canais com muitos shorts são descartados);
- já estão **performando bem** (média de views, views totais ou um vídeo forte).

Não usa a API do YouTube. O script abre as páginas num navegador Chromium sem interface (Playwright), como um visitante comum, e lê os dados públicos exibidos.

## Como rodar

Requer Node.js 18 ou mais novo.

```bash
cd niche-finder
npm install
npx playwright install chromium
node finder.js
```

Ao final, abra `niche-finder/index.html` no navegador.

Para rodar só alguns idiomas: `node finder.js --langs=pt,es`

Para analisar só os melhores canais de outros idiomas, reaproveitando as buscas já feitas: `node finder.js --extras-only`

Para regerar só a página a partir dos dados já coletados: `node build-html.js`

## Como funciona

1. **Busca**: para cada termo de `config.js`, pesquisa no YouTube com os filtros "este mês", "vídeos", duração "4–20 min" e "> 20 min", ordenando por visualizações.
2. **Pré-filtro**: fica só com vídeos de até ~3 semanas e com um mínimo de views. Canais com títulos em outros idiomas (hindi, alemão, árabe...) não são descartados: entram os 25 com mais views (`otherLanguages.maxChannels`), no filtro "Outros idiomas".
3. **Análise do canal**: abre a aba *Vídeos* e a aba *Shorts* de cada canal e calcula a data do primeiro vídeo, o total de views, a média por vídeo, as views por dia, o melhor vídeo e a quantidade de shorts.
4. **Aprovação**: o canal entra na página se passar em todos os critérios de `config.js`.
5. **Página**: gera `index.html` com os cards, filtros por idioma e nicho, e ordenação.

Os dados brutos ficam em `data/channels.json`, com os canais descartados e o motivo, e em `data/search-hits.json`.

## Ajustes (config.js)

| Opção | Padrão | O que faz |
|---|---|---|
| `maxChannelAgeDays` | 27 | Idade máxima do primeiro vídeo. O YouTube arredonda: "3 weeks ago" vale de 21 a 27 dias. |
| `performance.*` | 5 mil / 50 mil / 20 mil | Média por vídeo, views totais e melhor vídeo. Basta atingir um deles. |
| `minLongVideos` | 2 | Mínimo de vídeos longos. |
| `minLongVideoSeconds` | 480 | Duração mínima para contar como vídeo longo (8 min). |
| `maxShortsRatio` | 0.5 | Proporção máxima de shorts em relação aos vídeos longos. |
| `otherLanguages.maxChannels` | 25 | Quantos canais de outros idiomas analisar (os com mais views). |
| `languages.*.queries` | — | Termos de busca e o nicho de cada um. |

## Limitações

- As datas são relativas ("2 weeks ago"), então a idade do canal é aproximada.
- O YouTube pode mudar o layout da página. Se a coleta parar de funcionar, os seletores em `finder.js` precisam ser atualizados.
- Use com moderação: rodar várias vezes seguidas pode fazer o YouTube pedir verificação.
