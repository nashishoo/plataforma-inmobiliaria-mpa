# AGENTS.md — Guía para agentes de IA

> **Guía extendida:** ver [`CLAUDE.md`](./CLAUDE.md) (comandos, mapa de módulos, gotchas verificados).  
> **Arquitectura y modelo de datos:** [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md).

Plataforma inmobiliaria **Parcelas Cachapoal** — versión **Pro Básica**. Trabaja solo con hechos del código; no inventes colecciones, campos ni APIs.

---

## Comandos

```bash
npm run dev       # Vite, puerto 3000
npm run build     # → dist/ (index + admin)
npm run preview   # preview del build
```

No hay tests ni linter configurados.

| Ruta | Descripción |
|---|---|
| `/` | Landing pública |
| `/admin.html` | Panel admin (login Firebase) |

---

## Arquitectura

MPA Vite con **dos entry points**:

1. **`index.html`** — React 19 + Tailwind v4 (plugin Vite) → `src/main.jsx` → `src/App.jsx`
2. **`admin.html`** — Vanilla JS ES Modules + Tailwind CDN → `src/admin/main.js`

Comparten Firebase (`src/firebase.js`: Firestore + Auth). Imágenes de propiedades vía Cloudinary Upload Widget (solo admin).

```
Admin (write) ──► Firestore ◄── Landing (read al cargar)
     │                ▲
     ▼                │
 Cloudinary      Firebase Auth
 (imágenes)        (login admin)
```

---

## Mapa rápido

| Ruta | Rol |
|---|---|
| `src/App.jsx` | Landing: layout, contacto, búsqueda, settings |
| `src/components/*` | Hero, Catalog, modales, Lightbox, Icon |
| `src/hooks/useProperties.js` | Fetch + filtro de `properties` |
| `src/utils/constants.js` | Fallbacks + Cloudinary (landing) |
| `src/utils/formatters.js` | Precio CLP/UF, m² |
| `src/firebase.js` | `db`, `auth` |
| `src/admin/auth.js` | Login/logout |
| `src/admin/properties.js` | CRUD propiedades + Cloudinary |
| `src/admin/messages.js` | Bandeja `visitas` + `messages` |
| `src/admin/contact.js` | `settings/contactInfo` |
| `src/admin/settings.js` | `settings/footerLinks` |
| `src/admin/main.js` | Tabs, init, globals |
| `src/admin/utils.js` | Íconos `data-icon` |

---

## Firestore (real)

| Recurso | Uso |
|---|---|
| `properties` | Catálogo |
| `messages` | Contacto web |
| `visitas` | Agendar visita |
| `settings/contactInfo` | Datos de contacto públicos |
| `settings/footerLinks` | Redes del footer |

**No hay** colección `contacto`. Detalle de campos en `docs/ARQUITECTURA.md`.

---

## Convenciones críticas

1. **Sin `.env`:** credenciales en `src/firebase.js` y Cloudinary en `constants.js` + hardcode en `properties.js` (mantener ambos al cambiar).
2. **Fetch, no realtime:** `getDocs`/`getDoc`; la landing no se actualiza sola tras editar en admin.
3. **Idioma UI:** español.
4. **Íconos:** React = `Icon` PascalCase; admin = `<i data-icon="kebab">` + `renderIcons()`.
5. **DOM admin acoplado:** IDs y `window.*` usados desde `admin.html` onclick; no renombrar a ciegas.
6. **Status `hidden`:** no se muestra en la landing.
7. **PRO mockups** (Landing editable, Asistente IA): solo UI de upsell en esta versión.

---

## Regla estética (Pro Básica)

El diseño actual es la versión **Pro Básica** y **debe preservarse**. Cambios visuales mayores o rediseños → ramas aparte. Preferir correcciones funcionales y documentación sobre reescritura estética.

---

## Qué no hacer sin instrucción explícita

- Introducir framework en el admin o SPA-ificar el MPA
- Añadir `.env` / cambiar el modelo de config
- Renombrar IDs del admin sin actualizar módulos
- Inventar colecciones o campos de Firestore
- Rediseñar UI “de paso”
