# Arquitectura — Parcelas Cachapoal (Pro Básica)

Documento técnico verificado contra el código del repositorio. Complementa `CLAUDE.md` y `AGENTS.md`.

---

## 1. Visión general

Aplicación **Multi-Page (MPA)** con Vite que expone:

- **Landing pública** (`/`): marketing + catálogo + formularios.
- **Panel admin** (`/admin.html`): autenticado, gestión de inventario, leads y configuración.

Backend BaaS: **Firebase** (Firestore + Auth). Medios de propiedades: **Cloudinary**.

---

## 2. Flujo de datos (ASCII)

```
                    ┌──────────────────────────────────────┐
                    │           Firebase Project           │
                    │                                      │
  ┌─────────────────┤  Auth ───────────────────────────┐  │
  │ signIn / onAuth │                                  │  │
  │                 │                                  ▼  │
  │            ┌────┴────┐     login OK / logout    ┌──────┴──────┐
  │            │  Auth   │◄────────────────────────│ admin.html  │
  │            └────┬────┘                         │ (Vanilla JS)│
  │                 │                              └──────┬──────┘
  │                 │                                     │
  │                 │              write / read           │
  │                 │         ┌───────────────────────────┤
  │                 │         │                           │
  │                 ▼         ▼                           │
  │            ┌─────────────────┐                        │
  │            │   Firestore     │                        │
  │            │                 │                        │
  │            │  properties  ◄──┼── CRUD (admin)         │
  │            │  messages    ◄──┼── form contacto (landing)
  │            │  visitas     ◄──┼── ScheduleModal (landing)
  │            │  settings/   ◄──┼── contact.js + settings.js
  │            │    contactInfo  │                        │
  │            │    footerLinks  │                        │
  │            └────────┬────────┘                        │
  │                     │ read (getDocs / getDoc)         │
  │                     ▼                                 │
  │            ┌─────────────────┐                        │
  │            │  index.html     │                        │
  │            │  React landing  │                        │
  │            └─────────────────┘                        │
  │                                                       │
  │   Upload Widget (solo admin, al crear/editar prop)    │
  │            ┌─────────────────┐                        │
  └────────────│   Cloudinary    │── secure_url ──────────┘
               │  (imágenes)     │   → campo images[]
               └─────────────────┘
```

### Sentido de las escrituras

| Origen | Destino | Operación |
|---|---|---|
| `src/admin/properties.js` | `properties` | add / update / delete |
| `src/admin/contact.js` | `settings/contactInfo` | setDoc merge |
| `src/admin/settings.js` | `settings/footerLinks` | setDoc merge |
| `src/admin/messages.js` | `messages` o `visitas` | update status / delete |
| `src/App.jsx` (form contacto) | `messages` | addDoc |
| `ScheduleModal.jsx` | `visitas` | addDoc |
| Cloudinary widget | CDN Cloudinary | upload → URL en `images[]` |

### Lecturas en la landing

| Origen | Qué lee |
|---|---|
| `useProperties.js` | Toda la colección `properties` (filtra `hidden`) |
| `App.jsx` | `settings/footerLinks`, `settings/contactInfo` |

**Importante:** no hay listeners `onSnapshot`. Los datos se cargan al montar o al invocar `loadProperties` / `loadMessages` en el admin. No es sincronización push en vivo.

---

## 3. Build multi-page de Vite

Configuración en `vite.config.js`:

```js
plugins: [react(), tailwindcss()],
server: { port: 3000 },
build: {
  rollupOptions: {
    input: {
      main: './index.html',
      admin: './admin.html'
    }
  }
}
```

### Consecuencias

1. Dos grafos de dependencias independientes en el bundle de producción (`dist/index.html` y `dist/admin.html`).
2. Firebase se puede code-split / compartir entre chunks según el grafo de imports (ambos importan `src/firebase.js`).
3. Tailwind en la landing entra por el plugin `@tailwindcss/vite` y `src/index.css`.
4. Tailwind en el admin **no** pasa por el plugin: se carga en runtime desde CDN en `admin.html`.
5. El Cloudinary widget es un script global en `admin.html` (`window.cloudinary`), no un paquete npm.

