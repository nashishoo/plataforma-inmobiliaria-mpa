# CLAUDE.md — Guía operativa (Parcelas Cachapoal)

Guía para agentes de codificación (Claude Code y similares). Todo lo aquí documentado está verificado contra el código actual. **No inventes APIs, colecciones ni campos** que no existan en el repositorio.

**Versión del producto:** Pro Básica. El diseño visual actual debe preservarse; cambios estéticos mayores van en ramas aparte.

---

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite en **puerto 3000** |
| `npm run build` | Build multi-page → `dist/` (`index.html` + `admin.html`) |
| `npm run preview` | Preview local del build de producción |

- **No hay tests** configurados (`npm test` solo imprime error y sale 1).
- **No hay linter** (ESLint/Prettier) en `package.json`.
- Rutas locales: `http://localhost:3000/` (landing) y `http://localhost:3000/admin.html` (admin).

---

## Arquitectura (resumen)

MPA de **Vite 8** con **dos entry points independientes**:

| Entry | Stack | Estilos |
|---|---|---|
| `index.html` → `src/main.jsx` → `src/App.jsx` | **React 19** + JSX | Tailwind **v4** vía `@tailwindcss/vite` + `src/index.css` (`@import "tailwindcss"`) |
| `admin.html` → `src/admin/main.js` | **Vanilla JS ES Modules** | Tailwind por **CDN** (`cdn.tailwindcss.com`) + `css/admin.css` |

Ambos comparten **Firebase** (`src/firebase.js`: Firestore + Auth). Imágenes de propiedades: **Cloudinary Upload Widget** (script en `admin.html`, lógica en `src/admin/properties.js`).

Build multi-page en `vite.config.js`:

```js
build.rollupOptions.input = { main: './index.html', admin: './admin.html' }
server.port = 3000
```

---

## Mapa de archivos clave

### Raíz / config
| Archivo | Responsabilidad |
|---|---|
| `index.html` | Entry público: SEO meta, Open Graph, Twitter, geo, JSON-LD, `#root`, loader, noscript |
| `admin.html` | Entry admin: login overlay, sidebar, vistas, modal propiedad, modales PRO, Cloudinary CDN |
| `vite.config.js` | React plugin, Tailwind v4 plugin, MPA, puerto 3000 |
| `src/firebase.js` | `initializeApp`, exporta `db` y `auth` (credenciales hardcodeadas) |
| `src/main.jsx` | Bootstrap React + quita `#initial-loader` |
| `src/App.jsx` | Layout landing: nav, hero, búsqueda, destacados, nosotros, catálogo, contacto, footer, modales |
| `src/index.css` | Tailwind v4, tipografías, animaciones (hero zoom, reveal, etc.) |

### `src/components/` (landing React)
| Módulo | Responsabilidad |
|---|---|
| `Hero.jsx` | Hero fullscreen, h1 SEO, zoom CSS |
| `Catalog.jsx` | Grid de tarjetas de propiedades |
| `CardFeatures.jsx` | Badges de características (área, servicios, customFeature) |
| `PropertyModal.jsx` | Ficha detallada + Lightbox + CTA agendar |
| `ScheduleModal.jsx` | Formulario visita → colección `visitas` |
| `Lightbox.jsx` | Galería fullscreen con teclado |
| `Icon.jsx` | Mapa de íconos SVG inline por **nombre PascalCase** (`Leaf`, `MapPin`, …) |

### `src/hooks/`
| Módulo | Responsabilidad |
|---|---|
| `useProperties.js` | `getDocs(properties)`; filtra ocultas; separa featured vs regulares |

### `src/utils/`
| Módulo | Responsabilidad |
|---|---|
| `constants.js` | Imágenes fallback, `SITE_INFO`, `SOCIAL_LINKS`, `CLOUDINARY_CONFIG` |
| `formatters.js` | `formatPrice` (CLP/UF), `formatM2` (m² / Has) |

### `src/admin/` (panel Vanilla)
| Módulo | Responsabilidad |
|---|---|
| `main.js` | `switchTab`, `toggleSidebar`, init de auth/props/settings/contacto; expone globals en `window` |
| `auth.js` | Login/logout Firebase Auth; muestra/oculta `#login-overlay` / `#admin-panel` |
| `properties.js` | CRUD `properties` + Cloudinary + tabs destacadas/visibles/ocultas |
| `messages.js` | Lee `visitas` + `messages`; estados y badges |
| `contact.js` | Lee/escribe `settings/contactInfo` |
| `settings.js` | Lee/escribe `settings/footerLinks` (redes del footer) |
| `utils.js` | `SVGS` + `renderIcons()` para `<i data-icon="...">` |

---

## Colecciones Firestore (reales)

| Colección / doc | Uso |
|---|---|
| `properties` | Catálogo (admin escribe, landing lee) |
| `messages` | Formulario de contacto de la landing |
| `visitas` | Agendamientos (`ScheduleModal`) |
| `settings/contactInfo` | Teléfono, email, dirección, horario, WhatsApp |
| `settings/footerLinks` | Links sociales del footer |

**No existe** una colección llamada `contacto`. El módulo admin `contact.js` y la vista `#view-contacto` usan el documento `settings/contactInfo`.

