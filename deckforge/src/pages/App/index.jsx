import { useState, useEffect } from 'react';
import './style.css';
import appLogo from '/favicon.png';
import PWABadge from '../../PWABadge.jsx';
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
      <PWABadge/>
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
          <nav className="app-nav">
            <button 
              className={`app-nav-button ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              Início
            </button>
            <button 
              className={`app-nav-button ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              Catálogo
            </button>
            <button 
              className={`app-nav-button ${activeTab === 'builder' ? 'active' : ''}`}
              onClick={() => setActiveTab('builder')}
            >
              Deck Builder
            </button>
            <button 
              className={`app-nav-button ${activeTab === 'binder' ? 'active' : ''}`}
              onClick={() => setActiveTab('binder')}
            >
              Binder
            </button>
            <button 
              className={`app-nav-button ${activeTab === 'collection' ? 'active' : ''}`}
              onClick={() => setActiveTab('collection')}
            >
              Coleção
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
