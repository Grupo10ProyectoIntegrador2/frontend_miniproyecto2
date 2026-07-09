# Frontend — Salón de Estudio Colaborativo en Tiempo Real

**Mini-proyecto 2 | Proyecto Integrador I – 2026-I**  
Stack: React 19 + Vite + TypeScript + Tailwind CSS + Firebase + Socket.IO + WebRTC

---

## 📋 Descripción

Aplicación web SPA (Single Page Application) para salones de estudio colaborativos en tiempo real. Los usuarios pueden:

- **Autenticarse** con correo/contraseña o Google (Firebase Auth)
- **Crear y gestionar salas** de estudio privadas o públicas
- **Chatear en tiempo real** con otros participantes (Socket.IO)
- **Videollamadas P2P** usando WebRTC (sin servidor de video intermediario)
- **Compartir pantalla** para presentaciones colaborativas
- **Gestionar perfil** con avatar personalizado y estadísticas

La aplicación está construida con accesibilidad WCAG 2.2 en mente y utiliza React Router para navegación entre páginas.

---

## 🚀 Inicio Rápido

### Prerrequisitos Técnicos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) — [Descargar aquí](https://nodejs.org/)
- **npm** o **pnpm** (se incluye con Node.js)
- **Git** para clonar el repositorio
- **Cuenta de Firebase** con un proyecto creado — [Firebase Console](https://console.firebase.google.com/)
- **Backend corriendo** (ver repositorio backend para instrucciones)

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/Grupo10ProyectoIntegrador2/frontend_miniproyecto2.git
cd frontend_miniproyecto2

# 2. Instalar dependencias
npm install
# o si usas pnpm:
pnpm install

# 3. Configurar variables de entorno (ver sección siguiente)
cp .env.example .env.local
# Edita el archivo .env.local con tus credenciales de Firebase

# 4. Iniciar el servidor de desarrollo
npm run dev

# La aplicación estará disponible en:
# → http://localhost:5173
```

---

## ⚙️ Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:

### Variables Requeridas

#### `VITE_API_BASE_URL`
**Descripción**: URL base del backend (API REST y WebSockets).  
**Desarrollo local**: `http://localhost:3000` (puerto por defecto del backend)  
**Producción**: URL de tu backend desplegado en Render  
**Ejemplo**: 
```env
VITE_API_BASE_URL=http://localhost:3000
```

#### `VITE_FIREBASE_API_KEY`
**Descripción**: API Key de tu proyecto de Firebase. **No es secreta**, se puede exponer públicamente según Firebase.  
**Dónde encontrarla**: Firebase Console → Configuración del proyecto → General → Tus apps → Configuración de SDK  
**Ejemplo**: `VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijk`

#### `VITE_FIREBASE_AUTH_DOMAIN`
**Descripción**: Dominio de autenticación de Firebase.  
**Formato**: `tu-proyecto-id.firebaseapp.com`  
**Ejemplo**: `VITE_FIREBASE_AUTH_DOMAIN=salon-estudio-abc123.firebaseapp.com`

#### `VITE_FIREBASE_PROJECT_ID`
**Descripción**: ID del proyecto de Firebase (mismo que en el backend).  
**Ejemplo**: `VITE_FIREBASE_PROJECT_ID=salon-estudio-abc123`

#### `VITE_FIREBASE_STORAGE_BUCKET`
**Descripción**: Bucket de almacenamiento de Firebase (para avatares o archivos futuros).  
**Formato**: `tu-proyecto-id.appspot.com`  
**Ejemplo**: `VITE_FIREBASE_STORAGE_BUCKET=salon-estudio-abc123.appspot.com`

#### `VITE_FIREBASE_MESSAGING_SENDER_ID`
**Descripción**: Sender ID para Firebase Cloud Messaging (notificaciones push).  
**Ejemplo**: `VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012`

#### `VITE_FIREBASE_APP_ID`
**Descripción**: ID de la aplicación web de Firebase.  
**Ejemplo**: `VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890`

#### `VITE_FIREBASE_MEASUREMENT_ID`
**Descripción**: ID de medición de Google Analytics (opcional).  
**Ejemplo**: `VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234`

### Archivo `.env.local` Completo (Ejemplo)

```env
# API configurations
VITE_API_BASE_URL=http://localhost:3000

# Firebase configurations
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijk
VITE_FIREBASE_AUTH_DOMAIN=salon-estudio-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=salon-estudio-abc123
VITE_FIREBASE_STORAGE_BUCKET=salon-estudio-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
```

---

## 🔥 Configuración de Firebase

### 1. Crear Proyecto y Habilitar Servicios

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita los siguientes servicios:

#### Authentication
- **Email/Password**: Firebase Console → Authentication → Sign-in method → Email/Password → Habilitar
- **Google Sign-In**: Firebase Console → Authentication → Sign-in method → Google → Habilitar

#### Firestore Database
- **Crear base de datos**: Firebase Console → Firestore Database → Crear base de datos
- **Modo**: Producción (con reglas de seguridad) o Pruebas (abierto, solo para desarrollo)
- **Ubicación**: Selecciona la más cercana a tus usuarios

### 2. Registrar Aplicación Web

1. En Firebase Console → **Configuración del proyecto** → **General**
2. Desplázate a **Tus apps** → Click en **</>** (icono web)
3. Registra la app con un apodo (ej: "Salon Estudio Frontend")
4. **No** habilites Firebase Hosting ahora (usarás Vercel)
5. Copia las credenciales de configuración:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc...",
  measurementId: "G-ABC..."
};
```

6. Copia estos valores a tu archivo `.env.local` (con el prefijo `VITE_`)

### 3. Configurar Reglas de Seguridad de Firestore

En Firebase Console → Firestore Database → Reglas, usa estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función auxiliar: verificar autenticación
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Colección de usuarios
    match /users/{userId} {
      // Solo el dueño puede leer/escribir su propio perfil
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Colección de salas
    match /rooms/{roomId} {
      // Cualquier usuario autenticado puede leer salas
      allow read: if isSignedIn();
      // Solo usuarios autenticados pueden crear salas
      allow create: if isSignedIn();
      // Solo el host o participantes pueden actualizar/eliminar
      allow update, delete: if isSignedIn() && 
        (resource.data.host == request.auth.uid || 
         request.auth.uid in resource.data.participants);
    }
    
    // Colección de mensajes (chat)
    match /messages/{messageId} {
      // Cualquier usuario autenticado puede leer mensajes
      allow read: if isSignedIn();
      // Solo usuarios autenticados pueden crear mensajes
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 🔌 Conectar con el Backend

### Desarrollo Local

1. Asegúrate de que el backend esté corriendo en `http://localhost:3000`
2. En `.env.local`, configura:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

