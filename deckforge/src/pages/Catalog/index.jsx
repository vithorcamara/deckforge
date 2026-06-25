import { useState, useEffect } from 'react';
import { searchCards, getArchetypes, getCardSets, getRarities } from '../../services/cardService';
import CardDetailModal from '../../components/CardDetailModal';
import appLogo from '/favicon.png';
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
      
      <div className="top-search-row">
        <div className="filter-group search-only-group">
          <label>Search Name / Description</label>
          <input 
            type="text" 
            placeholder="Ex: Dark Magician, Blue-Eyes, Ash..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="filter-input"
          />
        </div>

        <button
          className="filters-toggle-btn"
          onClick={() => setShowFilters(prev => !prev)}
        >
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
      </div>
      {/* Info & Reset Button */}
      <div className="filters-summary-footer">
        <span className="results-count">
          Cards found: <strong>{total}</strong>
        </span>
        {(query || type || attribute || race || archetype || rarity || selectedSet) && (
          <button onClick={handleResetFilters} className="clear-filters-btn">
            🧹 Clear Filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-card filters-panel">
          
          {/* Row 1: Type */}
          <div className="filters-row-primary">
            {/* Card Type Filter */}
            <div className="filter-group">
              <label>Card Type</label>
              <select 
                value={type}
                onChange={e => { setType(e.target.value); setRace(''); setAttribute(''); }}
                className="filter-select"
              >
                <option value="">All</option>
                <option value="Monster">Monster</option>
                <option value="Spell">Spell Card</option>
                <option value="Trap">Trap Card</option>
              </select>
            </div>
          </div>

        {/* Row 2: Secondary Filters */}
        <div className="filters-row-secondary">
          {/* Monster Attribute */}
          <div className="filter-group">
            <label className={type === 'Spell' || type === 'Trap' ? 'disabled' : ''}>
              Attribute
            </label>
            <select 
              value={attribute}
              onChange={e => setAttribute(e.target.value)}
              disabled={type === 'Spell' || type === 'Trap'}
              className="filter-select"
            >
              <option value="">All</option>
              {ATTRIBUTES.map(attr => <option key={attr} value={attr}>{attr}</option>)}
            </select>
          </div>

          {/* Sub-type/Race */}
          <div className="filter-group">
            <label>Property / Sub-type</label>
            <select 
              value={race}
              onChange={e => setRace(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              {getAvailableRaces().map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Archetype */}
          <div className="filter-group">
            <label>Archetype</label>
            <select 
              value={archetype}
              onChange={e => setArchetype(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
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
              <option value="">All</option>
              {sets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3: Rarity */}
        <div className="filters-row-secondary">
          <div className="filter-group">
            <label>Rarity</label>
            <select
              value={rarity}
              onChange={e => setRarity(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              {rarities.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className="empty-catalog">
          <span>🔍</span>
          <h3>No cards match your search criteria.</h3>
        </div>
      ) : (
        <div>
          <div className="cards-grid">
            {cards.map(card => {
              const isSpell = card.type.includes('Spell');
              const isTrap = card.type.includes('Trap');
              const cardCategory = isSpell ? 'spell' : isTrap ? 'trap' : 'monster';
              
              return (
                <div 
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`card-item ${cardCategory}`}
                >
                  {/* Card Image Container */}
                  <div className="card-image-wrapper">
                    <img 
                      src={card.image_url_small} 
                      alt={card.name}
                      loading="lazy"
                      className="card-image"
                      onError={e => {
                        e.target.src = appLogo;
                      }}
                    />
                  </div>
                  
                  {/* Card Label */}
                  <div className="card-info">
                    <div className="card-name">
                      {card.name}
                    </div>
                    
                    {/* Small tag indicator */}
                    <div className={`card-tag ${cardCategory}`}>
                      {isSpell ? 'Spell' : isTrap ? 'Trap' : card.race}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="load-more-wrapper">
              <button className="btn-secondary" onClick={handleLoadMore}>
                Load More Cards
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
