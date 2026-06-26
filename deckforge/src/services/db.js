import Dexie from 'dexie';

export const db = new Dexie('DeckForgeDatabase');

// Define database schema
// We only specify properties that we want to index
db.version(3).stores({
  cards: 'id, name, type, race, attribute, archetype',
  metadata: 'key',
  decks: 'id, name',
  collection: 'cardId, quantity'
});

db.version(4).stores({
  collection: 'cardId, quantity, setCode',
  binders: 'id, name, rows, cols, pageCount, updatedAt'
});
