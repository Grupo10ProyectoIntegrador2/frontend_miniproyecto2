/**
 * AppRouter.tsx
 * Define todas las rutas SPA del Salón de Estudio Colaborativo.
 *
 * Rutas públicas (sin autenticación requerida):
 *   /                        → LandingPage
 *   /login                   → LoginPage
 *   /registro                → RegistroPage
 *   /registro/google-username → RegistroGoogleUsernamePage
 *   /404                     → NotFoundPage
 *   *                        → Redirige a /404
 *
 * Rutas protegidas (requieren autenticación - Sprint 1 conectará Firebase Auth):
 *   /dashboard               → DashboardPage
 *   /perfil                  → PerfilPage
 *   /salas/crear             → SalasCrearPage
 *   /salas/:roomId           → SalaRoomPage
 *   /salas/:roomId/configurar → SalasConfigurarPage
 *   /unirse                  → UnirsePage
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Pages — públicas
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegistroPage from '../pages/RegistroPage'
import RegistroGoogleUsernamePage from '../pages/RegistroGoogleUsernamePage'
import NotFoundPage from '../pages/NotFoundPage'

// Pages — protegidas
import DashboardPage from '../pages/DashboardPage'
import PerfilPage from '../pages/PerfilPage'
import SalasCrearPage from '../pages/SalasCrearPage'
import SalaRoomPage from '../pages/SalaRoomPage'
import SalasConfigurarPage from '../pages/SalasConfigurarPage'
import UnirsePage from '../pages/UnirsePage'

// Guard
import ProtectedRoute from '../components/common/ProtectedRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Rutas públicas ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/registro/google-username" element={<RegistroGoogleUsernamePage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* ── Rutas protegidas ── */}
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
              <SalaRoomPage />
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
          path="/unirse"
          element={
            <ProtectedRoute>
              <UnirsePage />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all → 404 ── */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
