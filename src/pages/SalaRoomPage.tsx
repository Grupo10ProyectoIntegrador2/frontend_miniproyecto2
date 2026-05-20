/**
 * SalaRoomPage – Ruta: /salas/:roomId (protegida)
 * Propósito: Entorno colaborativo principal (chat + video + audio + pantalla compartida).
 * Acciones: Ver grid de participantes, enviar mensajes, ver historial, activar/desactivar
 *           micrófono, activar/desactivar cámara, compartir pantalla, salir de la sala.
 * Datos: Room ID, nombre de sala, participantes conectados, estados AV, mensajes del chat,
 *        historial persistente, streams WebRTC.
 * Estados:
 *   Vacío → sala sin mensajes o sin otros participantes
 *   Éxito → grid + chat + controles funcionando
 *   Error → sala no encontrada, permisos denegados, fallo de conexión, error al cargar historial
 * TODO Sprint 3: Chat via WebSockets + historial Firestore
 * TODO Sprint 4: WebRTC video/audio P2P
 * TODO Sprint 5: Control AV + compartición de pantalla
 */
import { useParams } from 'react-router-dom'

export default function SalaRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()

  return (
    <main id="main-content" className="min-h-screen flex flex-col p-4 gap-4">
      {/* Header de sala */}
      <header className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h1 className="text-lg font-bold">Sala: <span aria-label={`ID de sala: ${roomId}`}>{roomId}</span></h1>
        <button id="btn-salir-sala" type="button" className="px-4 py-2 rounded-lg font-semibold border"
          style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
          aria-label="Salir de la sala">
          Salir
        </button>
      </header>

      <div className="flex flex-1 gap-4" style={{ minHeight: 0 }}>
        {/* Grid de video (placeholder) */}
        <section aria-label="Grid de participantes"
          className="flex-1 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {/* TODO Sprint 4: Renderizar streams WebRTC */}
            Grid de video — próximamente (Sprint 4)
          </p>
        </section>

        {/* Panel de chat (placeholder) */}
        <aside aria-label="Chat de la sala" className="w-80 flex flex-col rounded-xl overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="p-4 font-semibold border-b" style={{ borderColor: 'var(--color-border)' }}>Chat</h2>
          <div role="log" aria-live="polite" aria-label="Mensajes del chat"
            className="flex-1 p-4 overflow-y-auto">
            {/* TODO Sprint 3: Renderizar mensajes del historial */}
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No hay mensajes aún.</p>
          </div>
          <form aria-label="Enviar mensaje" className="p-4 border-t flex gap-2"
            style={{ borderColor: 'var(--color-border)' }}>
            <label htmlFor="chat-input" className="sr-only">Escribe un mensaje</label>
            <input id="chat-input" type="text" placeholder="Escribe un mensaje..."
              className="flex-1 p-2 rounded-lg text-sm"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            <button id="btn-enviar-mensaje" type="submit" className="px-3 py-2 rounded-lg font-semibold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
              aria-label="Enviar mensaje">
              ➤
            </button>
          </form>
        </aside>
      </div>

      {/* Controles AV (placeholder) */}
      <footer className="flex items-center justify-center gap-4 p-4 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button id="btn-toggle-mic" type="button" aria-label="Activar o desactivar micrófono"
          aria-pressed="true" className="p-3 rounded-full font-semibold"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
          🎙
        </button>
        <button id="btn-toggle-cam" type="button" aria-label="Activar o desactivar cámara"
          aria-pressed="true" className="p-3 rounded-full font-semibold"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
          📷
        </button>
        <button id="btn-compartir-pantalla" type="button" aria-label="Compartir pantalla"
          className="p-3 rounded-full font-semibold"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
          🖥
        </button>
      </footer>
    </main>
  )
}