### Producción

1. Despliega el backend en Render/Railway
2. Obtén la URL pública (ej: `https://salon-backend.onrender.com`)
3. En Vercel, configura la variable de entorno:
   ```env
   VITE_API_BASE_URL=https://salon-backend.onrender.com
   ```
4. **Importante**: Actualiza `ALLOWED_ORIGINS` en el backend para incluir tu dominio de Vercel

### Flujo de Comunicación Frontend-Backend

1. **Autenticación con Firebase**: El usuario inicia sesión con Firebase Auth
2. **Obtener Token**: El frontend obtiene el token JWT de Firebase: `await user.getIdToken()`
3. **Enviar Token al Backend**: En cada petición HTTP, incluye el header:
   ```javascript
   headers: { Authorization: `Bearer ${token}` }
   ```
4. **Conexión WebSocket**: Socket.IO se conecta con el token en la query:
   ```javascript
   const socket = io(VITE_API_BASE_URL, {
     auth: { token }
   });
   ```

---

## 🌐 WebSockets y WebRTC

### Socket.IO (Chat y Sincronización)

El frontend se conecta a Socket.IO para eventos en tiempo real:

```typescript
// src/lib/socket.ts
const socket = io(import.meta.env.VITE_API_BASE_URL, {
  auth: { token: await user.getIdToken() }
});
```

#### Eventos que Emite el Cliente

- `join-room`: Unirse a una sala
- `leave-room`: Salir de una sala
- `send-message`: Enviar mensaje de chat
- `start-video-call`: Iniciar videollamada
- `toggle-av`: Cambiar estado de micrófono/cámara
- `toggle-screen-share`: Iniciar/detener compartir pantalla

#### Eventos que Recibe el Cliente

- `room-joined`: Confirmación de unión a sala
- `new-message`: Nuevo mensaje en el chat
- `user-joined`, `user-left`: Usuarios entrando/saliendo
- `video-call-started`: Notificación de inicio de videollamada
- `av-state-changed`: Cambio de estado AV de un participante
- `screen-share-changed`: Cambio en compartir pantalla

### WebRTC (Videollamadas P2P)

El frontend usa WebRTC para videollamadas **peer-to-peer** (sin servidor de video):

```typescript
// src/hooks/useWebRTC.ts
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});
```

#### Flujo de Señalización (Signaling)

