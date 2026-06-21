import { db } from './db';

/**
 * Gets all user decks from IndexedDB.
 */
export async function getAllDecks() {
  return await db.decks.toArray();
}

/**
 * Gets a deck by its ID.
 */
export async function getDeckById(id) {
  return await db.decks.get(id);
}

/**
 * Saves or updates a deck in IndexedDB.
 * @param {object} deck - The deck object to save.
 */
export async function saveDeck(deck) {
  const now = Date.now();
  const deckToSave = {
    ...deck,
    id: deck.id || `deck_${now}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: deck.createdAt || now,
    updatedAt: now,
    cards: deck.cards || [] // Array of { cardId, quantity, type: 'main' | 'extra' | 'side' }
  };
  
  await db.decks.put(deckToSave);
  return deckToSave;
}

/**
 * Deletes a deck by ID.
 */
export async function deleteDeck(id) {
  await db.decks.delete(id);
}

/**
 * Generates YDK file content (standard YGOPRO format) from a deck.
 */
export function exportToYDK(deck) {
  let content = '#created by DeckForge\n';
  
  const mainCards = deck.cards.filter(c => c.type === 'main');
  const extraCards = deck.cards.filter(c => c.type === 'extra');
  const sideCards = deck.cards.filter(c => c.type === 'side');
  
  content += '#main\n';
  mainCards.forEach(c => {
    for (let i = 0; i < c.quantity; i++) {
      content += `${c.cardId}\n`;
    }
  });
  
  content += '#extra\n';
  extraCards.forEach(c => {
    for (let i = 0; i < c.quantity; i++) {
      content += `${c.cardId}\n`;
    }
  });
  
  content += '!side\n';
  sideCards.forEach(c => {
    for (let i = 0; i < c.quantity; i++) {
      content += `${c.cardId}\n`;
    }
  });
  
  return content;
}

/**
 * Parses YDK file content and creates a new deck object.
 */
export async function importFromYDK(ydkText, deckName) {
  const lines = ydkText.split('\n');
  let currentSection = 'main'; // default
  
  const cardCounts = {
    main: {},
    extra: {},
    side: {}
  };
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    if (line === '#main') {
      currentSection = 'main';
      continue;
    }
    if (line === '#extra') {
      currentSection = 'extra';
      continue;
    }
    if (line === '!side') {
      currentSection = 'side';
      continue;
    }
    
    // Ignore other comments/credits
    if (line.startsWith('#') || line.startsWith('!')) {
      continue;
    }
    
    const cardId = Number(line);
    if (isNaN(cardId)) continue;
    
    cardCounts[currentSection][cardId] = (cardCounts[currentSection][cardId] || 0) + 1;
  }
  
  // Format cards to deck cards structure
  const deckCards = [];
  
  for (const type of ['main', 'extra', 'side']) {
    for (const [idStr, quantity] of Object.entries(cardCounts[type])) {
      const cardId = Number(idStr);
      // Validate in database if card exists (optional but recommended)
      const exists = await db.cards.get(cardId);
      if (exists) {
        deckCards.push({
          cardId,
          quantity: Math.min(quantity, 3), // limit 3 copies max per section
          type
        });
      }
    }
  }
  
  const newDeck = {
    name: deckName || 'Imported Deck',
    cards: deckCards
  };
  
  return await saveDeck(newDeck);
}

/**
 * Pre-populates a user deck from an official card set (booster/structure deck).
 */
export async function createDeckFromSet(setName, deckName) {
  // Query all cards belonging to the set name from IndexedDB
  const matchedCards = await db.cards.filter(c => 
    c.card_sets?.some(s => s.set_name === setName)
  ).toArray();
  
  const deckCards = [];
  
  matchedCards.forEach(card => {
    // Determine section: extra monsters go to extra, others to main
    const isExtra = card.type.includes('Fusion') || 
                    card.type.includes('Synchro') || 
                    card.type.includes('XYZ') || 
                    card.type.includes('Link');
                    
    deckCards.push({
      cardId: card.id,
      quantity: 1, // Default to 1 copy of each card in the set
      type: isExtra ? 'extra' : 'main'
    });
  });
  
  const newDeck = {
    name: deckName || `${setName} (Pre-Built)`,
    cards: deckCards
  };
  
  return await saveDeck(newDeck);
}
