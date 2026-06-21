import { useState, useEffect } from 'react';
import appLogo from '/favicon.png';
import PWABadge from './PWABadge.jsx';
import { checkAndSyncCards } from './services/cardService';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Builder from './pages/Builder';

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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        fontFamily: 'var(--font-primary)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div className="glass-card" style={{
          maxWidth: '480px',
          width: '100%',
          padding: '3rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          border: `1px solid ${isError ? 'rgba(231, 29, 54, 0.3)' : 'var(--glass-border)'}`,
          boxShadow: isError ? '0 0 30px rgba(231, 29, 54, 0.15)' : 'var(--shadow-lg)'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <img src={appLogo} alt="DeckForge Logo" style={{ width: '40px', height: '40px' }} />
            <span style={{
              fontSize: '2rem',
              fontWeight: 800,
              background: 'var(--gradient-gold)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              DeckForge
            </span>
          </div>

          {/* Loader or Error Icon */}
          {isError ? (
            <div style={{ fontSize: '3rem' }}>⚠️</div>
          ) : (
            <div className="spinner" style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(223, 177, 91, 0.1)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          )}

          {/* Message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: isError ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {isError ? 'Erro de Inicialização' : 'Preparando Banco de Dados'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {syncState.message}
            </p>
          </div>

          {/* Progress Warning */}
          {syncState.status === 'fetching' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Isso acontece apenas no primeiro acesso ou se houver atualizações nas cartas.
            </span>
          )}

          {/* Retry Button */}
          {isError && (
            <button 
              className="btn-primary" 
              onClick={startSync}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              Tentar Novamente
            </button>
          )}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Renders the main App once database is ready
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
      <PWABadge/>
      {/* Header */}
      <header style={{
        background: 'var(--surface-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(20, 22, 29, 0.8)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Brand/Logo */}
          <div 
            style={{ alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => setActiveTab('home')}
            id="logo"
          >
            <img src={appLogo} alt="DeckForge Logo" style={{ width: '32px', height: '32px' }} />
          </div>
          
          {/* Navigation Menu */}
          <nav style={{ display: 'flex', gap: '0.4rem' }}>
            <button 
              className={`btn-secondary ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                borderColor: activeTab === 'home' ? 'var(--color-primary)' : 'transparent',
                backgroundColor: activeTab === 'home' ? 'rgba(223, 177, 91, 0.1)' : 'transparent',
                color: activeTab === 'home' ? 'var(--color-primary)' : 'var(--text-secondary)'
              }}
            >
              🏠 Início
            </button>
            <button 
              className={`btn-secondary ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                borderColor: activeTab === 'catalog' ? 'var(--color-primary)' : 'transparent',
                backgroundColor: activeTab === 'catalog' ? 'rgba(223, 177, 91, 0.1)' : 'transparent',
                color: activeTab === 'catalog' ? 'var(--color-primary)' : 'var(--text-secondary)'
              }}
            >
              📚 Catálogo
            </button>
            <button 
              className={`btn-secondary ${activeTab === 'builder' ? 'active' : ''}`}
              onClick={() => setActiveTab('builder')}
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                borderColor: activeTab === 'builder' ? 'var(--color-primary)' : 'transparent',
                backgroundColor: activeTab === 'builder' ? 'rgba(223, 177, 91, 0.1)' : 'transparent',
                color: activeTab === 'builder' ? 'var(--color-primary)' : 'var(--text-secondary)'
              }}
            >
              🧱 Deck Builder
            </button>
            <button 
              className={`btn-secondary ${activeTab === 'collection' ? 'active' : ''}`}
              onClick={() => setActiveTab('collection')}
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                borderColor: activeTab === 'collection' ? 'var(--color-primary)' : 'transparent',
                backgroundColor: activeTab === 'collection' ? 'rgba(223, 177, 91, 0.1)' : 'transparent',
                color: activeTab === 'collection' ? 'var(--color-primary)' : 'var(--text-secondary)'
              }}
            >
              📊 Coleção
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem 0' }}>
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

          {activeTab === 'collection' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
              <div className="glass-card" style={{ maxWidth: '500px', padding: '3rem 2rem', border: '1px dashed var(--border-color)' }}>
                <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📊</span>
                <h2 style={{ background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>
                  Gerenciador de Coleção
                </h2>
                <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                  A gestão de sua coleção física de cartas está a caminho! Você poderá registrar quais cartas possui para comparar com listas de decks prontas e simular custos e compras de cartas faltantes.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-color)', 
        padding: '1.5rem 0', 
        background: 'var(--surface-color)',
        textAlign: 'center'
      }}>
        <div className="container">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            DeckForge &copy; {new Date().getFullYear()} - Construído com React, Dexie (IndexedDB) e YGOPRODeck API. Funcionamento offline ativado.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
