import { useEffect, useMemo, useState } from 'react';
import { searchCards, getCardById } from '../../services/cardService';
import { getCollectionItems } from '../../services/collectionService';
import {
  createEmptyBinder,
  getAllBinders,
  saveBinder,
  deleteBinder,
  exportBinderJSON,
  importBinderJSON
} from '../../services/binderService';
import CardDetailModal from '../../components/CardDetailModal';
import appLogo from '/favicon.png';
import './style.css';

function createSlots(rows, cols, existingSlots = []) {
  const total = rows * cols;
  return Array.from({ length: total }, (_, index) => ({
    id: existingSlots[index]?.id || `slot_${index + 1}`,
    cardId: existingSlots[index]?.cardId || null
  }));
}

function getMaxBinderCopies(collectionQty) {
  return Math.max(1, Math.min(collectionQty, 3));
}

export default function Binder() {
  const [binders, setBinders] = useState([]);
  const [selectedBinderId, setSelectedBinderId] = useState(null);
  const [currentBinder, setCurrentBinder] = useState(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [createName, setCreateName] = useState('Novo Binder');
  const [createRows, setCreateRows] = useState(3);
  const [createCols, setCreateCols] = useState(3);
  const [createPageCount, setCreatePageCount] = useState(3);
  const [localQuery, setLocalQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [collectionQuantities, setCollectionQuantities] = useState({});
  const [collectionSetNames, setCollectionSetNames] = useState(new Set());
  const [slotDetails, setSlotDetails] = useState({});
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importError, setImportError] = useState('');

  const loadBinders = async () => {
    setLoading(true);
    try {
      const allBinders = await getAllBinders();
      setBinders(allBinders.sort((a, b) => b.updatedAt - a.updatedAt));
      if (!selectedBinderId && allBinders.length > 0 && !currentBinder) {
        openBinder(allBinders[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar binders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionInfo = async () => {
    const collection = await getCollectionItems();
    const quantities = {};
    const setNames = new Set();

    await Promise.all(collection.map(async (item) => {
      const card = await getCardById(item.cardId);
      if (card) {
        quantities[item.cardId] = item.quantity;
        card.card_sets?.forEach((set) => {
          if (set.set_name) setNames.add(set.set_name);
        });
      }
    }));

    setCollectionQuantities(quantities);
    setCollectionSetNames(setNames);
  };

  useEffect(() => {
    loadBinders();
    loadCollectionInfo();
  }, []);

  useEffect(() => {
    if (!currentBinder) return;
    const cardIds = Array.from(new Set(
      currentBinder.pages.flatMap((page) => page.slots.filter((slot) => slot.cardId).map((slot) => slot.cardId))
    ));
    const details = {};
    Promise.all(cardIds.map(async (cardId) => {
      const card = await getCardById(cardId);
      if (card) details[cardId] = card;
    })).then(() => setSlotDetails(details));
  }, [currentBinder]);

  useEffect(() => {
    if (!currentBinder || !localQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const result = searchCards({ query: localQuery, limit: 50 });
    const filtered = result.cards.filter((card) => {
      if (collectionQuantities[card.id] > 0) return true;
      return card.sets?.some((setName) => collectionSetNames.has(setName));
    }).slice(0, 40);
    setSearchResults(filtered);
  }, [localQuery, currentBinder, collectionQuantities, collectionSetNames]);

  const isCardAllowed = (card) => {
    if (collectionQuantities[card.id] > 0) return true;
    return card.sets?.some((setName) => collectionSetNames.has(setName));
  };

  const openBinder = (binder) => {
    setSelectedBinderId(binder.id);
    setCurrentBinder({
      ...binder,
      pages: binder.pages.map((page) => ({
        ...page,
        slots: createSlots(binder.rows, binder.cols, page.slots)
      }))
    });
    setSelectedPageIndex(0);
    setSelectedSlotId(binder.pages?.[0]?.slots?.[0]?.id || null);
    setHasChanges(false);
  };

  const startCreateBinder = () => {
    const binder = createEmptyBinder(createName.trim() || 'Novo Binder', createRows, createCols, createPageCount);
    setCurrentBinder(binder);
    setSelectedBinderId(null);
    setSelectedPageIndex(0);
    setSelectedSlotId(binder.pages[0]?.slots[0]?.id || null);
    setHasChanges(true);
  };

  const currentPage = useMemo(() => currentBinder?.pages?.[selectedPageIndex] || null, [currentBinder, selectedPageIndex]);

  const getBinderCardCount = (cardId) => {
    if (!currentBinder) return 0;
    return currentBinder.pages.reduce((count, page) => (
      count + page.slots.filter((slot) => slot.cardId === cardId).length
    ), 0);
  };

  const getCollectionQty = (cardId) => collectionQuantities[cardId] || 0;

  const handlePlaceCard = (card) => {
    if (!currentBinder || !currentPage || !selectedSlotId) return;
    if (!isCardAllowed(card)) return;

    const currentCount = getBinderCardCount(card.id);
    const maxCopies = getMaxBinderCopies(getCollectionQty(card.id));
    const existingSlot = currentPage.slots.find((slot) => slot.id === selectedSlotId);
    const isSameSlot = existingSlot?.cardId === card.id;
    if (!isSameSlot && currentCount >= maxCopies) {
      alert(`Não é possível adicionar mais cópias de "${card.name}". Limite do Binder: ${maxCopies}.`);
      return;
    }

    const updatedPages = currentBinder.pages.map((page, index) => {
      if (index !== selectedPageIndex) return page;
      return {
        ...page,
        slots: page.slots.map((slot) => (
          slot.id === selectedSlotId ? { ...slot, cardId: card.id } : slot
        ))
      };
    });

    setCurrentBinder((prev) => ({ ...prev, pages: updatedPages }));
    setHasChanges(true);
  };

  const handleClearSlot = () => {
    if (!currentBinder || !currentPage || !selectedSlotId) return;
    const updatedPages = currentBinder.pages.map((page, index) => {
      if (index !== selectedPageIndex) return page;
      return {
        ...page,
        slots: page.slots.map((slot) => (
          slot.id === selectedSlotId ? { ...slot, cardId: null } : slot
        ))
      };
    });

    setCurrentBinder((prev) => ({ ...prev, pages: updatedPages }));
    setHasChanges(true);
  };

  const handleSaveBinder = async () => {
    if (!currentBinder) return;
    try {
      const saved = await saveBinder(currentBinder);
      setSelectedBinderId(saved.id);
      setCurrentBinder(saved);
      setHasChanges(false);
      await loadBinders();
      alert('Binder salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar binder:', err);
      alert('Falha ao salvar o Binder. Veja o console para mais detalhes.');
    }
  };

  const handleDeleteBinder = async () => {
    if (!selectedBinderId) return;
    if (!confirm('Deseja excluir este Binder?')) return;
    try {
      await deleteBinder(selectedBinderId);
      setCurrentBinder(null);
      setSelectedBinderId(null);
      setSelectedPageIndex(0);
      setSelectedSlotId(null);
      setHasChanges(false);
      await loadBinders();
    } catch (err) {
      console.error('Erro ao excluir binder:', err);
    }
  };

  const handleExportBinder = () => {
    if (!currentBinder) return;
    const content = exportBinderJSON(currentBinder);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBinder.name || 'binder'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBinder = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonText = event.target.result;
        const imported = await importBinderJSON(jsonText);
        setImportError('');
        await loadBinders();
        openBinder(imported);
      } catch (err) {
        console.error('Erro ao importar Binder:', err);
        setImportError('Arquivo inválido. Verifique o conteúdo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentSlot = useMemo(() => currentPage?.slots?.find((slot) => slot.id === selectedSlotId) || null, [currentPage, selectedSlotId]);

  const binderSummary = useMemo(() => {
    if (!currentBinder) return null;
    const totalSlots = currentBinder.rows * currentBinder.cols * currentBinder.pageCount;
    return {
      pages: currentBinder.pageCount,
      rows: currentBinder.rows,
      cols: currentBinder.cols,
      totalSlots
    };
  }, [currentBinder]);

  return (
    <div className="binder-container">
      <div className="binder-header glass-card">
        <div>
          <h2>Binder Virtual</h2>
          <p className="muted">
            Crie Binder com páginas fixas, configure a matriz ao criar e use apenas cartas da coleção ou com sets em comum.
          </p>
        </div>
        <button className="btn-primary" onClick={startCreateBinder}>
          + Novo Binder
        </button>
      </div>

      <div className="binder-main-grid">
        <aside className="binder-sidebar glass-card">
          <h3>Binders</h3>
          {binders.length === 0 ? (
            <div className="empty-sidebar">Nenhum Binder ainda. Crie um para começar.</div>
          ) : (
            binders.map((binder) => (
              <button
                key={binder.id}
                className={`binder-page-button ${binder.id === selectedBinderId ? 'active' : ''}`}
                onClick={() => openBinder(binder)}
              >
                <strong>{binder.name}</strong>
                <span>{binder.rows}x{binder.cols} · {binder.pageCount} pág.</span>
              </button>
            ))
          )}

          <div className="binder-import-section">
            <label className="file-label">
              Importar Binder
              <input type="file" accept="application/json" onChange={handleImportBinder} />
            </label>
            {importError && <div className="import-error">{importError}</div>}
          </div>

          <div className="binder-create-config">
            <h4>Criar novo Binder</h4>
            <label>
              Nome
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} />
            </label>
            <label>
              Linhas
              <select value={createRows} onChange={(e) => setCreateRows(Number(e.target.value))}>
                {[2, 3, 4].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label>
              Colunas
              <select value={createCols} onChange={(e) => setCreateCols(Number(e.target.value))}>
                {[2, 3, 4].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Páginas
              <input
                type="number"
                min={1}
                max={999}
                step={1}
                value={createPageCount}
                onChange={(e) => setCreatePageCount(Number(e.target.value))}
              />
            </label>
          </div>
        </aside>

        <section className="binder-editor">
          {loading ? (
            <div className="empty-binder">Carregando binders...</div>
          ) : !currentBinder ? (
            <div className="empty-binder">
              <span>📂</span>
              <h3>Selecione ou crie um Binder</h3>
              <p className="muted">A configuração de matriz e número de páginas é definida ao criar o Binder.</p>
            </div>
          ) : (
            <>
              <div className="binder-editor-header">
                <div className="binder-editor-meta">
                  <label>
                    Nome do Binder
                    <input
                      type="text"
                      value={currentBinder.name}
                      onChange={(e) => {
                        setCurrentBinder((prev) => ({ ...prev, name: e.target.value }));
                        setHasChanges(true);
                      }}
                    />
                  </label>

                  <div className="binder-config-info">
                    <span>{currentBinder.rows}x{currentBinder.cols} por página</span>
                    <span>{currentBinder.pageCount} página(s)</span>
                    <span>{binderSummary?.totalSlots} slots totais</span>
                  </div>
                </div>

                <div className="binder-editor-actions">
                  <button className="btn-secondary" onClick={handleExportBinder} disabled={!currentBinder}>
                    Exportar JSON
                  </button>
                  <button className="btn-danger" onClick={handleDeleteBinder} disabled={!selectedBinderId}>
                    Excluir Binder
                  </button>
                  <button className="btn-primary" onClick={handleSaveBinder} disabled={!hasChanges}>
                    Salvar Binder
                  </button>
                </div>
              </div>

              <div className="binder-pages-tabs">
                {currentBinder.pages.map((page) => (
                  <button
                    key={page.pageIndex}
                    className={`page-tab ${selectedPageIndex === page.pageIndex ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPageIndex(page.pageIndex);
                      setSelectedSlotId(page.slots[0]?.id || null);
                    }}
                  >
                    {page.pageIndex + 1}
                  </button>
                ))}
              </div>

              <div className="binder-editor-body">
                <div className="binder-grid-panel">
                  <div className="binder-grid-header">
                    <strong>Página {selectedPageIndex + 1}</strong>
                    <span>Slots</span>
                  </div>

                  <div
                    className="binder-slot-grid"
                    style={{ gridTemplateColumns: `repeat(${currentBinder.cols}, minmax(0, 1fr))` }}
                  >
                    {currentPage?.slots.map((slot) => {
                      const card = slot.cardId ? slotDetails[slot.cardId] : null;
                      const ownedQty = getCollectionQty(slot.cardId);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          className={`binder-slot ${selectedSlotId === slot.id ? 'selected' : ''} ${slot.cardId ? '' : 'empty-slot'} ${slot.cardId && ownedQty === 0 ? 'missing-slot' : ''}`}
                          onClick={() => setSelectedSlotId(slot.id)}
                        >
                          {card ? (
                            <>
                              <img src={card.card_images?.[0]?.image_url_small || appLogo} alt={card.name} />
                              <span>{card.name}</span>
                              <small>{ownedQty > 0 ? `Coleção: ${ownedQty}` : 'Faltando'}</small>
                            </>
                          ) : (
                            <span>+</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="slot-actions">
                    <button className="btn-secondary" onClick={handleClearSlot} disabled={!selectedSlotId}>
                      Limpar slot selecionado
                    </button>
                  </div>
                </div>

                <div className="binder-search-panel glass-card">
                  <div className="binder-search-header">
                    <h3>Buscar cartas válidas</h3>
                    <input
                      type="text"
                      placeholder="Buscar cartas da coleção ou com set em comum..."
                      value={localQuery}
                      onChange={(e) => setLocalQuery(e.target.value)}
                    />
                  </div>

                  <div className="binder-search-results">
                    {searchResults.length === 0 ? (
                      <div className="empty-search">Digite algo para buscar cartas válidas para o Binder.</div>
                    ) : (
                      searchResults.map((card) => {
                        const binderCount = getBinderCardCount(card.id);
                        const collectionQty = getCollectionQty(card.id);
                        const maxCopies = getMaxBinderCopies(collectionQty);
                        const isAllowed = isCardAllowed(card);
                        const canAdd = isAllowed && (binderCount < maxCopies || currentSlot?.cardId === card.id);
                        return (
                          <div key={card.id} className="search-card-row">
                            <div className="search-card-info" onClick={() => setSelectedCardId(card.id)}>
                              <img src={card.image_url_small || appLogo} alt={card.name} />
                              <div>
                                <strong>{card.name}</strong>
                                <span>{card.type}</span>
                                <small className={collectionQty > 0 ? 'owned-badge' : 'missing-badge'}>
                                  {collectionQty > 0 ? `Coleção: ${collectionQty}` : 'Faltando'}
                                </small>
                              </div>
                            </div>
                            <button
                              className="btn-primary"
                              disabled={!canAdd}
                              onClick={() => handlePlaceCard(card)}
                            >
                              {canAdd ? 'Adicionar' : 'Máximo atingido'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedCardId && (
        <CardDetailModal cardId={selectedCardId} onClose={() => setSelectedCardId(null)} />
      )}
    </div>
  );
}
