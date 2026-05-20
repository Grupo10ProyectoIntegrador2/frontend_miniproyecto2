# Salón de Estudio Colaborativo en Tiempo Real — Frontend

**Mini-proyecto 2 | Proyecto Integrador I – 2026-I**
Stack: React + Vite + TypeScript + Tailwind CSS

---

## 🚀 Inicio rápido

```bash
# 1. Clona el repositorio
git clone https://github.com/Grupo10ProyectoIntegrador2/frontend_miniproyecto2.git
cd frontend_miniproyecto2

# 2. Instala dependencias
npm install

# 3. Configura variables de entorno
cp .env.example .env
# → Edita .env con tus credenciales de Firebase (Sprint 1)

# 4. Inicia el servidor de desarrollo
npm run dev
```

## 🗺️ Rutas SPA

| Ruta | Página | Protegida |
|---|---|---|
| `/` | Landing | ❌ |
| `/login` | Inicio de sesión | ❌ |
| `/registro` | Registro manual | ❌ |
| `/registro/google-username` | Completar registro Google | ❌ |
| `/dashboard` | Dashboard principal | ✅ |
| `/perfil` | Ver y editar perfil | ✅ |
| `/salas/crear` | Crear sala de estudio | ✅ |
| `/salas/:roomId` | Entorno colaborativo | ✅ |
| `/salas/:roomId/configurar` | Configurar sala (anfitrión) | ✅ |
| `/unirse` | Unirse por ID | ✅ |
| `/404` | Página no encontrada | ❌ |

## 🛠️ Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo (Vite)
npm run build     # Build de producción
npm run lint      # Linting (ESLint + jsx-a11y)
npm run preview   # Preview del build de producción
```

## 📦 Stack técnico

- **Framework**: React 19 + TypeScript
- **Build tool**: Vite
- **Estilos**: Tailwind CSS v4
- **Enrutamiento**: React Router v7
- **Linting**: ESLint + `eslint-plugin-jsx-a11y` (WCAG)
- **Auth/DB**: Firebase (Sprint 1) — pendiente
- **Tiempo real**: WebSockets + WebRTC (Sprint 3-5) — pendiente


## 📅 Sprints

| Sprint | Objetivo |
|---|---|
| 0 ✅ | Base técnica: Vite + ESLint a11y + rutas SPA |
| 1 | Firebase Auth + Login + Registro |
| 2 | Perfil + Gestión de salas + WebSockets base |
| 3 | Chat en tiempo real + historial Firestore |
| 4 | WebRTC Signaling + Grid de video |
| 5 | Control AV + Compartición de pantalla |
| 6 | Accesibilidad WCAG 2.2 + pruebas de usuario |
| 7 | Integración E2E + Swagger + Despliegue |
