import { useAuth } from '../contexts/useAuth'
import { useNavigate } from 'react-router-dom'
import { Users, Key, Video, MessageSquare, BookOpen, Plus } from 'lucide-react'
import DashboardHeader from '../components/DashboardHeader'
import Button from '../components/ui/Button'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30">
      <DashboardHeader onLogout={handleLogout} />
      
      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-16 mt-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Bienvenido, {user.firstName}
            </h1>
            <p className="mt-2 text-slate-600 text-lg">
              Gestiona tus salas de estudio colaborativas
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-sm rounded-lg" onClick={() => navigate('/salas/crear')}>
              <Plus className="mr-2 h-4 w-4" /> Crear Sala
            </Button>
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => navigate('/unirse')}>
              Unirme a una Sala
            </Button>
          </div>
        </div>

        {/* Empty State Section */}
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-200 mb-8">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No tienes salas todavía</h2>
          <p className="text-slate-600 mb-8 max-w-md">
            Crea tu primera sala de estudio o únete a una existente usando un código de acceso
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 px-8 py-6 rounded-xl shadow-md" onClick={() => navigate('/salas/crear')}>
              <Plus className="mr-2 h-5 w-5" /> Crear mi primera sala
            </Button>
            <Button variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-6 rounded-xl shadow-sm" onClick={() => navigate('/unirse')}>
              <Key className="mr-2 h-5 w-5" /> Tengo un código
            </Button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-24 pt-10 border-t border-slate-100">
          <p className="text-center text-xs font-bold tracking-wider text-slate-400 uppercase mb-8">
            ¿Qué puedes hacer en Salón de Estudio?
          </p>
          
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 mb-4">
                <Video className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Videoconferencia</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Conecta en tiempo real con tus compañeros usando video y audio
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 mb-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Chat Colaborativo</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Comparte ideas, recursos y dudas con todos los participantes
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500 mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Salas Privadas</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Crea salas con código de acceso para estudiar con tu grupo
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