### Entry público

```
index.html
  └── <script type="module" src="/src/main.jsx">
        └── App.jsx + components + hooks + utils + firebase
```

### Entry admin

```
admin.html
  ├── CDN: tailwind, cloudinary widget
  ├── css/admin.css
  ├── scripts inline: openProModal, openAiModal, …
  └── <script type="module" src="/src/admin/main.js">
        └── auth, properties, messages, contact, settings, utils + firebase
```

---

## 4. Modelo de datos Firestore

### 4.1 Colección `properties`

Escritura: `src/admin/properties.js`. Lectura: `useProperties.js` + listados admin.

| Campo | Tipo (uso) | Notas |
|---|---|---|
| `title` | string | Título de publicación |
| `price` | number | Precio numérico |
| `currency` | `"CLP"` \| `"UF"` | Select del formulario |
| `status` | string | `available` \| `reserved` \| `sold` \| `hidden` |
| `category` | string | `Parcelas` \| `Casas` \| `Campos` |
| `type` | string | Subtítulo libre (ej. Venta) |
| `location` | string | Ubicación mostrada en cards |
| `mapUrl` | string | URL de mapa / embed |
| `videoUrl` | string | URL o iframe YouTube (normalizada con `extractVideoUrl`) |
| `commercialPlanUrl` | string | Plano comercial |
| `description` | string | Descripción larga |
| `brief` | string | Resumen corto en card |
| `area` | number | m² |
| `bedrooms` | number | Relevante si `category === "Casas"` |
| `bathrooms` | number | Idem |
| `water` | boolean | Agua |
| `electricity` | boolean | Luz |
| `rol` | boolean | Rol propio |
| `sag` | boolean | SAG / factibilidad |
| `access` | boolean | Acceso |
| `fence` | boolean | Cierre perimetral |
| `featured` | boolean | Destacada en landing |
| `images` | string[] | `[0]` = principal; resto = galería (URLs Cloudinary u otras) |
| `customFeature` | `{ name, icon }` \| `null` | Extra opcional; `icon` = clave kebab del admin |
| `createdAt` | Timestamp | Solo al crear |
| `updatedAt` | Timestamp | En cada guardado |

**Filtro landing** (`useProperties.js`): se excluyen documentos con `status === 'hidden'`. Se aceptan `available`, `reserved`, `sold` o status vacío. Las `featured` se separan en `featuredProperties`; el catálogo regular usa las no destacadas.

---

### 4.2 Colección `messages`

Escritura: formulario de contacto en `src/App.jsx`.

| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | |
| `phone` | string | |
| `email` | string | |
| `message` | string | |
| `createdAt` | Timestamp | `serverTimestamp()` |
| `status` | string | Al crear: `'unread'`. Admin puede: `unread`, `pending`, `contacted`, `spam` |

El admin lista esta colección como **“Contacto General”** (tipo interno `contacto` solo en UI).

---

### 4.3 Colección `visitas`

Escritura: `src/components/ScheduleModal.jsx`.

| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | |
| `phone` | string | |
| `email` | string | |
| `message` | string | Opcional en el form |
| `propertyId` | string \| null | Id de propiedad o null (consulta general) |
| `propertyOfInterest` | string | Título o “Consulta General” |
| `propertyTitle` | string | Mismo título (duplicado intencional en código) |
| `createdAt` | Timestamp | |
| `status` | string | Al crear: `'new'`. Admin gestiona con los mismos valores de workflow que messages |

El admin lista esta colección como **“Posibles Visitas”**.

> **Nota:** el README histórico unificaba leads en `messages` con un campo `read`. En el código actual hay **dos colecciones** de leads y el flag es `status`, no `read`.

---

### 4.4 Colección `settings` (documentos fijos)

No hay colección `contacto`. La configuración pública vive en `settings`:

#### Documento `settings/contactInfo`

Escrito por `src/admin/contact.js`. Leído por landing (`App.jsx`) y por `messages.js` (WhatsApp fallback).