Campos detallados: ver `docs/ARQUITECTURA.md`.

---

## Convenciones y gotchas

### Credenciales sin `.env` (deliberado)
- Firebase: hardcodeado en `src/firebase.js`.
- Cloudinary: en `src/utils/constants.js` **y duplicado** en `setupCloudinary()` de `src/admin/properties.js` (`cloudName` / `uploadPreset`). Si cambias Cloudinary, actualiza **ambos**.
- No hay variables de entorno ni archivos `.env`.

### Lectura de datos (no es listener en tiempo real)
- Landing y admin usan `getDocs` / `getDoc` (fetch al cargar o al cambiar de tab). **No** hay `onSnapshot`. Tras editar en admin, la landing refleja cambios al recargar.

### Visibilidad de propiedades en la landing
`useProperties` solo muestra propiedades con `status` vacío o en `available` | `reserved` | `sold`. El estado `hidden` no se publica.

### Idioma
UI y textos de usuario en **español (es-CL)**. Formatos de precio con `Intl` `es-CL`.

### Íconos SVG — dos sistemas distintos
1. **Landing (React):** `Icon` con prop `name` en PascalCase (`<Icon name="Leaf" />`). Mapa en `src/components/Icon.jsx`.
2. **Admin:** `<i data-icon="leaf">` (kebab-case). `renderIcons()` en `src/admin/utils.js` rellena el SVG. Tras inyectar HTML dinámico hay que volver a llamar `renderIcons()` (está en `window.renderIcons`).

`customFeature.icon` se guarda con clave del admin (kebab) y `CardFeatures` la convierte a PascalCase para el componente React.

### Acoplamiento admin.html ↔ JS (IDs de DOM)
Los módulos asumen IDs fijos. Si se renombran en HTML, el JS se rompe. Principales:

- Auth: `#login-overlay`, `#admin-panel`, `#login-form`, `#email-input`, `#password-input`, `#login-error`, `#user-email-display`
- Tabs: `#view-dashboard|properties|messages|contacto|landing`, `#nav-*`
- Props: `#properties-table-body`, `#properties-mobile-list`, `#property-modal`, `#property-form`, `#p-title`, …, `#upload-main-btn`, `#upload-gallery-btn`, `#gallery-container`
- Mensajes: `#messages-list-visitas`, `#messages-list-contacto`, `#badge-visitas`, `#badge-contacto`, `#stat-messages`
- Contacto: `#contact-form`, `#contact-phone`, `#contact-email`, `#contact-address`, `#contact-schedule`, `#contact-whatsapp`
- Redes (dashboard): `#social-links-form`, `#social-facebook|instagram|youtube|whatsapp`

Funciones expuestas en `window` para `onclick` del HTML: `switchTab`, `logout`, `toggleSidebar`, `openPropertyModal`, `closePropertyModal`, `loadMessages`, `updatePropertyStatus`, `editProperty`, `deleteProperty`, `switchPropertyTab`, `switchMessageTab`, `updateMessageStatus`, `deleteMessage`, `removeMainImage`, `removeGalleryImage`, etc. En `admin.html` también hay `openProModal` / `openAiModal` **inline** (upsell PRO).

### Gotcha de badge de mensajes
El sidebar define `#nav-badge-messages`, pero `messages.js` actualiza `#msg-badge` (ID que no existe en el HTML actual). Los badges por tab (`#badge-visitas` / `#badge-contacto`) sí funcionan.

### Status de mensajes inconsistente al crear
- Contacto (`App.jsx`) crea con `status: 'unread'`.
- Visitas (`ScheduleModal`) crea con `status: 'new'`.
- El admin trata como “nuevo” principalmente `unread` (y ausencia de status).

### Preview de propiedad
Admin abre `index.html?preview=<id>`; `App.jsx` abre el modal si encuentra el id en `allProperties`.

### Estilos duales
No unificar Tailwind: landing = plugin Vite; admin = CDN. Cambios de design tokens no se comparten automáticamente.

### Secciones PRO (solo UI)
Landing editable y Asistente IA en admin son **mockups/upsell** (modales en `admin.html`). No hay backend Gemini ni edición CMS de Hero/Nosotros en esta versión.

---

## Regla estética (Pro Básica)

Esta entrega es la versión **Pro Básica**.

- **Preservar** layout, tipografía (Playfair + Lato en landing; Inter en admin), paleta verde/stone y componentes existentes.
- No rediseñar la landing ni el admin “porque sí”.
- Refactors visuales mayores o features de marca/PRO → **rama aparte**, no en el tronco de esta versión.

---

## Alcance seguro de cambios

| Hacer | Evitar sin pedido explícito |
|---|---|
| Bugs, CRUD, validaciones, textos ES | Introducir `.env` / reescribir config |
| Documentación | Tests/linters no pedidos |
| Campos alineados al modelo real | Nuevas colecciones sin actualizar landing + admin |
| | Cambiar IDs de DOM del admin sin actualizar módulos |

Documentación extendida de arquitectura y modelo de datos: `docs/ARQUITECTURA.md`. Estándar multi-agente: `AGENTS.md`.
