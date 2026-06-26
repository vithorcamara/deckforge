import { db } from './db';

function generateBinderId() {
  return `binder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createSlots(rows, cols, existingSlots = []) {
  const total = rows * cols;
  return Array.from({ length: total }, (_, index) => ({
    id: existingSlots[index]?.id || `slot_${index + 1}`,
    cardId: existingSlots[index]?.cardId || null
  }));
}

export function createEmptyBinder(name, rows = 3, cols = 3, pageCount = 3) {
  return {
    id: null,
    name: name || 'Novo Binder',
    rows,
    cols,
    pageCount,
    pages: Array.from({ length: pageCount }, (_, pageIndex) => ({
      pageIndex,
      slots: createSlots(rows, cols)
    }))
  };
}

export async function getAllBinders() {
  return await db.binders.toArray();
}

export async function getBinderById(id) {
  return await db.binders.get(id);
}

export async function saveBinder(binder) {
  const now = Date.now();
  const binderToSave = {
    ...binder,
    id: binder.id || generateBinderId(),
    name: binder.name || 'Binder sem título',
    rows: binder.rows || 3,
    cols: binder.cols || 3,
    pageCount: binder.pageCount || 1,
    pages: Array.isArray(binder.pages) ? binder.pages : [],
    createdAt: binder.createdAt || now,
    updatedAt: now
  };

  await db.binders.put(binderToSave);
  return binderToSave;
}

export async function deleteBinder(id) {
  await db.binders.delete(id);
}

export function exportBinderJSON(binder) {
  return JSON.stringify(binder, null, 2);
}

export async function importBinderJSON(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Conteúdo inválido de Binder.');
  }

  const rows = parsed.rows || 3;
  const cols = parsed.cols || 3;
  const pageCount = parsed.pageCount || 1;
  const pages = Array.isArray(parsed.pages)
    ? parsed.pages.map((page, pageIndex) => ({
      pageIndex,
      slots: createSlots(rows, cols, page.slots)
    }))
    : Array.from({ length: pageCount }, (_, pageIndex) => ({
      pageIndex,
      slots: createSlots(rows, cols)
    }));

  const binder = {
    id: parsed.id || generateBinderId(),
    name: parsed.name || 'Binder Importado',
    rows,
    cols,
    pageCount,
    pages,
    createdAt: parsed.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  return await saveBinder(binder);
}
