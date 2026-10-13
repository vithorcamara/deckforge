import './style.css';

const features = [
  {
    tab: 'catalog',
    icon: '📚',
    tone: 'gold',
    eyebrow: 'Descubra',
    title: 'Catálogo de cartas',
    description: 'Encontre cartas com busca rápida, filtros detalhados e acesso offline ao seu catálogo.',
  },
  {
    tab: 'builder',
    icon: '🧱',
    tone: 'magic',
    eyebrow: 'Construa',
    title: 'Deck Builder',
    description: 'Monte decks Main, Extra e Side, confira a lista e exporte no formato .ydk.',
  },
  {
    tab: 'collection',
    icon: '📊',
    tone: 'gold',
    eyebrow: 'Acompanhe',
    title: 'Coleção',
    description: 'Gerencie suas cartas e compare sua coleção com listas de decks.',
  },
  {
    tab: 'binder',
    icon: '📎',
    tone: 'magic',
    eyebrow: 'Organize',
    title: 'Binder virtual',
    description: 'Organize cartas por coleção e descubra quais ainda faltam para completar seus sets.',
  },
];

export default function Home({ onNavigate }) {
  return (
    <div className="home-container">
      <section className="hero-section" aria-labelledby="home-title">
        <div className="hero-content">
          <span className="hero-eyebrow">
            <span className="hero-eyebrow-mark" aria-hidden="true" />
            Seu próximo duelo começa aqui
          </span>
          <h1 className="hero-title" id="home-title">
            Estratégia para o seu <span>próximo deck.</span>
          </h1>
          <p className="hero-description">
            Explore cartas, refine suas estratégias e organize sua coleção de Yu-Gi-Oh! — online ou offline.
          </p>
          <div className="hero-cta-group">
            <button className="btn-primary hero-cta" onClick={() => onNavigate('builder')}>
              Criar meu deck
              <span aria-hidden="true">↗</span>
            </button>
            <button className="btn-secondary hero-cta" onClick={() => onNavigate('catalog')}>
              Explorar catálogo
            </button>
          </div>
          <div className="hero-note">
            <span className="hero-note-dot" aria-hidden="true" />
            Seus decks e sua coleção ficam salvos no dispositivo
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-orbit hero-art-orbit--outer" />
          <div className="hero-art-orbit hero-art-orbit--inner" />
          <div className="hero-art-core">
            <span>DF</span>
          </div>
          <span className="hero-art-spark hero-art-spark--top">✦</span>
          <span className="hero-art-spark hero-art-spark--bottom">✧</span>
        </div>
      </section>

      <section className="home-features" aria-labelledby="features-title">
        <div className="features-heading">
          <div>
            <span className="section-eyebrow">Tudo em um só lugar</span>
            <h2 id="features-title">Prepare sua próxima jogada</h2>
          </div>
          <p>As ferramentas certas para cada etapa da sua estratégia.</p>
        </div>

        <div className="features-grid">
          {features.map(({ tab, icon, tone, eyebrow, title, description }) => (
            <button
              className="glass-card feature-card"
              key={tab}
              onClick={() => onNavigate(tab)}
              aria-label={`${title}: ${description}`}
            >
              <span className={`feature-icon-wrapper icon-${tone}`} aria-hidden="true">
                {icon}
              </span>
              <span className="feature-card-copy">
                <span className="feature-eyebrow">{eyebrow}</span>
                <span className="feature-title">{title}</span>
                <span className="feature-description">{description}</span>
              </span>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
