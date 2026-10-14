import { useState, useEffect } from 'react';
import './style.css';
import appLogo from '/icons/pwa-512x512.png';
import { checkAndSyncCards } from '../../services/cardService.js';
import Home from '../Home/index.jsx';
import Catalog from '../Catalog/index.jsx';
import Builder from '../Builder/index.jsx';
import Collection from '../Collection/index.jsx';
import Binder from '../Binder/index.jsx';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [syncState, setSyncState] = useState({ status: 'checking', message: 'Iniciando...' });
  const [selectedSet, setSelectedSet] = useState('');

  const startSync = () => {
    setSyncState({ status: 'checking', message: 'Verificando banco de dados...' });
    checkAndSyncCards(setSyncState);
  };

  useEffect(() => {
    startSync();
  }, []);

  // Renders the startup loading / syncing page
  if (syncState.status !== 'ready') {
    const isError = syncState.status === 'error';
    
    return (
      <div className="app-loading-page">
        <div className={`glass-card app-sync-card ${isError ? 'is-error' : ''}`}>
          {/* Logo */}
          <div className="app-sync-brand">
            <img src={appLogo} alt="DeckForge Logo" className="app-sync-logo" />
            <span className="app-sync-brand-name">
              DeckForge
            </span>
          </div>

          {/* Loader or Error Icon */}
          {isError ? (
            <div className="app-error-icon">⚠️</div>
          ) : (
            <div className="app-spinner"></div>
          )}

          {/* Message */}
          <div className="app-sync-message">
            <h3 className={isError ? 'is-error' : ''}>
              {isError ? 'Erro de Inicialização' : 'Preparando Banco de Dados'}
            </h3>
            <p>
              {syncState.message}
            </p>
          </div>

          {/* Progress Warning */}
          {syncState.status === 'fetching' && (
            <span className="app-sync-warning">
              Isso acontece apenas no primeiro acesso ou se houver atualizações nas cartas.
            </span>
          )}

          {/* Retry Button */}
          {isError && (
            <button 
              className="btn-primary app-retry-button"
              onClick={startSync}
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  // Renders the main App once database is ready
  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="container app-header-content">
          {/* Brand/Logo */}
          <div 
            className="app-header-logo"
            onClick={() => setActiveTab('home')}
            id="logo"
          >
            <img src={appLogo} alt="DeckForge Logo" />
          </div>
          
          {/* Navigation Menu */}
          <nav className="app-nav" aria-label="Navegação principal">
            <button 
              className={`app-nav-button ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <svg className="app-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
              </svg>
              <span>Início</span>
            </button>
            <button 
              className={`app-nav-button ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              <svg className="app-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
              <span>Catálogo</span>
            </button>
            <button 
              className={`app-nav-button ${activeTab === 'builder' ? 'active' : ''}`}
              onClick={() => setActiveTab('builder')}
            >
              <svg className="app-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
              <span className="app-nav-label-desktop">Deck Builder</span>
              <span className="app-nav-label-mobile">Deck</span>
            </button>
            <button 
              className={`app-nav-button ${activeTab === 'binder' ? 'active' : ''}`}
              onClick={() => setActiveTab('binder')}
            >
              <svg className="app-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h14v16H5zM9 4v16M12 8h4M12 12h4" />
              </svg>
              <span>Binder</span>
            </button>
            <button 
              className={`app-nav-button ${activeTab === 'collection' ? 'active' : ''}`}
              onClick={() => setActiveTab('collection')}
            >
              <svg className="app-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 7h8v6H3zM13 7h8v6h-8zM3 15h8v6H3zM13 15h8v6h-8z" />
              </svg>
              <span>Coleção</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        <div className="container">
          {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
          {activeTab === 'catalog' && (
            <Catalog 
              initialSet={selectedSet} 
              onClearInitialSet={() => setSelectedSet('')}
              onSelectSet={(setName) => {
                setSelectedSet(setName);
                setActiveTab('catalog');
              }}
            />
          )}
          {activeTab === 'builder' && <Builder />}
          {activeTab === 'binder' && <Binder />}
          {activeTab === 'collection' && <Collection />}
          {/* Footer */}
          <footer className="app-footer">
            <div className="container">
              <p className="app-footer-text">
                DeckForge &copy; {new Date().getFullYear()} - Construído com React, Dexie (IndexedDB) e YGOPRODeck API. Funcionamento offline ativado.
              </p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
