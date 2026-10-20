import { useEffect, useMemo, useState } from 'react';
import { getCollectionItems, updateCollectionQuantity, clearCollection, addCardToCollection } from '../../services/collectionService';
import { getCardById, getCardsBySetName } from '../../services/cardService';
import CardDetailModal from '../../components/CardDetailModal';
import appLogo from '/icons/pwa-512x512.png';
import './style.css';

const SORT_OPTIONS = [
  { key: 'name', label: 'Ordem alfabética' },
  { key: 'set', label: 'Set' },
  { key: 'rarity', label: 'Raridade' },
  { key: 'type', label: 'Tipo' },
  { key: 'setPrefix', label: 'Agrupamento personalizado' }
];

export default function Collection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState('name');
  const [missingBySet, setMissingBySet] = useState({});
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [missingLoading, setMissingLoading] = useState(false);
  const [expandedMissing, setExpandedMissing] = useState({});

  const getGroupingKey = (item) => {
    if (!item.card) return 'Sem dados';

    switch (sortMode) {
      case 'set':
        return item.card.card_sets?.[0]?.set_name || 'Sem set';
      case 'rarity':
        return item.card.card_sets?.[0]?.set_rarity || 'Sem raridade';
      case 'type':
        return item.card.type || 'Sem tipo';
      case 'setPrefix': {
        const name = item.card.card_sets?.[0]?.set_name || '';
        const prefix = name.split(/[-\s:]+/)[0];
        return prefix || 'Sem set';
      }
      default:
        return 'Ordem alfabética';
    }
  };

  const loadCollection = async () => {
    setLoading(true);
    const col = await getCollectionItems();
    const detailed = await Promise.all(col.map(async c => {
      const card = await getCardById(c.cardId);
      return { ...c, card };
    }));

    setItems(detailed);
    setLoading(false);
  };

  useEffect(() => {
    loadCollection();
    // No persistent hooks added here to keep behavior simple and stable
    return () => { };
  }, []);

  const changeQty = async (cardId, newQty) => {
    await updateCollectionQuantity(cardId, newQty);
    await loadCollection();
  };

  const addMissingCard = async (cardId) => {
    await addCardToCollection(cardId, 1);
    await loadCollection();
  };

  const clearCollectionItems = async () => {
    await clearCollection();
    await loadCollection();
  };

  const summary = useMemo(() => {
    const totalCopies = items.reduce((sum, item) => sum + item.quantity, 0);
    const distinctSets = new Set(items.flatMap(item => item.card?.card_sets?.map(set => set.set_name) || [])).size;
    return {
      totalCopies,
      distinctCards: items.length,
      distinctSets
    };
  }, [items]);

  const groupedItems = useMemo(() => {
    const groups = new Map();
    const sortedItems = [...items].sort((a, b) => {
      const keyA = getGroupingKey(a).toLowerCase();
      const keyB = getGroupingKey(b).toLowerCase();
      if (keyA !== keyB) return keyA.localeCompare(keyB);
      return (a.card?.name || '').localeCompare(b.card?.name || '');
    });

    sortedItems.forEach(item => {
      const key = getGroupingKey(item);
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    });

    return Array.from(groups.entries());
  }, [items, sortMode]);

  useEffect(() => {
    const loadMissingBySet = async () => {
      if (sortMode !== 'set' || items.length === 0) {
        setMissingBySet({});
        return;
      }

      setMissingLoading(true);
      const setNames = Array.from(new Set(items.flatMap(item => item.card?.card_sets?.map(set => set.set_name) || [])));
      const missingMap = {};

      await Promise.all(setNames.map(async (setName) => {
        const allCards = await getCardsBySetName(setName);
        const ownedIds = new Set(items.filter(item => item.card?.card_sets?.some(set => set.set_name === setName)).map(item => item.cardId));
        const missing = allCards
          .filter(card => !ownedIds.has(card.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        missingMap[setName] = {
          ownedCount: ownedIds.size,
          totalCount: allCards.length,
          missing
        };
      }));

      setMissingBySet(missingMap);
      setMissingLoading(false);
    };

    loadMissingBySet();
  }, [items, sortMode]);

  const toggleMissing = (setName) => {
    setExpandedMissing(prev => ({
      ...prev,
      [setName]: !prev[setName]
    }));
  };

  return (
    <div className="collection-container">
      <header className="collection-header">
        <div className="collection-heading">
          <span className="collection-eyebrow">Seu acervo</span>
          <h1 className="collection-title">Minha coleção</h1>
          <p className="collection-description">Registre suas cartas e acompanhe cada detalhe do seu acervo.</p>
          <div className="collection-summary" aria-label="Resumo da coleção">
            <div>
              <strong>{summary.distinctCards}</strong>
              <span>cartas diferentes</span>
            </div>
            <div>
              <strong>{summary.totalCopies}</strong>
              <span>cópias no total</span>
            </div>
            <div>
              <strong>{summary.distinctSets}</strong>
              <span>sets</span>
            </div>
          </div>
        </div>
        <div className="collection-actions">
          <div className="collection-sort">
            <label htmlFor="collection-sort">Ordenar por</label>
            <select id="collection-sort" value={sortMode} onChange={e => setSortMode(e.target.value)}>
              {SORT_OPTIONS.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>
          <button
            className="collection-clear-btn"
            onClick={clearCollectionItems}
            disabled={loading || items.length === 0}
          >
            Limpar coleção
          </button>
        </div>
      </header>

      {loading ? (
        <div className="collection-state" role="status">Carregando sua coleção...</div>
      ) : items.length === 0 ? (
        <div className="collection-state collection-empty">
          <span className="collection-empty-icon" aria-hidden="true">✦</span>
          <h2>Sua coleção está vazia</h2>
          <p>Abra o Catálogo e adicione cartas à sua coleção para começar seu acervo.</p>
        </div>
      ) : (
        <div className="collection-groups">
          {groupedItems.map(([groupName, groupItems]) => (
            <section className="collection-group" key={groupName} aria-label={`Grupo ${groupName}`}>
              <div className="collection-group-header">
                <div>
                  <h2>{groupName}</h2>
                  <span className="group-meta">
                    {groupItems.length} {groupItems.length === 1 ? 'carta' : 'cartas'}
                  </span>
                  {sortMode === 'set' && missingLoading && (
                    <span className="loading-set-note">Carregando Set...</span>
                  )}
                </div>
                {sortMode === 'set' && missingBySet[groupName] && (
                  <button
                    className="toggle-missing-btn"
                    onClick={() => toggleMissing(groupName)}
                    aria-expanded={Boolean(expandedMissing[groupName])}
                  >
                    {expandedMissing[groupName] ? 'Ocultar' : `Faltam (${missingBySet[groupName].missing.length})`}
                  </button>
                )}
              </div>

              <div className="collection-grid">
                {groupItems.map(item => (
                  <article className="collection-item" key={item.cardId}>
                    <button
                      className="collection-card-open"
                      onClick={() => setSelectedCardId(item.cardId)}
                      type="button"
                      aria-label={`Ver detalhes de ${item.card?.name || item.cardId}`}
                    >
                      <span className="collection-thumb">
                        <img
                          src={item.card?.card_images?.[0]?.image_url_small || appLogo}
                          alt={item.card?.name || item.cardId}
                          loading="lazy"
                        />
                      </span>
                      <span className="collection-card-info">
                        <span className="collection-card-name">{item.card?.name || 'Carta sem dados'}</span>
                        <span className="collection-card-set">
                          {item.setCode || item.card?.card_sets?.[0]?.set_code || 'Código não informado'}
                        </span>
                      </span>
                    </button>
                    <div className="qty-controls" aria-label={`Quantidade de ${item.card?.name || item.cardId}`}>
                      <button
                        onClick={() => changeQty(item.cardId, Math.max(0, item.quantity - 1))}
                        type="button"
                        aria-label={`Remover uma cópia de ${item.card?.name || item.cardId}`}
                      >
                        −
                      </button>
                      <span className="qty" aria-live="polite">{item.quantity}</span>
                      <button
                        onClick={() => changeQty(item.cardId, item.quantity + 1)}
                        type="button"
                        aria-label={`Adicionar uma cópia de ${item.card?.name || item.cardId}`}
                      >
                        +
                      </button>
                    </div>
                  </article>
                ))}

                {sortMode === 'set' && expandedMissing[groupName] && missingBySet[groupName] && !missingLoading && missingBySet[groupName].missing.map(card => (
                  <article className="collection-item collection-item--missing" key={`missing-${card.id}`}>
                    <button
                      className="collection-card-open"
                      onClick={() => setSelectedCardId(card.id)}
                      type="button"
                      aria-label={`Ver detalhes de ${card.name}`}
                    >
                      <span className="collection-thumb">
                        <img
                          src={card.card_images?.[0]?.image_url_small || 'https://images.ygoprodeck.com/images/cards_small/back_high.jpg'}
                          alt={card.name}
                          loading="lazy"
                        />
                      </span>
                      <span className="collection-card-info">
                        <span className="collection-card-name">{card.name}</span>
                        <span className="collection-card-set">Ainda não adicionada</span>
                      </span>
                    </button>
                    <button
                      className="btn-add-missing"
                      onClick={() => addMissingCard(card.id)}
                      type="button"
                      aria-label={`Adicionar ${card.name} à coleção`}
                    >
                      +
                    </button>
                  </article>
                ))}
              </div>

              {sortMode === 'set' && expandedMissing[groupName] && missingLoading && (
                <div className="missing-loading">Carregando cartas faltantes...</div>
              )}

              {sortMode === 'set' && expandedMissing[groupName] && !missingLoading && missingBySet[groupName] && missingBySet[groupName].missing.length === 0 && (
                <div className="missing-empty">Parabéns! Você já possui todas as cartas desse set.</div>
              )}
            </section>
          ))}
        </div>
      )}

      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
