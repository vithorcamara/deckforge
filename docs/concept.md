# DeckForge

**DeckForge** é um Progressive Web App (PWA) para construção, análise e organização de decks de cartas (inicialmente focado em Yu-Gi-Oh! via YGOPRODeck API). O objetivo é ser um ambiente rápido, offline-friendly e orientado à experiência de montagem e otimização de decks.

---

## 🎯 Visão geral

O DeckForge nasce como um **deck builder moderno** com foco em:

- Construção rápida de decks
- Consulta completa de cartas
- Organização local e offline-first
- Análise básica de consistência e coleção
- Comparação entre decks (coleção vs listas prontas)

A ideia central é:  
> “Um deck builder leve, rápido e que funciona mesmo sem internet.”

---

## 🧩 Funcionalidades principais (MVP)

### 📚 Catálogo de cartas
- Listagem completa de cartas via YGOPRODeck API
- Busca por nome (fuzzy search)
- Filtros básicos:
  - Tipo (Monster / Spell / Trap)
  - Atributo
  - Level / Rank
  - Arquétipo
- Visualização detalhada da carta

---

### 🔍 Busca inteligente
- Pesquisa por nome parcial
- Sugestões em tempo real
- Histórico de buscas recente (local)

---

### 🧱 Deck Builder

- Criação de decks (Main / Extra / Side)
- Adicionar/remover cartas com drag & drop (opcional)
- Contadores automáticos:
  - total de cartas
  - limite por deck (40–60 etc.)
- Validação básica de regras

---

### 💾 Salvamento local

- Decks salvos no dispositivo
- Persistência via:
  - IndexedDB (preferencial)
  - fallback: LocalStorage
- Funciona offline

---

### 🌐 Explorar decks

- Lista de decks criados pelo usuário
- Import/export `.ydk`
- Compartilhamento via link (opcional futuro)

---

## 🧠 Funcionalidade avançada (diferencial)

### 📊 Comparação de decks (deck vs coleção)

Sim — isso faz muito sentido e é um dos diferenciais mais fortes do app.

#### Ideia:
O usuário pode comparar:

> “Tenho este deck. O que estou faltando da minha coleção?”

### Possíveis features:

- Diferença entre deck e coleção:
  - Cartas faltantes
  - Cartas substituíveis
- Highlight de:
  - cards missing
  - cards off-meta
- “Completion rate” do deck
- Sugestões de substituição

### Exemplo:

```text
Deck:
- Ash Blossom x3
- Dark Ruler No More x2

Coleção:
- Ash Blossom x1

Resultado:
- Missing: Ash Blossom x2
````

---

### 📈 Análise básica (fase 2)

* Taxa de consistência (hand simulation simples)
* Ratio de:

  * starters
  * extenders
  * bricks
* Sugestões simples de melhoria

---

## ⚙️ Arquitetura técnica

### 🧱 Frontend

* Vite + React + TypeScript
* PWA (vite-plugin-pwa)
* TailwindCSS (opcional)
* Zustand ou Redux Toolkit (estado de deck)

---

### 📦 Dados de cartas

Fonte principal:

* YGOPRODeck API

Estratégia recomendada:

* Cache local de cartas usadas
* Busca direta na API apenas quando necessário
* Stale-while-revalidate via service worker

---

### 💾 Persistência

#### Opção recomendada (ideal)

* IndexedDB (via Dexie.js)

Armazena:

* decks
* cartas recentes
* histórico de busca

#### Alternativa simples (MVP)

* LocalStorage (rápido, mas limitado)

---

### 🌐 Backend (decisão importante)

Aqui existem 3 caminhos:

---

## 🟡 Opção 1 — Sem backend (MVP rápido)

> Tudo rodando no client

* Usa YGOPRODeck API direto
* Decks salvos localmente
* Sem login

### Vantagens:

* zero infra
* rápido de lançar
* offline-first fácil

### Desvantagens:

* sem sync entre dispositivos
* sem comunidade

---

## 🔵 Opção 2 — Firebase (RECOMENDADO para início)

* Firestore para decks
* Auth opcional (Google login)
* Sync automático

### Vantagens:

* backend pronto
* realtime sync
* fácil escalar MVP → produto

### Desvantagens:

* lock-in parcial
* custo futuro se crescer muito

---

## 🔴 Opção 3 — Backend próprio (Node + DB)

* Node (NestJS ou Fastify)
* PostgreSQL ou MongoDB
* API própria de decks

### Vantagens:

* controle total
* escalável
* lógica avançada de decks

### Desvantagens:

* mais tempo
* mais complexidade inicial

---

## 🧠 Recomendação clara

Para o DeckForge:

> Comece com **sem backend + IndexedDB + YGOPRODeck API**

Depois evolua para:

> Firebase (quando quiser sync e login)

Só depois pense em backend próprio.

---

## 📱 PWA (Vite)

Configuração recomendada:

* generate SW (ou injectManifest se quiser controle avançado)
* cache de:

  * app shell
  * cartas acessadas
* offline ready toast (uma vez só)
* update controlado (prompt)

---

## 🚀 Roadmap sugerido

### MVP

* lista de cartas
* busca
* deck builder básico
* salvar local

### V1

* filtros avançados
* export/import `.ydk`
* offline completo
* UI melhorada

### V2

* comparação de decks vs coleção
* análise de consistência
* sugestões inteligentes

### V3

* login + sync (Firebase)
* decks públicos
* sharing system

---

## 💡 Ideia central do produto

> DeckForge não é só um deck builder — é um sistema de decisão para construção de decks.

Foco futuro:

* otimização
* comparação
* análise
* qualidade de mão

---

## 🧠 Stack resumida

* Vite + React + TS
* PWA (vite-plugin-pwa)
* YGOPRODeck API
* IndexedDB (Dexie)
* (opcional futuro) Firebase

---