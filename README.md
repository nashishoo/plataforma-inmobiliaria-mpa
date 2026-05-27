# 🏞️ Parcelas Cachapoal — Plataforma Inmobiliaria Autogestionable

Plataforma web inmobiliaria completa y autogestionable para la venta y promoción de propiedades, parcelas y terrenos en la **VI Región del Libertador Bernardo O'Higgins, Chile**, con especial énfasis en las localidades cercanas al **Lago Rapel** y el Valle del Cachapoal.

El sistema combina una **landing page pública** de alto impacto visual con un **panel de administración privado**, conectados ambos a una base de datos en tiempo real. El administrador puede gestionar su catálogo de propiedades, recibir y responder leads de contacto, y configurar la información del sitio sin necesidad de tocar código.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Frontend Público** | React + JSX | 19.x |
| **Panel Admin** | Vanilla JavaScript | ES Modules |
| **Estilos** | Tailwind CSS | v4 (plugin Vite) |
| **Base de Datos** | Firebase Firestore | SDK 12.x |
| **Autenticación** | Firebase Auth | SDK 12.x |
| **Hosting de Imágenes** | Cloudinary (Upload Widget) | CDN |
| **Bundler / Dev Server** | Vite | v8.x |

---

## ⚙️ Cómo Funciona

El proyecto está construido como una aplicación **Multi-Page (MPA)** gestionada por Vite. Existen dos puntos de entrada HTML independientes que se compilan como bundles separados:

| Punto de Entrada | Ruta | Stack | Descripción |
|---|---|---|---|
| `index.html` | `/` | React + Tailwind | Landing page pública que los visitantes ven |
| `admin.html` | `/admin.html` | Vanilla JS + Tailwind (CDN) | Panel de administración protegido con login |

Ambos comparten la misma instancia de **Firebase** (Firestore + Auth), lo que permite que los cambios realizados en el admin se reflejen en tiempo real en la landing pública.

### Flujo de Datos

```
┌─────────────────┐       ┌──────────────┐       ┌─────────────────┐
│  Admin Panel    │──────▶│  Firestore   │◀──────│  Landing Page   │
│  (admin.html)   │ write │  (Cloud DB)  │  read │  (index.html)   │
└─────────────────┘       └──────────────┘       └─────────────────┘
        │                        ▲
        │                        │
        ▼                        │
┌─────────────────┐       ┌──────────────┐
│  Cloudinary     │       │ Firebase Auth│
│  (Imágenes)     │       │  (Login)     │
└─────────────────┘       └──────────────┘
```

---

## 🎨 Landing Page Pública

Sitio de cara al cliente construido en **React 19**, con foco en velocidad, estética premium y SEO.

### Características
- **Hero inmersivo** con efecto de zoom progresivo y navegación con scroll suave entre secciones.
- **Catálogo dinámico** de propiedades con filtros por nombre, ubicación y precio, cargado en tiempo real desde Firestore.
- **Galería Lightbox** para visualización de imágenes en alta resolución.
- **Fichas detalladas** por propiedad con modal expandido (especificaciones, precio, galería, mapa, estado).
- **Agendamiento de visitas** mediante modal dedicado con envío directo a la base de datos.
- **Formulario de contacto** conectado a Firestore para la recepción de leads.
- **Animaciones y transiciones** suaves: scroll-reveal, fade-in escalonado y micro-interacciones en hover.

### SEO Implementado
- Meta tags completas: Open Graph, Twitter Cards, geolocalización, canonical URL.
- Datos estructurados JSON-LD (schema.org) para `RealEstateAgent` y `WebSite`.
- Jerarquía semántica estricta: un único `<h1>`, secuencia `<h2>`/`<h3>`, elemento `<main>`, atributos ARIA.
- Bloque `<noscript>` con contenido estático pre-renderizado para crawlers que no ejecutan JS.
- Labels `id`/`htmlFor` en todos los campos de formulario para accesibilidad.

---

## 🔐 Panel de Administración

Interfaz privada en **Vanilla JS** puro (sin frameworks), protegida con Firebase Auth. Accesible desde `/admin.html`.

### Módulos del Panel

| Sección | Archivo Controlador | Funcionalidad |
|---|---|---|
| **Dashboard** | `src/admin/main.js` | Estadísticas en tiempo real: total de propiedades, mensajes recibidos, destacadas activas |
| **Propiedades** | `src/admin/properties.js` | ABM completo: crear, editar, eliminar parcelas. Subida de imágenes a Cloudinary. Control de estado (Disponible / Reservada / Vendida) y destacado |
| **Mensajes** | `src/admin/messages.js` | Bandeja de leads y solicitudes de agendamiento recibidas desde la landing |
| **Contacto** | `src/admin/contact.js` | Edición de la información pública del negocio (teléfono, email, dirección, horarios, redes sociales) |
| **Landing** | Inline en `admin.html` | Preview visual de secciones Hero y Nosotros. Mockups PRO con modal de upgrade |
| **Asistente IA** | Inline en `admin.html` | Placeholder PRO para futuro agente conversacional con Gemini API |

### Funcionalidades Clave
- **Login seguro** con Firebase Auth (email + contraseña).
- **Subida de imágenes** directa a Cloudinary con widget nativo (compresión y optimización automática).
- **Sidebar responsivo** con navegación por tabs, badge de mensajes no leídos y perfil de usuario.
- **Secciones PRO** con modal de upsell (Landing editable, Asistente IA).

---

## 📂 Estructura del Proyecto