1. **Peer A** crea una oferta SDP: `await pc.createOffer()`
2. **Peer A** emite `offer` al servidor con el `targetSocketId` de Peer B
3. **Servidor** reenvía la oferta a **Peer B**
4. **Peer B** crea una respuesta SDP: `await pc.createAnswer()`
5. **Peer B** emite `answer` al servidor con el `targetSocketId` de Peer A
6. **Servidor** reenvía la respuesta a **Peer A**
7. Ambos peers intercambian candidatos ICE: `ice-candidate`
8. Conexión directa establecida, audio/video fluyen sin pasar por el servidor

---

## 🗺️ Rutas y Navegación

| Ruta | Componente | Descripción | Protegida |
|---|---|---|---|
| `/` | `LandingPage` | Página de inicio (marketing) | ❌ |
| `/login` | `LoginPage` | Inicio de sesión | ❌ |
| `/registro` | `RegistroPage` | Registro manual | ❌ |
| `/registro/google-username` | `RegistroGoogleUsernamePage` | Completar registro con Google | ❌ |
| `/dashboard` | `DashboardPage` | Dashboard principal | ✅ |
| `/perfil` | `PerfilPage` | Ver y editar perfil | ✅ |
| `/salas/crear` | `SalasCrearPage` | Crear nueva sala | ✅ |
| `/salas/:roomId` | `ChatPage` | Vista de sala (chat) | ✅ |
| `/salas/:roomId/configurar` | `SalasConfigurarPage` | Configurar sala (solo host) | ✅ |
| `/salas/:roomId/video` | `VideoCallPage` | Videollamada | ✅ |
| `/unirse` | `UnirsePage` | Unirse por código | ✅ |
| `*` | `NotFoundPage` | Página no encontrada | ❌ |

### Rutas Protegidas

Las rutas marcadas con ✅ usan el componente `<ProtectedRoute>` que:
1. Verifica si el usuario está autenticado
2. Si no, redirige a `/login`
3. Si sí, renderiza el componente solicitado

### Rutas Públicas (Solo No Autenticados)

Rutas como `/login` y `/registro` usan `<PublicOnlyRoute>` que:
1. Verifica si el usuario ya está autenticado
2. Si sí, redirige a `/dashboard`
3. Si no, renderiza la página de login/registro

---

## 📜 Scripts Disponibles

```bash
# Desarrollo (servidor con hot-reload)
npm run dev

# Build de producción (genera carpeta dist/)
npm run build

# Preview del build de producción localmente
npm run preview
```

---

## 🚢 Despliegue en Producción

### Opción Recomendada: Vercel

#### Despliegue Automático desde GitHub