| Campo | Tipo | Default en código |
|---|---|---|
| `phone` | string | `+569 9817 9975` |
| `email` | string | `contacto@parcelascachapoal.cl` |
| `address` | string | `Llallauquen, Las Cabras` |
| `schedule` | string | `Lunes a Domingo 10am – 17pm` |
| `whatsappNumber` | string | dígitos, ej. `56998179975` |
| `updatedAt` | Timestamp | al guardar |

#### Documento `settings/footerLinks`

Escrito por `src/admin/settings.js`. Leído por `App.jsx` para el footer.

| Campo | Tipo | Notas |
|---|---|---|
| `socialLinks` | object | `{ facebook, instagram, youtube, whatsapp }` URLs |
| `whatsappNumber` | string | dígitos; se deriva `https://wa.me/...` |
| `updatedAt` | Timestamp | al guardar |

Fallbacks locales si no existe el documento: `CONSTANTS.SITE_INFO` y `CONSTANTS.SOCIAL_LINKS` en `src/utils/constants.js`.

---

## 5. Flujo de autenticación del panel admin

```
Usuario abre /admin.html
        │
        ▼
  #login-overlay visible
  #admin-panel hidden
        │
        ▼
  DOMContentLoaded → main.js
        │
        ├── initAuth(onSuccess, loadMessages)
        ├── initProperties()   // form + Cloudinary (no requiere sesión para registrar listeners)
        └── renderIcons()
        │
        ▼
  onAuthStateChanged(auth, user => …)
        │
   ┌────┴────┐
   │ user?   │
   └────┬────┘
    sí  │  no
        │   └── muestra login, oculta panel
        ▼
  Oculta #login-overlay
  Muestra #admin-panel
  Rellena #user-email-display
  loadProperties() + loadMessages()
        │
        ▼
  (callback post-login en main)
  initSocialSettings()
  initContactSettings()
  switchTab('dashboard')
```

### Login manual

1. Submit de `#login-form`.
2. `signInWithEmailAndPassword(auth, email, password)`.
3. Errores mapeados a español en `#login-error-msg`.
4. El estado de sesión lo resuelve de nuevo `onAuthStateChanged` (no hay navegación SPA).

### Logout

`logout()` → `signOut(auth)` → `window.location.reload()`.

### Protección

- La UI del panel solo se muestra con usuario autenticado.
- **La seguridad real** depende de las reglas de Firestore/Auth en la consola Firebase. El front no puede impedir por sí solo escrituras maliciosas si las reglas son abiertas.
- No hay roles custom en el código: cualquier usuario Auth válido que inicie sesión ve el panel completo.

### Usuarios

Se crean en Firebase Console → Authentication → email/password. No hay registro público en la app.

---

## 6. Relación landing ↔ admin (módulos)

| Concern | Landing | Admin |
|---|---|---|
| Propiedades | `useProperties` + `Catalog` + `PropertyModal` | `properties.js` |
| Contacto leads | `App.jsx` → `messages` | `messages.js` (tab contacto) |
| Visitas | `ScheduleModal` → `visitas` | `messages.js` (tab visitas) |
| Info contacto | lee `settings/contactInfo` | `contact.js` |
| Redes footer | lee `settings/footerLinks` | `settings.js` (form en dashboard) |
| Auth | no usa Auth | `auth.js` |
| Imágenes | solo consume URLs | Cloudinary widget |

---

## 7. Stack y versiones (package.json)

| Pieza | Paquete / nota |
|---|---|
| React | `react` / `react-dom` ^19 |
| Vite | `vite` ^8 |
| Tailwind | `tailwindcss` ^4 + `@tailwindcss/vite` |
| Firebase | `firebase` ^12 |
| React plugin | `@vitejs/plugin-react` ^6 |

---

## 8. Decisiones de diseño relevantes

1. **MPA sobre SPA:** admin y landing desacoplados; se puede desplegar o cachear distinto.
2. **Admin sin React:** HTML grande + módulos ES; acoplamiento fuerte a IDs del DOM.
3. **Config en fuente, no `.env`:** un deploy = un set de credenciales en archivos.
4. **Pro Básica:** Hero/Nosotros no editables por CMS; secciones PRO son mockups comerciales.
5. **Fetch puntual:** simplicidad sobre realtime; suficiente para catálogo de baja frecuencia de cambios.
