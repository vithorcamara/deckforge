import { useEffect, useState } from 'react';
import { getCardById } from '../../services/cardService';
import { addCardToCollection, getCollectionItem } from '../../services/collectionService';
import './style.css';

export default function CardDetailModal({ cardId, onClose, onSelectSet }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collectionQty, setCollectionQty] = useState(0);
  const [selectedSetCode, setSelectedSetCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    setStatusMessage('');
    getCardById(cardId)
      .then(async data => {
        setCard(data);
        setSelectedSetCode('');
        const saved = await getCollectionItem(cardId);
        setCollectionQty(saved?.quantity || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [cardId]);

  if (!cardId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>

      <div
        className="glass-card modal-content"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>

        {loading ? (
          <div className="modal-loading-wrapper">
            <div className="modal-spinner"></div>
          </div>
        ) : card ? (
          <>
            {/* Left: Card Image & Prices */}
            <div className="modal-left-col">
              <img
                src={card.card_images?.[0]?.image_url || card.card_images?.[0]?.image_url_small}
                alt={card.name}
                className="modal-card-image"
              />

            </div>

            {/* Right: Card Details */}
            <div className="modal-right-col">
              <h2 className="modal-card-title">{card.name}</h2>

              {/* Badges Info */}
              <div className="modal-badges-row">
                {card.archetype && (
                  <div className="modal-card-archetype">
                    {card.archetype}
                  </div>
                )}
                <span className={`modal-badge ${card.type.includes('Spell') ? 'badge-spell' :
                  card.type.includes('Trap') ? 'badge-trap' :
                    'badge-monster'
                  }`}>
                  {card.type}
                </span>

                {card.attribute && (
                  <span className="modal-badge">
                    {card.attribute}
                  </span>
                )}

                {card.level !== undefined && card.level !== null && (
                  <span className="modal-badge badge-level">
                    {card.type.includes('XYZ') ? 'Rank' : 'Level'}: {card.level} ★
                  </span>
                )}

                {card.race && (
                  <span className="modal-badge">
                    {card.race}
                  </span>
                )}
              </div>

              <div className="modal-collection-actions">
                <button
                  className="btn-primary"
                  onClick={async () => {
                    if (!selectedSetCode) {
                      alert('Selecione um código de carta antes de adicionar à coleção.');
                      return;
                    }
                    const updated = await addCardToCollection(card.id, 1, selectedSetCode);
                    setCollectionQty(updated?.quantity || 0);
                    setStatusMessage('Carta adicionada à coleção!');
                  }}
                >
                  Adicionar à Coleção
                </button>
                {collectionQty > 0 && (
                  <span className="modal-collection-info">
                    Você já possui {collectionQty} cópia{collectionQty === 1 ? '' : 's'} desta carta.
                  </span>
                )}
                {statusMessage && (
                  <div className="modal-collection-status">{statusMessage}</div>
                )}
              </div>

              {/* Card Sets Table */}
              {card.card_sets && card.card_sets.length > 0 && (
                <div className="modal-sets-section">
                  <div className="modal-sets-title">
                    Available Sets ({card.card_sets.length})
                  </div>
                  <div className="modal-selected-set">
                    Selecionado: {selectedSetCode || 'Nenhum'}
                  </div>
                  <div className="modal-sets-table-wrapper">
                    <table className="modal-sets-table">
                      <thead>
                        <tr>
                          <th>Set Name</th>
                          <th>Code</th>
                          <th>Rarity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {card.card_sets.map((set, idx) => (
                          <tr
                            key={idx}
                            className={selectedSetCode === set.set_code ? 'selected-set-row' : ''}
                            onClick={() => {
                              setSelectedSetCode(set.set_code);
                              console.log(`Selected set code: ${set.set_code}`);
                            }}
                          >
                            <td className={`set-name ${onSelectSet ? 'clickable' : ''}`}>
                              <label className="set-select-label">
                                <input
                                  type="radio"
                                  name="selectedSetCode"
                                  checked={selectedSetCode === set.set_code}
                                  onChange={() => setSelectedSetCode(set.set_code)}
                                />
                                <span onClick={() => onSelectSet && onSelectSet(set.set_name)}>{set.set_name}</span>
                              </label>
                            </td>
                            <td className="set-code">{set.set_code}</td>
                            <td className="set-rarity">{set.set_rarity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monster Stats */}
              {(card.atk !== undefined || card.def !== undefined) && (
                <div className="modal-stats-box">
                  {card.atk !== undefined && (
                    <div>ATK: <span>{card.atk === -1 ? '?' : card.atk}</span></div>
                  )}
                  {card.def !== undefined && (
                    <div>DEF: <span>{card.def === -1 ? '?' : card.def}</span></div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="modal-desc-section">
                <div className="modal-desc-title">Description / Effect</div>
                <div className="modal-desc-body">{card.desc}</div>
              </div>

              {/* Card Prices */}
              {card.card_prices?.[0] && (
                <div className="modal-prices-box">
                  <div className="modal-prices-title">Average Prices (USD)</div>
                  <div className="modal-prices-grid">
                    <div>Cardmarket: <span>${card.card_prices[0].cardmarket_price}</span></div>
                    <div>TCGPlayer: <span>${card.card_prices[0].tcgplayer_price}</span></div>
                    <div>eBay: <span>${card.card_prices[0].ebay_price}</span></div>
                    <div>Amazon: <span>${card.card_prices[0].amazon_price}</span></div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '3rem' }}>
            Card not found.
          </div>
        )}
      </div>
    </div>
  );
}
