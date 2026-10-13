import { useState, useEffect } from 'react';
import { searchCards, getArchetypes, getCardSets, getRarities } from '../../services/cardService';
import CardDetailModal from '../../components/CardDetailModal';
import appLogo from '/icons/pwa-512x512.png';
import './style.css';

const ATTRIBUTES = ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];

const RACES = {
  Monster: [
    'Aqua', 'Beast', 'Beast-Warrior', 'Creator-God', 'Cyberse', 'Dinosaur', 
    'Divine-Beast', 'Dragon', 'Fiend', 'Fish', 'Insect', 'Machine', 'Plant', 
    'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 
    'Thunder', 'Warrior', 'Winged Beast', 'Wyrm', 'Zombie'
  ],
  Spell: ['Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual'],
  Trap: ['Normal', 'Continuous', 'Counter']
};

export default function Catalog({ initialSet, onClearInitialSet, onSelectSet }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [attribute, setAttribute] = useState('');
  const [race, setRace] = useState('');
  const [archetype, setArchetype] = useState('');
  const [rarity, setRarity] = useState('');
  const [archetypes, setArchetypes] = useState([]);
  const [rarities, setRarities] = useState([]);
  
  const [selectedSet, setSelectedSet] = useState(initialSet || '');
  const [sets, setSets] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);

  // Fetch archetypes, sets and rarities list on load
  useEffect(() => {
    setArchetypes(getArchetypes());
    setSets(getCardSets());
    setRarities(getRarities());
  }, []);

  // Sync initial set if changed from outside
  useEffect(() => {
    if (initialSet !== undefined) {
      setSelectedSet(initialSet);
    }
  }, [initialSet]);

  // Effect to perform the search when filters change
  useEffect(() => {
    setPage(1);
    const result = searchCards({
      query,
      type,
      attribute,
      race,
      archetype,
      rarity,
      set: selectedSet,
      page: 1,
      limit: 30
    });
    setCards(result.cards);
    setTotal(result.total);
    setHasMore(result.hasMore);
  }, [query, type, attribute, race, archetype, rarity, selectedSet]);

  // Load more pages
  const handleLoadMore = () => {
    const nextPage = page + 1;
    const result = searchCards({
      query,
      type,
      attribute,
      race,
      archetype,
      rarity,
      set: selectedSet,
      page: nextPage,
      limit: 30
    });
    setCards(prev => [...prev, ...result.cards]);
    setPage(nextPage);
    setHasMore(result.hasMore);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setQuery('');
    setType('');
    setAttribute('');
    setRace('');
    setArchetype('');
    setRarity('');
    setSelectedSet('');
    if (onClearInitialSet) onClearInitialSet();
  };

  // Handle set selection from the card detail modal
  const handleSelectSet = (setName) => {
    setSelectedCardId(null); // Close the modal
    if (onSelectSet) {
      onSelectSet(setName);
    } else {
      setSelectedSet(setName);
    }
  };

  // Determine available races based on selected card type
  const getAvailableRaces = () => {
    if (type === 'Spell') return [...new Set(RACES.Spell)];
    if (type === 'Trap') return [...new Set(RACES.Trap)];
    if (type === 'Monster') return [...new Set(RACES.Monster)];
    // If no type is selected, return all races merged without duplicates
    return [...new Set([...RACES.Monster, ...RACES.Spell, ...RACES.Trap])].sort();
  };

  return (
    <div className="catalog-container">
      <header className="catalog-header">
        <div>
          <span className="catalog-eyebrow">Biblioteca de cartas</span>
          <h1 className="catalog-title">Catálogo</h1>
          <p className="catalog-description">
            Pesquise cartas e encontre a peça certa para sua estratégia.
          </p>
        </div>
        <div className="catalog-total" aria-live="polite">
          <strong>{total.toLocaleString('pt-BR')}</strong>
          <span>{total === 1 ? 'carta encontrada' : 'cartas encontradas'}</span>
        </div>
      </header>

      <div className="top-search-row">
        <div className="filter-group search-only-group">
          <label htmlFor="catalog-search">Buscar cartas</label>
          <div className="catalog-search-field">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
            id="catalog-search"
            type="search"
            placeholder="Nome ou descrição da carta..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="filter-input"
          />
          </div>
        </div>

        <button
          className="filters-toggle-btn"
          onClick={() => setShowFilters(prev => !prev)}
          aria-expanded={showFilters}
          aria-controls="catalog-filters"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 7h16M7 12h10m-7 5h4" />
          </svg>
          {showFilters ? 'Ocultar filtros' : 'Filtros'}
        </button>
      </div>
      {/* Info & Reset Button */}
      <div className="filters-summary-footer">
        {(query || type || attribute || race || archetype || rarity || selectedSet) && (
          <button onClick={handleResetFilters} className="clear-filters-btn">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-card filters-panel" id="catalog-filters">
          
          {/* Row 1: Type */}
          <div className="filters-row-primary">
            {/* Card Type Filter */}
            <div className="filter-group">
              <label htmlFor="catalog-type">Tipo de carta</label>
              <select 
                id="catalog-type"
                value={type}
                onChange={e => { setType(e.target.value); setRace(''); setAttribute(''); }}
                className="filter-select"
              >
                <option value="">Todos os tipos</option>
                <option value="Monster">Monstro</option>
                <option value="Spell">Magia</option>
                <option value="Trap">Armadilha</option>
              </select>
            </div>
          </div>

        {/* Row 2: Secondary Filters */}
        <div className="filters-row-secondary">
          {/* Monster Attribute */}
          <div className="filter-group">
            <label htmlFor="catalog-attribute" className={type === 'Spell' || type === 'Trap' ? 'disabled' : ''}>
              Atributo
            </label>
            <select 
              id="catalog-attribute"
              value={attribute}
              onChange={e => setAttribute(e.target.value)}
              disabled={type === 'Spell' || type === 'Trap'}
              className="filter-select"
            >
              <option value="">Todos</option>
              {ATTRIBUTES.map(attr => <option key={attr} value={attr}>{attr}</option>)}
            </select>
          </div>

          {/* Sub-type/Race */}
          <div className="filter-group">
            <label htmlFor="catalog-race">Raça / subtipo</label>
            <select 
              id="catalog-race"
              value={race}
              onChange={e => setRace(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos</option>
              {getAvailableRaces().map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Archetype */}
          <div className="filter-group">
            <label htmlFor="catalog-archetype">Arquétipo</label>
            <select 
              id="catalog-archetype"
              value={archetype}
              onChange={e => setArchetype(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos</option>
              {archetypes.map(arch => <option key={arch} value={arch}>{arch}</option>)}
            </select>
          </div>

          {/* Set / Coleção */}
          <div className="filter-group">
            <label>Set / Coleção</label>
            <select 
              value={selectedSet}
              onChange={e => setSelectedSet(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas as coleções</option>
              {sets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3: Rarity */}
        <div className="filters-row-secondary">
          <div className="filter-group">
            <label htmlFor="catalog-rarity">Raridade</label>
            <select
              id="catalog-rarity"
              value={rarity}
              onChange={e => setRarity(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas</option>
              {rarities.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className="empty-catalog">
          <span aria-hidden="true">⌕</span>
          <h2>Nenhuma carta encontrada</h2>
          <p>Tente outro termo ou ajuste os filtros para ampliar a busca.</p>
          {(query || type || attribute || race || archetype || rarity || selectedSet) && (
            <button onClick={handleResetFilters} className="btn-secondary">
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="cards-grid" aria-label="Resultados do catálogo">
            {cards.map(card => {
              const isSpell = card.type.includes('Spell');
              const isTrap = card.type.includes('Trap');
              const cardCategory = isSpell ? 'spell' : isTrap ? 'trap' : 'monster';
              
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`card-item ${cardCategory}`}
                  type="button"
                  aria-label={`Ver detalhes de ${card.name}`}
                >
                  {/* Card Image Container */}
                  <span className="card-image-wrapper">
                    <img 
                      src={card.image_url_small} 
                      alt={card.name}
                      loading="lazy"
                      className="card-image"
                      onError={e => {
                        e.target.src = appLogo;
                      }}
                    />
                    <span className="card-open-hint" aria-hidden="true">Ver carta</span>
                  </span>
                  
                  {/* Card Label */}
                  <span className="card-info">
                    <span className="card-name">
                      {card.name}
                    </span>
                    
                    {/* Small tag indicator */}
                    <span className={`card-tag ${cardCategory}`}>
                      {isSpell ? 'Magia' : isTrap ? 'Armadilha' : card.race}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="load-more-wrapper">
              <button className="btn-secondary" onClick={handleLoadMore}>
                Carregar mais cartas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Card Details Modal popup */}
      {selectedCardId && (
        <CardDetailModal 
          cardId={selectedCardId} 
          onClose={() => setSelectedCardId(null)} 
          onSelectSet={handleSelectSet}
        />
      )}
    </div>
  );
}
