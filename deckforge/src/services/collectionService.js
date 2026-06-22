import { db } from './db';

export async function getCollectionItems() {
  return await db.collection.toArray();
}

export async function getCollectionItem(cardId) {
  return await db.collection.get(Number(cardId));
}

export async function addCardToCollection(cardId, quantity = 1) {
  const id = Number(cardId);
  const existing = await db.collection.get(id);
  const newQty = (existing?.quantity || 0) + quantity;
  if (newQty <= 0) {
    await db.collection.delete(id);
    return null;
  }

  const item = { cardId: id, quantity: newQty };
  await db.collection.put(item);
  return item;
}

export async function updateCollectionQuantity(cardId, quantity) {
  const id = Number(cardId);
  if (quantity <= 0) {
    await db.collection.delete(id);
    return null;
  }
  const item = { cardId: id, quantity };
  await db.collection.put(item);
  return item;
}

export async function removeCardFromCollection(cardId) {
  await db.collection.delete(Number(cardId));
}

export async function clearCollection() {
  await db.collection.clear();
}