```
├── index.html              # Entry point público (SEO, meta tags, JSON-LD, noscript)
├── admin.html              # Entry point admin (login, sidebar, vistas, modales PRO)
├── vite.config.js          # Config Vite: multi-page build, React plugin, Tailwind v4
├── tailwind.config.js      # Config Tailwind (extensiones opcionales)
├── package.json            # Dependencias y scripts npm
│
├── src/
│   ├── main.jsx            # Bootstrap de React (entry point de index.html)
│   ├── App.jsx             # Componente raíz: layout, secciones, contacto, navegación
│   ├── firebase.js         # Inicialización de Firebase (Firestore + Auth)
│   ├── index.css           # Directivas globales de Tailwind CSS v4
│   │
│   ├── components/         # Componentes React de la landing
│   │   ├── Hero.jsx        # Sección hero con efecto zoom y h1 SEO
│   │   ├── Catalog.jsx     # Grid de propiedades con filtros
│   │   ├── CardFeatures.jsx # Tarjetas de características destacadas
│   │   ├── PropertyModal.jsx # Modal detallado de propiedad + agendamiento
│   │   ├── ScheduleModal.jsx # Modal de agendar visita
│   │   ├── Lightbox.jsx    # Visor de galería de imágenes
│   │   └── Icon.jsx        # Librería de íconos SVG inline
│   │
│   ├── hooks/
│   │   └── useProperties.js # Custom hook: fetch y filtrado de propiedades desde Firestore
│   │
│   ├── utils/
│   │   ├── constants.js    # Constantes: imágenes, info de contacto, config Cloudinary
│   │   └── formatters.js   # Helpers de formato (precio CLP, etc.)
│   │
│   └── admin/              # Módulos controladores del panel admin (Vanilla JS)
│       ├── auth.js         # Login/logout con Firebase Auth
│       ├── main.js         # Inicialización, switchTab, dashboard stats
│       ├── properties.js   # CRUD de propiedades + integración Cloudinary
│       ├── messages.js     # Listado y gestión de leads/mensajes
│       ├── contact.js      # Lectura/escritura de config de contacto en Firestore
│       ├── settings.js     # Configuraciones adicionales del sitio
│       └── utils.js        # Renderizado de íconos SVG y helpers compartidos
│
├── css/                    # Estilos adicionales
│   ├── admin.css           # Animaciones y estilos del panel admin
│   ├── index.css           # Estilos complementarios
│   └── style.css           # Estilos base
│
└── dist/                   # Output de producción (autogenerado por `vite build`)
```

---

## 🚀 Instalación y Desarrollo Local

### Requisitos Previos
- **Node.js** v18+ y **npm**
- Un proyecto en [Firebase Console](https://console.firebase.google.com/) con Firestore y Authentication habilitados
- Una cuenta en [Cloudinary](https://cloudinary.com/) (plan gratuito suficiente)

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd <nombre-del-directorio>
npm install
```

### 2. Configurar servicios externos

#### Firebase
Editar `src/firebase.js` con las credenciales de tu proyecto Firebase:

```javascript
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};
```

#### Cloudinary
Editar `src/utils/constants.js` con tu Cloud Name y Upload Preset:

```javascript
CLOUDINARY_CONFIG: {
    cloudName: "tu-cloud-name",
    uploadPreset: "tu-upload-preset"
}
```

> **Nota:** Cada deploy (local, staging, producción) utiliza sus propias credenciales de Firebase y Cloudinary. La configuración es independiente por entorno — no se comparten secrets entre deploys ni se utilizan archivos `.env`.

### 3. Colecciones de Firestore requeridas

El sistema espera las siguientes colecciones en tu base de datos Firestore:

| Colección | Uso | Campos principales |
|---|---|---|
| `properties` | Catálogo de propiedades | `title`, `description`, `price`, `size`, `location`, `images[]`, `featured`, `status`, `createdAt` |
| `messages` | Leads de contacto y agendamientos | `name`, `phone`, `email`, `message`, `propertyId`, `createdAt`, `read` |
| `contacto` | Configuración pública del negocio | `phone`, `email`, `address`, `schedule`, `socialLinks{}` |

### 4. Crear un usuario administrador

Desde la consola de Firebase → Authentication → Users, crea un usuario con email y contraseña. Ese usuario podrá iniciar sesión en `/admin.html`.

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

| Ruta | Descripción |
|---|---|
| `http://localhost:3000` | Landing page pública |
| `http://localhost:3000/admin.html` | Panel de administración |

### 6. Compilar para producción

```bash
npm run build     # Genera bundle optimizado en /dist
npm run preview   # Preview local del build de producción
```

---

## 📦 Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR (puerto 3000) |
| `npm run build` | Build de producción optimizado en `/dist` |
| `npm run preview` | Preview local del bundle de producción |

---

## 🔒 Seguridad

- **Firebase Auth** protege el acceso al panel de administración. Sin credenciales válidas no se puede acceder.
- **Reglas de Firestore**: Se recomienda configurar reglas de seguridad para que solo usuarios autenticados puedan escribir en las colecciones `properties` y `contacto`, y que `messages` permita escritura pública (para los formularios) pero lectura solo autenticada.
- **Cloudinary Upload Preset**: Debe configurarse como *unsigned* para permitir la subida desde el widget del navegador, pero limitado por extensiones y tamaño máximo desde la consola de Cloudinary.
- **Sin `.env`**: Las credenciales de Firebase y Cloudinary se configuran directamente en los archivos fuente. Cada entorno de deploy maneja su propia configuración de forma independiente.
