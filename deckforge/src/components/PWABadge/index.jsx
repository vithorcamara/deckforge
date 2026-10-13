import './style.css'

import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWABadge() {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isDismissed, setIsDismissed] = useState(false)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setCanInstall(true)
      setIsDismissed(false)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    if (offlineReady || needRefresh)
      setIsDismissed(false)
  }, [offlineReady, needRefresh])

  async function installApp() {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanInstall(false)
  }

  function close() {
    setOfflineReady(false)
    setNeedRefresh(false)
    setIsDismissed(true)
  }

  if (isDismissed || (!offlineReady && !needRefresh && !canInstall))
    return null

  const title = needRefresh
    ? 'Atualização disponível'
    : canInstall
      ? 'Instale o DeckForge'
      : 'Pronto para usar offline'
  const description = needRefresh
    ? 'Uma nova versão está pronta. Atualize para continuar.'
    : canInstall
      ? 'Acesse seus decks e sua coleção direto da tela inicial.'
      : 'O DeckForge está disponível mesmo sem conexão.'

  return (
    <aside className="PWABadge" aria-label="Notificações do DeckForge">
      <div className="PWABadge-toast" role="status" aria-live="polite">
        <div className="PWABadge-content">
          <span className="PWABadge-icon" aria-hidden="true">
            {needRefresh ? (
              <svg viewBox="0 0 24 24">
                <path d="M20 7v5h-5" />
                <path d="M4 17v-5h5" />
                <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
              </svg>
            ) : canInstall ? (
              <svg viewBox="0 0 24 24">
                <path d="M12 15V3" />
                <path d="m7 8 5-5 5 5" />
                <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M5 12.5 9.2 17 19 7" />
                <path d="M21 12a9 9 0 1 1-5.1-8.1" />
              </svg>
            )}
          </span>
          <div className="PWABadge-copy">
            <h2 className="PWABadge-title">{title}</h2>
            <p className="PWABadge-description">{description}</p>
          </div>
        </div>
        <div className="PWABadge-buttons">
          {canInstall && (
            <button className="PWABadge-toast-button PWABadge-toast-button--secondary" onClick={close}>
              Agora não
            </button>
          )}
          {offlineReady && !canInstall && !needRefresh && (
            <button className="PWABadge-toast-button PWABadge-toast-button--secondary" onClick={close}>
              Fechar
            </button>
          )}
          {canInstall && (
            <button className="PWABadge-toast-button PWABadge-toast-button--primary" onClick={installApp}>
              Instalar
            </button>
          )}
          {needRefresh && (
            <>
              {!canInstall && (
                <button className="PWABadge-toast-button PWABadge-toast-button--secondary" onClick={close}>
                  Agora não
                </button>
              )}
              <button className="PWABadge-toast-button PWABadge-toast-button--primary" onClick={() => updateServiceWorker(true)}>
                Atualizar
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
