import { useEffect, useMemo, useState } from 'react';
import { getCollectionItems, updateCollectionQuantity, clearCollection } from '../../services/collectionService';
import { getCardById, getCardsBySetName } from '../../services/cardService';
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
    return () => {};
  }, []);

  const changeQty = async (cardId, newQty) => {
    await updateCollectionQuantity(cardId, newQty);
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
      <div className="glass-card collection-header">
        <div>
          <h2>Minha Coleção</h2>
          <p className="muted">Registre as cartas que você possui e gerencie quantidades.</p>
          <div className="collection-summary">
            <span>{summary.distinctCards} cartas diferentes</span>
            <span>{summary.totalCopies} cópias no total</span>
            <span>{summary.distinctSets} sets</span>
          </div>
        </div>
        <div className="actions">
          <div className="sort-controls">
            <label>Ordenar por</label>
            <select value={sortMode} onChange={e => setSortMode(e.target.value)}>
              {SORT_OPTIONS.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>
          <button className="btn-danger" onClick={clearCollectionItems} disabled={loading || items.length===0}>Limpar Coleção</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-collection">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="empty-collection">
          <span>📭</span>
          <h3>Sua coleção está vazia.</h3>
          <p className="muted">Abra o Catálogo e adicione cartas à sua coleção clicando em uma carta.</p>
        </div>
      ) : (
        <div>
          {groupedItems.map(([groupName, groupItems]) => (
            <div className="collection-group" key={groupName}>
              <div className="collection-group-header">
                <div>
                  <strong>{groupName}</strong>
                  <span className="group-meta">{groupItems.length} cartas</span>
                </div>
                {sortMode === 'set' && missingBySet[groupName] && (
                  <button className="toggle-missing-btn" onClick={() => toggleMissing(groupName)}>
                    {expandedMissing[groupName] ? 'Ocultar' : `Faltam (${missingBySet[groupName].missing.length})`}
                  </button>
                )}
              </div>

              <div className="collection-grid">
                {groupItems.map(item => (
                  <div className="collection-item" key={item.cardId}>
                    <div className="thumb">
                      <img src={item.card?.card_images?.[0]?.image_url_small || 'https://images.ygoprodeck.com/images/cards_small/back_high.jpg'} alt={item.card?.name || item.cardId} />
                    </div>
                    <div className="meta">
                      <div className="name">{item.card?.name || `#${item.cardId}`}</div>
                      <div className="set muted">{(item.card?.card_sets?.[0]?.set_name) || ''}</div>
                    </div>
                    <div className="qty-controls">
                      <button onClick={() => changeQty(item.cardId, Math.max(0, item.quantity - 1))}>−</button>
                      <span className="qty">{item.quantity}</span>
                      <button onClick={() => changeQty(item.cardId, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {sortMode === 'set' && expandedMissing[groupName] && (
                <div className="missing-set-block">
                  {missingLoading ? (
                    <div className="missing-loading">Carregando cartas faltantes...</div>
                  ) : (
                    <>
                      <div className="missing-summary">
                        <span>{missingBySet[groupName].ownedCount} cartas em coleção</span>
                        <span>{missingBySet[groupName].missing.length} faltantes</span>
                        <span>{missingBySet[groupName].totalCount} totais no set</span>
                      </div>
                      {missingBySet[groupName].missing.length === 0 ? (
                        <div className="missing-empty">Parabéns! Você já possui todas as cartas desse set.</div>
                      ) : (
                        <div className="missing-grid">
                          {missingBySet[groupName].missing.map(card => (
                            <div className="missing-card-item" key={card.id}>
                              <div className="missing-card-name">{card.name}</div>
                              <div className="missing-card-rarity">{card.card_sets?.[0]?.set_rarity || 'Sem raridade'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
