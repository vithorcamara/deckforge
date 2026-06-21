import './style.css';

export default function Home({ onNavigate }) {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Monte & Otimize Seus Decks</h1>
        <p className="hero-description">
          DeckForge é um construtor de decks inteligente, rápido e offline-friendly focado na consistência de suas jogadas de Yu-Gi-Oh!
        </p>
        <div className="hero-cta-group">
          <button className="btn-primary" onClick={() => onNavigate('builder')}>
            Iniciar Deck Builder
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('catalog')}>
            Explorar Cartas
          </button>
        </div>
      </section>

      {/* Feature Grid / Cards */}
      <section className="features-grid">
        {/* Catalog Card */}
        <div className="glass-card feature-card" onClick={() => onNavigate('catalog')}>
          <div className="feature-icon-wrapper icon-gold">
            📚
          </div>
          <h3>Catálogo de Cartas</h3>
          <p>
            Acesse milhares de cartas do banco de dados oficial do Yu-Gi-Oh! via YGOPRODeck API, com busca ultra-rápida, filtros detalhados e funcionamento offline.
          </p>
        </div>

        {/* Builder Card */}
        <div className="glass-card feature-card" onClick={() => onNavigate('builder')}>
          <div className="feature-icon-wrapper icon-magic">
            🧱
          </div>
          <h3>Deck Builder Pro</h3>
          <p>
            Monte e organize seus decks (Main, Extra e Side) com contagem automática de cartas, validação de banlists, simulação de compras de mão e exportação direta em formato .ydk.
          </p>
        </div>

        {/* Collection Card */}
        <div className="glass-card feature-card" onClick={() => onNavigate('collection')}>
          <div className="feature-icon-wrapper icon-gold">
            📊
          </div>
          <h3>Análise & Coleção</h3>
          <p>
            Cadastre suas cartas e compare listas de decks prontas com a sua coleção local. Identifique instantaneamente cartas faltantes e encontre sugestões de substituições.
          </p>
        </div>
      </section>
    </div>
  );
}
