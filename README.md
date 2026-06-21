# DeckForge

DeckForge é uma aplicação web para explorar cartas de Yu-Gi-Oh!, montar decks e gerenciar uma coleção pessoal.

## Visão geral

- Catálogo de cartas com filtros por tipo, atributo, raça, arquétipo e conjunto
- Editor de deck com suporte a main deck, extra deck e side deck
- Persistência local com IndexedDB/Dexie
- Suporte a instalação como PWA em navegadores compatíveis

## Estrutura do projeto

- `deckforge/` — aplicação React/Vite principal
- `docs/` — documentação do projeto

## Como executar

Entre na pasta da aplicação:

```bash
cd deckforge
npm install
npm run dev
```

A aplicação ficará disponível no navegador em modo de desenvolvimento.

## Build para produção

```bash
cd deckforge
npm run build
```

O resultado será gerado na pasta `dist`.

## Visualização da build

```bash
cd deckforge
npm run preview
```

## PWA

O projeto já está configurado para funcionar como Progressive Web App com manifest e service worker.
Em navegadores compatíveis, a opção de instalação pode aparecer automaticamente ao acessar a aplicação em produção.

## Documentação

Consulte a pasta [docs](docs) para mais detalhes sobre o projeto e a API utilizada.
