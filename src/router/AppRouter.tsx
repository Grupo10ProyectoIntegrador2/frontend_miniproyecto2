/**
 * AppRouter.tsx
 * Define todas las rutas SPA del Salon de Estudio Colaborativo.
 *
 * Rutas publicas (sin autenticacion requerida):
 *   /                         -> LandingPage
 *   /login                    -> LoginPage (redirige a dashboard si ya autenticado)
 *   /registro                 -> RegistroPage (redirige a dashboard si ya autenticado)
 *   /registro/google-username -> RegistroGoogleUsernamePage
 *   /404                      -> NotFoundPage
 *   *                         -> Redirige a /404
 *
 * Rutas protegidas (requieren autenticacion):
 *   /dashboard                -> DashboardPage
 *   /perfil                   -> PerfilPage
 *   /salas/crear              -> SalasCrearPage
 *   /salas/:roomId            -> Redirige a /salas/:roomId/chat
 *   /salas/:roomId/configurar -> SalasConfigurarPage
 *   /unirse                   -> UnirsePage
 */
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'

// Paginas publicas
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegistroPage from '../pages/RegistroPage'
import RegistroGoogleUsernamePage from '../pages/RegistroGoogleUsernamePage'
import NotFoundPage from '../pages/NotFoundPage'

// Paginas protegidas
import DashboardPage from '../pages/DashboardPage'
import PerfilPage from '../pages/PerfilPage'
import SalasCrearPage from '../pages/SalasCrearPage'
import SalasConfigurarPage from '../pages/SalasConfigurarPage'
import ChatPage from '../pages/ChatPage'
import VideoCallPage from '../pages/VideoCallPage'
import UnirsePage from '../pages/UnirsePage'

// Guards de ruta
import ProtectedRoute from '../components/common/ProtectedRoute'
import PublicOnlyRoute from '../components/common/PublicOnlyRoute'

function RedirectToRoomChat() {
  const { roomId } = useParams<{ roomId: string }>()
  return <Navigate to={`/salas/${roomId}/chat`} replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas publicas */}
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/registro"
          element={
            <PublicOnlyRoute>
              <RegistroPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/registro/google-username"
          element={<RegistroGoogleUsernamePage />}
        />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salas/crear"
          element={
            <ProtectedRoute>
              <SalasCrearPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salas/:roomId"
          element={
            <ProtectedRoute>
              <RedirectToRoomChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salas/:roomId/configurar"
          element={
            <ProtectedRoute>
              <SalasConfigurarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salas/:roomId/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salas/:roomId/video"
          element={
            <ProtectedRoute>
              <VideoCallPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/unirse"
          element={
            <ProtectedRoute>
              <UnirsePage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