1. **Crear cuenta en [Vercel](https://vercel.com/)**
2. **Importar proyecto de GitHub**:
   - Click en **New Project**
   - Selecciona el repositorio `frontend_miniproyecto2`
   - Vercel detectará automáticamente Vite
3. **Configurar variables de entorno**:
   - En **Environment Variables**, agrega todas las de `.env.local`
   - `VITE_API_BASE_URL`: URL del backend desplegado
   - Todas las variables `VITE_FIREBASE_*`
4. **Desplegar**: Click en **Deploy**
5. **Actualizaciones automáticas**: Cada push a `main` desplegará automáticamente

#### Configuración de `vercel.json`

El proyecto ya incluye `vercel.json` para configurar el SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Esto asegura que todas las rutas (ej: `/dashboard`, `/salas/123`) funcionen correctamente en producción.

### Alternativas de Despliegue

#### Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Redirects (crear archivo _redirects en public/)
/*    /index.html   200
```

#### Cloudflare Pages
- Conecta el repositorio
- Build command: `npm run build`
- Output directory: `dist`

---

## 🔒 Hardening y Buenas Prácticas de Seguridad

### 1. Manejo Seguro de Credenciales

#### ✅ HACER
- **Usar variables de entorno** para todas las configuraciones (`.env.local`)
- **Nunca subir** `.env.local` a Git (ya está en `.gitignore`)
- **Usar `.env.example`** como plantilla sin credenciales reales
- **Configurar variables en Vercel** para producción (no en el código)
- **Rotar credenciales** si se exponen accidentalmente

#### ❌ NUNCA HACER
- Hardcodear Firebase API keys en el código (siempre usar `import.meta.env.VITE_*`)
- Subir archivos `.env.local` al repositorio
- Compartir credenciales por medios inseguros
- Usar las mismas credenciales en múltiples entornos (dev/prod)

### 2. Validación de Entradas

El proyecto usa validadores personalizados en `src/utils/validators.ts`:

```typescript
// Ejemplo: validación de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

**Siempre valida**:
- Emails antes de enviar a Firebase Auth
- Nombres de usuario (longitud, caracteres permitidos)
- Contraseñas (mínimo 6 caracteres, Firebase lo requiere)
- IDs de salas antes de unirse

### 3. Autenticación y Autorización

#### Rutas Protegidas

```typescript
// src/components/common/ProtectedRoute.tsx
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};
```

**Nunca omitas** `<ProtectedRoute>` en páginas que requieren autenticación.

#### Tokens JWT

El frontend obtiene y envía tokens en cada petición:

```typescript
const token = await user.getIdToken();

// HTTP
fetch(`${API_BASE_URL}/api/endpoint`, {
  headers: { Authorization: `Bearer ${token}` }
});

// WebSocket
const socket = io(API_BASE_URL, {
  auth: { token }
});
```

**Nunca guardes** tokens en `localStorage` o cookies sin protección. Firebase Auth maneja esto automáticamente.

### 4. Seguridad en Producción

#### HTTPS Obligatorio

- Vercel provee HTTPS automáticamente
- **Nunca uses** `http://` en producción para `VITE_API_BASE_URL`
- Firebase Auth **requiere HTTPS** en producción

#### Content Security Policy (CSP)

Considera agregar un CSP en `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com; 
               style-src 'self' 'unsafe-inline'; 
               connect-src 'self' https://*.firebase.com https://*.firebaseapp.com wss://tu-backend.onrender.com;">
```

### 5. Privacidad y GDPR

- **No guardes datos sensibles** en Firestore sin encriptar
- **Implementa política de privacidad** (especialmente para autenticación con Google)
- **Permite a usuarios eliminar su cuenta** y todos sus datos
- **Usa HTTPS** para todas las comunicaciones

### 6. Rate Limiting en el Cliente

Para evitar spam de mensajes o peticiones:

```typescript
// Ejemplo: debounce en envío de mensajes
let lastMessageTime = 0;
const MIN_MESSAGE_INTERVAL = 500; // ms

const sendMessage = (message: string) => {
  const now = Date.now();
  if (now - lastMessageTime < MIN_MESSAGE_INTERVAL) {
    alert('Espera un momento antes de enviar otro mensaje');
    return;
  }
  
  lastMessageTime = now;
  socket.emit('send-message', { message });
};
```

### 7. XSS y Sanitización

React escapa automáticamente contenido, pero ten cuidado con:

- **`dangerouslySetInnerHTML`**: Nunca uses esto con contenido de usuarios
- **URLs dinámicas**: Valida URLs antes de abrir en `window.open()`
- **Iframes**: Solo embedea contenido de fuentes confiables

### 8. Manejo de Errores

- **No expongas detalles técnicos** al usuario en mensajes de error
- **Loguea errores** en un servicio como Sentry
- **Valida respuestas del backend** antes de usarlas

```typescript
try {
  const response = await fetch(`${API_BASE_URL}/api/rooms`);
  if (!response.ok) {
    throw new Error('Error al obtener salas');
  }
  const data = await response.json();
  // Validar estructura de data antes de usar
} catch (error) {
  console.error('Error:', error);
  // Mostrar mensaje genérico al usuario
  alert('Ocurrió un error. Por favor, intenta de nuevo.');
}
```

---

## ❌ Errores Comunes y Soluciones

### Error: "Vite: Cannot find module 'VITE_API_BASE_URL'"

**Causa**: No configuraste las variables de entorno correctamente.

**Solución**:
1. Verifica que existe `.env.local` (no `.env`) en la raíz del proyecto
2. Todas las variables deben empezar con `VITE_`
3. Reinicia el servidor de desarrollo con `npm run dev`

### Error: Firebase Auth - "API key not valid"

**Causa**: La `VITE_FIREBASE_API_KEY` es incorrecta o está mal copiada.

**Solución**:
1. Ve a Firebase Console → Configuración del proyecto → General → Tus apps
2. Copia el `apiKey` exacto (sin espacios ni comillas adicionales)
3. Pégalo en `.env.local`: `VITE_FIREBASE_API_KEY=AIzaSy...`
4. Reinicia el servidor

### Error: "WebSocket connection failed"

**Causa**: El backend no está corriendo o la URL en `VITE_API_BASE_URL` es incorrecta.

**Solución**:
1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. Abre `http://localhost:3000/health` en el navegador, debería responder `{"status":"Backend running"}`
3. Verifica `.env.local`: `VITE_API_BASE_URL=http://localhost:3000` (sin `/` al final)
4. Abre la consola del navegador (F12) y busca errores de Socket.IO

### Error: CORS bloqueando peticiones

**Causa**: El backend no tiene configurado tu origen en `ALLOWED_ORIGINS`.

**Solución**:
1. En el backend, abre `.env` y actualiza:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173
   ```
2. Reinicia el backend
3. Recarga el frontend

### Error: "auth/unauthorized-domain" en Firebase Auth

**Causa**: El dominio desde el que estás autenticando no está autorizado en Firebase.

**Solución**:
1. Ve a Firebase Console → Authentication → Settings → Authorized domains
2. Agrega tu dominio:
   - Desarrollo: `localhost`
   - Producción: `tu-app.vercel.app`

### Error: "Module not found" al importar componentes

**Causa**: Rutas de importación incorrectas o dependencias no instaladas.

**Solución**:
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar que todas las importaciones usan rutas relativas correctas
# ✅ import { Button } from '@/components/ui/Button'
# ✅ import { Button } from '../components/ui/Button'
```

### Error: Build falla en Vercel

**Causa**: Variables de entorno no configuradas o errores de TypeScript.

**Solución**:
1. **Verifica variables de entorno** en Vercel Dashboard → Settings → Environment Variables
2. **Compila localmente** para detectar errores: `npm run build`
3. **Revisa logs** en Vercel para identificar el error específico
4. Asegúrate de que `.env.example` esté actualizado y subido al repo

### Error: "Cannot read property 'getIdToken' of null"

**Causa**: Intentas obtener el token antes de que el usuario esté autenticado.

**Solución**:
```typescript
const { user, loading } = useAuth();

if (loading) return <div>Cargando...</div>;
if (!user) return <Navigate to="/login" />;

// Ahora puedes usar user.getIdToken() con seguridad
const token = await user.getIdToken();
```

### Error: Videollamada no conecta

**Causa**: Problemas con WebRTC, firewall o configuración de STUN/TURN.

**Solución**:
1. **Verifica permisos del navegador**: Cámara y micrófono deben estar autorizados
2. **Prueba en HTTPS**: WebRTC requiere HTTPS en producción
3. **Revisa consola**: Busca errores de `RTCPeerConnection` o `getUserMedia`
4. **Firewall**: Algunos firewalls bloquean WebRTC, prueba con otra red
5. **TURN server**: Para redes restrictivas, considera usar un servidor TURN (Twilio, xirsys)

---

## 📚 Recursos Adicionales

- **Firebase Auth**: [Documentación oficial](https://firebase.google.com/docs/auth/web/start)
- **Firestore**: [Guía de inicio](https://firebase.google.com/docs/firestore/quickstart)
- **Socket.IO Client**: [Documentación](https://socket.io/docs/v4/client-api/)
- **WebRTC**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- **React Router v7**: [Documentación oficial](https://reactrouter.com/)
- **Vite**: [Guía de configuración](https://vite.dev/guide/)
- **Tailwind CSS**: [Documentación](https://tailwindcss.com/docs)

---

## 🧪 Testing (Futuro)

### Pruebas Manuales Recomendadas

Antes de desplegar a producción, prueba:

1. **Autenticación**:
   - Registro con email/contraseña
   - Login con email/contraseña
   - Login con Google
   - Logout
   - Persistencia de sesión (recargar página)

2. **Salas**:
   - Crear sala pública/privada
   - Unirse a sala con código
   - Salir de sala
   - Configurar sala (solo host)

3. **Chat**:
   - Enviar mensajes
   - Recibir mensajes de otros usuarios
   - Historial de mensajes

4. **Videollamadas**:
   - Iniciar videollamada
   - Conectar con otro peer
   - Mutear/desmutear micrófono
   - Encender/apagar cámara
   - Compartir pantalla

5. **Accesibilidad**:
   - Navegación con teclado (Tab, Enter)
   - Lectores de pantalla (NVDA, JAWS)
   - Zoom del navegador (200%)

---

## 📞 Soporte

Si encuentras problemas no cubiertos en esta documentación:

1. **Consola del navegador** (F12): Revisa errores en Console y Network
2. **Firebase Console**: Revisa logs de Authentication y Firestore
3. **Backend logs**: Verifica que el backend esté respondiendo correctamente
4. **Documentación oficial**: Consulta la documentación de Firebase, Socket.IO y WebRTC

---

## 📄 Licencia

Proyecto académico — Proyecto Integrador I, 2026-I
