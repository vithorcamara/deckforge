import { useEffect, useState } from 'react';
import { getCollectionItems, updateCollectionQuantity, clearCollection } from '../../services/collectionService';
import { getCardById } from '../../services/cardService';
import './style.css';

export default function Collection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCollection = async () => {
    setLoading(true);
    const col = await getCollectionItems();
    const detailed = await Promise.all(col.map(async c => {
      const card = await getCardById(c.cardId);
      return { ...c, card };
    }));

    // Sort by card name if available
    detailed.sort((a, b) => {
      const an = (a.card?.name || '').toLowerCase();
      const bn = (b.card?.name || '').toLowerCase();
      return an.localeCompare(bn);
    });

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

  return (
    <div className="collection-container">
      <div className="glass-card collection-header">
        <div>
          <h2>Minha Coleção</h2>
          <p className="muted">Registre as cartas que você possui e gerencie quantidades.</p>
        </div>
        <div className="actions">
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
        <div className="collection-grid">
          {items.map(item => (
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
      )}
    </div>
  );
}
