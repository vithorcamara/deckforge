import { db } from './db';

// In-memory cache for fast search indexes
let cardSearchIndex = [];
let cachedArchetypes = [];
let cachedSets = [];
let cachedRarities = [];

/**
 * Checks if the local database is up to date and syncs it with YGOPRODeck API.
 * @param {function} onProgress - Callback to notify progress updates.
 */
export async function checkAndSyncCards(onProgress = () => {}) {
  try {
    const localCount = await db.cards.count();
    
    // Check connection by hitting the version check endpoint
    onProgress({ status: 'checking', message: 'Verificando versão do banco de dados...' });
    
    let remoteVer = null;
    try {
      const response = await fetch('https://db.ygoprodeck.com/api/v7/checkDBVer.php');
      const data = await response.json();
      if (data && data[0]) {
        remoteVer = data[0];
      }
    } catch (e) {
      console.warn('Falha ao conectar na API. Operando em modo offline.', e);
    }

    const localVerRecord = await db.metadata.get('db_version');
    const localVer = localVerRecord ? localVerRecord.value : null;
    const localUpdateRecord = await db.metadata.get('last_update');
    const localUpdate = localUpdateRecord ? localUpdateRecord.value : null;

    // Sync is needed if we have no cards locally, or if the remote version is newer
    const needsSync = localCount === 0 || 
      (remoteVer && (localVer !== remoteVer.database_version || localUpdate !== remoteVer.last_update));

    if (needsSync && remoteVer) {
      onProgress({ status: 'fetching', message: 'Baixando banco de cartas (cerca de 25MB)...' });
      
      // Fetching cards in English
      const res = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
      if (!res.ok) throw new Error('Falha ao baixar os dados das cartas.');
      
      const cardData = await res.json();
      
      onProgress({ status: 'saving', message: 'Gravando cartas no banco de dados local...' });
      
      await db.transaction('rw', db.cards, db.metadata, async () => {
        await db.cards.clear();
        // Insert in bulk for performance
        await db.cards.bulkPut(cardData.data);
        
        await db.metadata.put({ key: 'db_version', value: remoteVer.database_version });
        await db.metadata.put({ key: 'last_update', value: remoteVer.last_update });
      });
      
      console.log('Sincronização concluída com sucesso!');
    } else {
      console.log('Banco de dados local já está atualizado.');
    }

    onProgress({ status: 'indexing', message: 'Carregando índices de busca em memória...' });
    await loadSearchIndex();
    onProgress({ status: 'ready', message: 'Banco de dados pronto e offline!' });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    // If we have local data, fallback to it
    const localCount = await db.cards.count();
    if (localCount > 0) {
      onProgress({ status: 'indexing', message: 'Carregando índices locais (modo offline)...' });
      await loadSearchIndex();
      onProgress({ status: 'ready', message: 'Pronto (Modo Offline)!' });
    } else {
      onProgress({ status: 'error', message: `Erro ao iniciar: ${error.message}. Verifique a conexão com a internet.` });
    }
  }
}

/**
 * Loads a lightweight subset of cards in memory for fast filtering.
 */
async function loadSearchIndex() {
  const cards = await db.cards.toArray();
  
  cardSearchIndex = cards.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    race: c.race,
    attribute: c.attribute,
    archetype: c.archetype,
    // Store sets list for local filtering
    sets: c.card_sets?.map(s => s.set_name) || [],
    setCodes: c.card_sets?.map(s => s.set_code) || [],
    rarities: c.card_sets?.map(s => s.set_rarity).filter(Boolean) || [],
    // Store small image url for direct usage in catalog
    image_url_small: c.card_images?.[0]?.image_url_small || '',
    image_url: c.card_images?.[0]?.image_url || '',
    // Quick search text representation
    searchText: `${c.name.toLowerCase()} ${c.desc?.toLowerCase() || ''} ${c.archetype?.toLowerCase() || ''} ${c.card_sets?.map(s => s.set_code.toLowerCase()).join(' ') || ''}`
  }));

  // Extract unique archetypes, sets and rarities
  const archetypesSet = new Set();
  const setsSet = new Set();
  const raritiesSet = new Set();
  
  cards.forEach(c => {
    if (c.archetype) archetypesSet.add(c.archetype);
    if (c.card_sets) {
      c.card_sets.forEach(s => {
        if (s.set_name) setsSet.add(s.set_name);
        if (s.set_rarity) raritiesSet.add(s.set_rarity);
      });
    }
  });
  
  cachedArchetypes = Array.from(archetypesSet).sort();
  cachedSets = Array.from(setsSet).sort();
  cachedRarities = Array.from(raritiesSet).sort();
}

/**
 * Returns a list of unique archetypes found in the database.
 */
export function getArchetypes() {
  return cachedArchetypes;
}

/**
 * Returns a list of unique sets found in the database.
 */
export function getCardSets() {
  return cachedSets;
}

export function getRarities() {
  return cachedRarities;
}

/**
 * Searches cards using the in-memory index.
 * @param {object} params - Search filters.
 * @returns {Array} List of matched cards.
 */
export function searchCards({ query = '', type = '', attribute = '', race = '', archetype = '', set = '', rarity = '', limit = 40, page = 1 }) {
  let results = cardSearchIndex;

  // Text search
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(c => c.searchText.includes(lowerQuery));
  }

  // Type filter (Monster, Spell, Trap)
  if (type) {
    if (type === 'Monster') {
      results = results.filter(c => !c.type.includes('Spell') && !c.type.includes('Trap'));
    } else if (type === 'Spell') {
      results = results.filter(c => c.type.includes('Spell'));
    } else if (type === 'Trap') {
      results = results.filter(c => c.type.includes('Trap'));
    }
  }

  // Attribute filter (LIGHT, DARK, etc.)
  if (attribute) {
    results = results.filter(c => c.attribute === attribute);
  }

  // Race/Type filter (Spellcaster, Dragon, etc. or Normal, Field for Spells/Traps)
  if (race) {
    results = results.filter(c => c.race === race);
  }

  // Archetype filter
  if (archetype) {
    results = results.filter(c => c.archetype === archetype);
  }

  // Rarity filter
  if (rarity) {
    results = results.filter(c => c.rarities.includes(rarity));
  }

  // Set filter
  if (set) {
    results = results.filter(c => c.sets.includes(set));
  }

  const totalResults = results.length;
  const offset = (page - 1) * limit;
  const paginatedResults = results.slice(offset, offset + limit);

  return {
    cards: paginatedResults,
    total: totalResults,
    hasMore: offset + limit < totalResults
  };
}

/**
 * Returns all cards that belong to a specific set name.
 */
export async function getCardsBySetName(setName) {
  return await db.cards.filter(c => c.card_sets?.some(s => s.set_name === setName)).toArray();
}

/**
 * Fetches full details of a card from IndexedDB.
 * @param {number} id - Card passcode.
 */
export async function getCardById(id) {
  return await db.cards.get(Number(id));
}
