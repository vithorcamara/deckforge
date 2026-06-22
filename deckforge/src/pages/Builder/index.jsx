import { useCallback, useState, useEffect } from 'react';
import {
  getAllDecks,
  saveDeck,
  deleteDeck,
  exportToYDK,
  importFromYDK,
  createDeckFromSet
} from '../../services/deckService';
import {
  searchCards,
  getCardById,
  getCardSets
} from '../../services/cardService';
import CardDetailModal from '../../components/CardDetailModal';
import appLogo from '/favicon.png';
import './style.css';

export default function Builder() {
  // Navigation / Views states
  const [decks, setDecks] = useState([]);
  const [editingDeck, setEditingDeck] = useState(null);
  const [resolvedCards, setResolvedCards] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  // Decks list view states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [showImportSetModal, setShowImportSetModal] = useState(false);
  const [officialSets, setOfficialSets] = useState([]);
  const [selectedSetToImport, setSelectedSetToImport] = useState('');
  const [importDeckName, setImportDeckName] = useState('');

  // Workspace view states (Mini-Catalog)
  const [localQuery, setLocalQuery] = useState('');
  const [localResults, setLocalResults] = useState([]);
  const [selectedDetailCardId, setSelectedDetailCardId] = useState(null);

  // Validation alerts
  const [validationAlerts, setValidationAlerts] = useState([]);

  const validateDeck = useCallback(() => {
    const alerts = [];
    const mainCount = resolvedCards.filter(rc => rc.type === 'main').reduce((sum, rc) => sum + rc.quantity, 0);
    const extraCount = resolvedCards.filter(rc => rc.type === 'extra').reduce((sum, rc) => sum + rc.quantity, 0);
    const sideCount = resolvedCards.filter(rc => rc.type === 'side').reduce((sum, rc) => sum + rc.quantity, 0);

    if (mainCount < 40) {
      alerts.push({
        text: `O Main Deck possui poucas cartas (${mainCount}/40). É necessário conter no mínimo 40 cartas.`,
        severity: 'warning'
      });
    } else if (mainCount > 60) {
      alerts.push({
        text: `O Main Deck possui muitas cartas (${mainCount}/60). O limite máximo permitido é 60 cartas.`,
        severity: 'danger'
      });
    }

    if (extraCount > 15) {
      alerts.push({
        text: `O Extra Deck excedeu o limite máximo de cartas (${extraCount}/15).`,
        severity: 'danger'
      });
    }

    if (sideCount > 15) {
      alerts.push({
        text: `O Side Deck excedeu o limite máximo de cartas (${sideCount}/15).`,
        severity: 'danger'
      });
    }

    const cardIdCopies = {};
    resolvedCards.forEach(rc => {
      cardIdCopies[rc.cardId] = (cardIdCopies[rc.cardId] || 0) + rc.quantity;
    });

    Object.entries(cardIdCopies).forEach(([idStr, qty]) => {
      if (qty > 3) {
        const item = resolvedCards.find(rc => rc.cardId === Number(idStr));
        alerts.push({
          text: `A carta "${item?.cardDetails?.name || 'Desconhecida'}" possui ${qty} cópias no deck (Máximo permitido: 3).`,
          severity: 'danger'
        });
      }
    });

    setValidationAlerts(alerts);
  }, [resolvedCards]);

  // Load user decks on mount
  useEffect(() => {
    loadDecks();
    setOfficialSets(getCardSets());
  }, []);

  // Update mini-catalog search results in editor
  useEffect(() => {
    if (!editingDeck) return;
    const result = searchCards({
      query: localQuery,
      limit: 50
    });
    setLocalResults(result.cards);
  }, [localQuery, editingDeck]);

  // Run validation whenever resolvedCards change
  useEffect(() => {
    if (!editingDeck) return;
    validateDeck();
  }, [editingDeck, resolvedCards, validateDeck]);

  const loadDecks = async () => {
    try {
      const data = await getAllDecks();
      // Sort by updatedAt descending
      setDecks(data.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (err) {
      console.error('Error loading decks:', err);
    }
  };

  // Helper to determine if a card is an Extra Deck monster
  const isExtraDeckMonster = (type) => {
    if (!type) return false;
    return type.includes('Fusion') ||
      type.includes('Synchro') ||
      type.includes('XYZ') ||
      type.includes('Link');
  };

  const getCardImageUrl = (cardDetails) => {
    return (
      cardDetails?.card_images?.[0]?.image_url_small ||
      cardDetails?.card_images?.[0]?.image_url ||
      cardDetails?.image_url_small ||
      cardDetails?.image_url ||
      appLogo
    );
  };

  // Pre-populates the details of the card objects in the deck
  const startEditingDeck = async (deck) => {
    setLoading(true);
    try {
      const resolved = [];
      for (const cardItem of deck.cards) {
        const details = await getCardById(cardItem.cardId);
        if (details) {
          resolved.push({
            ...cardItem,
            cardDetails: details
          });
        }
      }
      setEditingDeck(deck);
      setResolvedCards(resolved);
      setHasChanges(false);
      setLocalQuery('');
    } catch (err) {
      console.error('Error opening deck editor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlankDeck = async () => {
    if (!newDeckName.trim()) return;
    try {
      const newDeck = await saveDeck({
        name: newDeckName.trim(),
        cards: []
      });
      setShowCreateModal(false);
      setNewDeckName('');
      await loadDecks();
      startEditingDeck(newDeck);
    } catch (err) {
      console.error('Error creating blank deck:', err);
    }
  };

  const handleImportSetDeck = async () => {
    if (!selectedSetToImport) return;
    try {
      const name = importDeckName.trim() || `${selectedSetToImport} (Pre-Built)`;
      const newDeck = await createDeckFromSet(selectedSetToImport, name);
      setShowImportSetModal(false);
      setSelectedSetToImport('');
      setImportDeckName('');
      await loadDecks();
      startEditingDeck(newDeck);
    } catch (err) {
      console.error('Error importing set deck:', err);
    }
  };

  const handleYdkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const deckName = file.name.replace('.ydk', '');
        const newDeck = await importFromYDK(text, deckName);
        await loadDecks();
        startEditingDeck(newDeck);
      } catch (err) {
        alert('Erro ao importar arquivo YDK. Verifique se o formato está correto.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Clear value to allow same file selection
    e.target.value = '';
  };

  const handleDeleteDeck = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`Deseja realmente excluir o deck "${name}"?`)) return;
    try {
      await deleteDeck(id);
      loadDecks();
    } catch (err) {
      console.error('Error deleting deck:', err);
    }
  };

  // Add card to main / extra / side
  const handleAddCard = (card, targetType) => {
    // Check global copies limit (max 3 across the entire deck)
    const currentCopies = resolvedCards
      .filter(rc => rc.cardId === card.id)
      .reduce((sum, rc) => sum + rc.quantity, 0);

    if (currentCopies >= 3) {
      alert(`Você já possui o limite de 3 cópias da carta "${card.name}" no deck.`);
      return;
    }

    // Check if card already exists in this target section
    const existingIndex = resolvedCards.findIndex(
      rc => rc.cardId === card.id && rc.type === targetType
    );

    let updatedList;
    if (existingIndex > -1) {
      updatedList = [...resolvedCards];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        quantity: updatedList[existingIndex].quantity + 1
      };
    } else {
      updatedList = [
        ...resolvedCards,
        {
          cardId: card.id,
          quantity: 1,
          type: targetType,
          cardDetails: card
        }
      ];
    }

    setResolvedCards(updatedList);
    setHasChanges(true);
  };

  // Update card quantity in workspace
  const handleUpdateQuantity = (cardId, type, delta) => {
    const targetIdx = resolvedCards.findIndex(rc => rc.cardId === cardId && rc.type === type);
    if (targetIdx === -1) return;

    const currentCard = resolvedCards[targetIdx];
    const newQty = currentCard.quantity + delta;

    let updatedList = [...resolvedCards];

    if (newQty <= 0) {
      updatedList.splice(targetIdx, 1);
    } else {
      // If increasing, check global limit of 3 copies
      if (delta > 0) {
        const totalCopies = resolvedCards
          .filter(rc => rc.cardId === cardId)
          .reduce((sum, rc) => sum + rc.quantity, 0);

        if (totalCopies >= 3) {
          alert(`Você já possui o limite de 3 cópias da carta "${currentCard.cardDetails.name}" no deck.`);
          return;
        }
      }

      updatedList[targetIdx] = {
        ...currentCard,
        quantity: newQty
      };
    }

    setResolvedCards(updatedList);
    setHasChanges(true);
  };

  const handleRemoveRow = (cardId, type) => {
    setResolvedCards(prev => prev.filter(rc => !(rc.cardId === cardId && rc.type === type)));
    setHasChanges(true);
  };

  const handleSaveDeck = async () => {
    if (!editingDeck) return;
    try {
      const cardsToSave = resolvedCards.map(rc => ({
        cardId: rc.cardId,
        quantity: rc.quantity,
        type: rc.type
      }));

      const updated = await saveDeck({
        ...editingDeck,
        cards: cardsToSave
      });

      setEditingDeck(updated);
      setHasChanges(false);
      await loadDecks();
      alert('Deck salvo com sucesso!');
    } catch (err) {
      alert('Erro ao salvar deck no banco de dados.');
      console.error(err);
    }
  };

  const handleExportDeck = () => {
    if (!editingDeck) return;
    try {
      const cardsToSave = resolvedCards.map(rc => ({
        cardId: rc.cardId,
        quantity: rc.quantity,
        type: rc.type
      }));

      const content = exportToYDK({ cards: cardsToSave });
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${editingDeck.name}.ydk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting deck:', err);
    }
  };

  const handleBackToList = () => {
    if (hasChanges) {
      if (!confirm('Existem alterações não salvas. Deseja realmente sair sem salvar?')) {
        return;
      }
    }
    setEditingDeck(null);
    setResolvedCards([]);
    setHasChanges(false);
  };

  // Render components
  return (
    <div className="builder-container builder-fade-in">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(223, 177, 91, 0.1)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : editingDeck ? (
        /* ========================================================================= */
        /*                          WORKSPACE EDITOR VIEW                           */
        /* ========================================================================= */
        <div className="workspace-view builder-fade-in">
          {/* Header row */}
          <div className="workspace-header">
            <div className="workspace-title-wrapper">
              <span style={{ fontSize: '2rem' }}>🧱</span>
              <div>
                <h2 className="workspace-title">{editingDeck.name}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {hasChanges ? '• Alterações pendentes' : '• Salvo no navegador'}
                </span>
              </div>
            </div>

            <div className="workspace-actions">
              <button className="btn-secondary" onClick={handleBackToList}>
                ⬅️ Lista
              </button>
              <button className="btn-secondary" onClick={handleExportDeck}>
                📥 YDK
              </button>
              <button className="btn-primary" onClick={handleSaveDeck}>
                💾 Salvar
              </button>
            </div>
          </div>

          <div className="workspace-grid" style={{ marginTop: '1.5rem' }}>
            {/* Left side: Search Mini-Catalog */}
            <div className="glass-card mini-catalog-panel">
              <div className="mini-catalog-search-wrapper">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Mini-Catálogo (Buscar Cartas)
                </label>
                <input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  value={localQuery}
                  onChange={e => setLocalQuery(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="mini-catalog-list">
                {localResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nenhuma carta encontrada.
                  </div>
                ) : (
                  localResults.map(card => {
                    const isExtra = isExtraDeckMonster(card.type);

                    return (
                      <div className="mini-card-item" key={card.id}>
                        <img
                          src={card.image_url_small}
                          alt={card.name}
                          className="mini-card-image"
                          onClick={() => setSelectedDetailCardId(card.id)}
                          onError={e => {
                            e.target.src = appLogo;
                          }}
                        />
                        <div className="mini-card-info">
                          <span
                            className="mini-card-name"
                            onClick={() => setSelectedDetailCardId(card.id)}
                          >
                            {card.name}
                          </span>
                          <div className="mini-card-meta">
                            <span>{card.type.includes('Spell') ? 'Spell' : card.type.includes('Trap') ? 'Trap' : card.race}</span>
                          </div>
                        </div>
                        <div className="mini-card-actions">
                          <button
                            className="btn-mini-add"
                            disabled={isExtra}
                            onClick={() => handleAddCard(card, 'main')}
                          >
                            + Main
                          </button>
                          <button
                            className="btn-mini-add"
                            disabled={!isExtra}
                            onClick={() => handleAddCard(card, 'extra')}
                          >
                            + Extra
                          </button>
                          <button
                            className="btn-mini-add"
                            onClick={() => handleAddCard(card, 'side')}
                          >
                            + Side
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right side: Current Deck Lists */}
            <div className="deck-structure-panel">
              {/* Quantities summary bar */}
              <div className="deck-summary-header">
                <span style={{ fontWeight: 700 }}>Resumo do Deck</span>
                <div className="deck-summary-counts">
                  <span>Main: <strong>{resolvedCards.filter(rc => rc.type === 'main').reduce((sum, rc) => sum + rc.quantity, 0)}/60</strong></span>
                  <span>Extra: <strong>{resolvedCards.filter(rc => rc.type === 'extra').reduce((sum, rc) => sum + rc.quantity, 0)}/15</strong></span>
                  <span>Side: <strong>{resolvedCards.filter(rc => rc.type === 'side').reduce((sum, rc) => sum + rc.quantity, 0)}/15</strong></span>
                </div>
              </div>

              {/* Validation errors/warnings */}
              {validationAlerts.length > 0 && (
                <div className="validation-panel">
                  {validationAlerts.map((alert, idx) => (
                    <div className={`alert-box ${alert.severity === 'danger' ? 'alert-danger' : 'alert-warning'}`} key={idx}>
                      <span className="alert-icon">{alert.severity === 'danger' ? '❌' : '⚠️'}</span>
                      <span>{alert.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Deck Section */}
              <div className="deck-section">
                <h3 className="deck-section-title">
                  Main Deck
                  <span>{resolvedCards.filter(rc => rc.type === 'main').reduce((sum, rc) => sum + rc.quantity, 0)} cartas</span>
                </h3>
                <div className="deck-section-list">
                  {resolvedCards.filter(rc => rc.type === 'main').length === 0 ? (
                    <div className="empty-section">Vazio. Adicione monstros comuns, mágicas e armadilhas.</div>
                  ) : (
                    resolvedCards
                      .filter(rc => rc.type === 'main')
                      .map(rc => (
                        <div className="deck-item-row" key={`${rc.cardId}-${rc.type}`}>
                          <img
                            src={getCardImageUrl(rc.cardDetails)}
                            alt={rc.cardDetails.name}
                            className="deck-item-img"
                            onError={e => {
                              e.target.src = appLogo;
                            }}
                          />
                          <div className="deck-item-info">
                            <span
                              className="deck-item-name"
                              onClick={() => setSelectedDetailCardId(rc.cardId)}
                            >
                              {rc.cardDetails.name}
                            </span>
                            <span className="deck-item-type">{rc.cardDetails.type}</span>
                          </div>
                          <div className="deck-item-controls">
                            <button className="btn-ctrl" onClick={() => handleUpdateQuantity(rc.cardId, 'main', -1)}>-</button>
                            <span className="deck-item-quantity">{rc.quantity}x</span>
                            <button className="btn-ctrl" onClick={() => handleUpdateQuantity(rc.cardId, 'main', 1)}>+</button>
                            <button className="btn-ctrl btn-delete-row" onClick={() => handleRemoveRow(rc.cardId, 'main')}>&times;</button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Extra Deck Section */}
              <div className="deck-section">
                <h3 className="deck-section-title">
                  Extra Deck
                  <span>{resolvedCards.filter(rc => rc.type === 'extra').reduce((sum, rc) => sum + rc.quantity, 0)} cartas</span>
                </h3>
                <div className="deck-section-list">
                  {resolvedCards.filter(rc => rc.type === 'extra').length === 0 ? (
                    <div className="empty-section">Vazio. Adicione monstros de Fusão, Sincro, XYZ e Link.</div>
                  ) : (
                    resolvedCards
                      .filter(rc => rc.type === 'extra')
                      .map(rc => (
                        <div className="deck-item-row" key={`${rc.cardId}-${rc.type}`}>
                          <img
                            src={getCardImageUrl(rc.cardDetails)}
                            alt={rc.cardDetails.name}
                            className="deck-item-img"
                            onError={e => {
                              e.target.src = appLogo;
                            }}
                          />
                          <div className="deck-item-info">
                            <span
                              className="deck-item-name"
                              onClick={() => setSelectedDetailCardId(rc.cardId)}
                            >
                              {rc.cardDetails.name}
                            </span>
                            <span className="deck-item-type">{rc.cardDetails.type}</span>
                          </div>
                          <div className="deck-item-controls">
                            <button className="btn-ctrl" onClick={() => handleUpdateQuantity(rc.cardId, 'extra', -1)}>-</button>
                            <span className="deck-item-quantity">{rc.quantity}x</span>
                            <button className="btn-ctrl" onClick={() => handleUpdateQuantity(rc.cardId, 'extra', 1)}>+</button>
                            <button className="btn-ctrl btn-delete-row" onClick={() => handleRemoveRow(rc.cardId, 'extra')}>&times;</button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Side Deck Section */}
              <div className="deck-section">
                <h3 className="deck-section-title">
                  Side Deck
                  <span>{resolvedCards.filter(rc => rc.type === 'side').reduce((sum, rc) => sum + rc.quantity, 0)} cartas</span>
                </h3>
                <div className="deck-section-list">
                  {resolvedCards.filter(rc => rc.type === 'side').length === 0 ? (
                    <div className="empty-section">Vazio. Adicione cartas de reserva para trocar entre duelos.</div>
                  ) : (
                    resolvedCards
                      .filter(rc => rc.type === 'side')
                      .map(rc => (
                        <div className="deck-item-row" key={`${rc.cardId}-${rc.type}`}>
                          <img
                            src={getCardImageUrl(rc.cardDetails)}
                            alt={rc.cardDetails.name}
                            className="deck-item-img"
                            onError={e => {
                              e.target.src = appLogo;
                            }}
                          />
                          <div className="deck-item-info">
                            <span
                              className="deck-item-name"
                              onClick={() => setSelectedDetailCardId(rc.cardId)}
                            >
                              {rc.cardDetails.name}
                            </span>
                            <span className="deck-item-type">{rc.cardDetails.type}</span>
                          </div>
                          <div className="deck-item-controls">
                            <button className="btn-ctrl" onClick={() => handleUpdateQuantity(rc.cardId, 'side', -1)}>-</button>
                            <span className="deck-item-quantity">{rc.quantity}x</span>
                            <button className="btn-ctrl" onClick={() => handleUpdateQuantity(rc.cardId, 'side', 1)}>+</button>
                            <button className="btn-ctrl btn-delete-row" onClick={() => handleRemoveRow(rc.cardId, 'side')}>&times;</button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /*                           LIST VIEW OF DECK LISTS                         */
        /* ========================================================================= */
        <div className="decks-list-view builder-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Decks do Usuário
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Crie, importe no formato YDK ou clone a partir de baralhos oficiais.
              </p>
            </div>

            <div className="decks-actions-bar">
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                ➕ Novo Deck
              </button>

              <button className="btn-secondary" onClick={() => setShowImportSetModal(true)}>
                👑 Clonar Set Oficial
              </button>

              <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                📂 Importar YDK
                <input
                  type="file"
                  accept=".ydk"
                  onChange={handleYdkUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="decks-grid" style={{ marginTop: '1.5rem' }}>
            {decks.length === 0 ? (
              <div className="empty-decks">
                <span>🧱</span>
                <h3>Você ainda não possui nenhum deck criado.</h3>
                <p>Use os botões no topo para começar!</p>
              </div>
            ) : (
              decks.map(deck => {
                const mainQty = deck.cards.filter(c => c.type === 'main').reduce((sum, c) => sum + c.quantity, 0);
                const extraQty = deck.cards.filter(c => c.type === 'extra').reduce((sum, c) => sum + c.quantity, 0);
                const sideQty = deck.cards.filter(c => c.type === 'side').reduce((sum, c) => sum + c.quantity, 0);

                return (
                  <div
                    className="glass-card deck-card"
                    key={deck.id}
                    onClick={() => startEditingDeck(deck)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="deck-card-header">
                      <span className="deck-card-icon">🃏</span>
                      <div className="deck-card-info">
                        <span className="deck-card-name">{deck.name}</span>
                        <span className="deck-card-date">
                          Atualizado em: {new Date(deck.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="deck-card-stats">
                      <div className="stat-item">
                        <span className="stat-val">{mainQty}</span>
                        <span className="stat-label">Main</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-val">{extraQty}</span>
                        <span className="stat-label">Extra</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-val">{sideQty}</span>
                        <span className="stat-label">Side</span>
                      </div>
                    </div>

                    <div className="deck-card-actions">
                      <button className="btn-secondary" onClick={() => startEditingDeck(deck)}>
                        Editar
                      </button>
                      <button className="btn-danger-outline" onClick={(e) => handleDeleteDeck(deck.id, deck.name, e)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */
      /*                               MODAIS LOCAIS                               */
      /* ========================================================================= */}

      {/* Create Blank Deck Modal */}
      {showCreateModal && (
        <div className="builder-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="glass-card builder-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="builder-modal-title">Novo Deck</h3>
            <button className="builder-modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            <div className="builder-modal-body">
              <div className="filter-group">
                <label>Nome do Deck</label>
                <input
                  type="text"
                  placeholder="Ex: Dragões de Olhos Azuis..."
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  className="filter-input"
                  autoFocus
                />
              </div>
            </div>
            <div className="builder-modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCreateBlankDeck} disabled={!newDeckName.trim()}>Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import/Clone Official Set Modal */}
      {showImportSetModal && (
        <div className="builder-modal-backdrop" onClick={() => setShowImportSetModal(false)}>
          <div className="glass-card builder-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="builder-modal-title">Clonar Deck de Set Oficial</h3>
            <button className="builder-modal-close" onClick={() => setShowImportSetModal(false)}>&times;</button>
            <div className="builder-modal-body">
              <div className="filter-group">
                <label>Selecione a Coleção/Set Oficial</label>
                <select
                  value={selectedSetToImport}
                  onChange={e => setSelectedSetToImport(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Selecione...</option>
                  {officialSets.map(setName => (
                    <option key={setName} value={setName}>{setName}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Nome do Deck Customizado (Opcional)</label>
                <input
                  type="text"
                  placeholder="Deixe em branco para usar o nome do set..."
                  value={importDeckName}
                  onChange={e => setImportDeckName(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
            <div className="builder-modal-actions">
              <button className="btn-secondary" onClick={() => setShowImportSetModal(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={handleImportSetDeck}
                disabled={!selectedSetToImport}
              >
                Clonar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Card View Modal (inside Editor Workspace) */}
      {selectedDetailCardId && (
        <CardDetailModal
          cardId={selectedDetailCardId}
          onClose={() => setSelectedDetailCardId(null)}
        />
      )}
    </div>
  );
}
