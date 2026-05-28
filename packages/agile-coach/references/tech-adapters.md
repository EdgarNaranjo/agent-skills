# Tech Adapters — Descomposición de Tareas por Stack

Este archivo define cómo traducir una Historia de Usuario en tareas técnicas concretas según el stack del proyecto. Se usa en las fases DESIGN y TASKS.

---

## Cómo usar este adaptador

Para cada Historia de Usuario en el Sprint, aplica el adaptador del stack correspondiente para generar las tareas técnicas en el Sprint Backlog.

**Regla:** Una historia de usuario produce entre 2 y 6 tareas técnicas. Si produce más, considera partirla.

**Estimación de referencia:**
- Tarea de 1-2h → 0.5 SP
- Tarea de 3-5h → 1 SP
- Tarea de 6-8h → 2 SP
- Tarea de 1-2 días → 3 SP
- Tarea de 3-4 días → 5 SP (evalúa si se puede partir)

---

## ODOO (integración con skill `workflow-odoo19`)

**Activa el skill `workflow-odoo19` para todas las tareas técnicas de Odoo.**

El orquestador coordina; `workflow-odoo19` ejecuta el detalle técnico.

### Unidades técnicas estándar por Historia de Usuario

| Tipo de historia | Tareas técnicas generadas |
|-----------------|--------------------------|
| Nueva entidad/proceso | Modelo + migración, Vista form, Vista list/tree, Regla de seguridad, Test |
| Flujo con aprobación | Wizard, Campo de estado, Botones de acción, Regla de seguridad extendida |
| Reporte | Reporte QWeb (XML), Controlador de impresión, Test de reporte |
| Integración externa | Modelo de configuración, Cron o webhook, Manejo de errores, Log de sincronización |
| Herencia de módulo nativo | Herencia de modelo (`_inherit`), Herencia de vista (XPath), Test de regresión |
| Portal / website | Controlador HTTP, Template QWeb portal, Test funcional |
| Automatización | Acción automatizada (base.automation), Regla de trigger, Test |

### Formato de tarea técnica Odoo
```
T-NNN: [acción] [artefacto Odoo] para [US relacionada]
Stack: Odoo [versión]
Tipo: model | view | wizard | report | controller | cron | security | inherit
Archivo(s): [ruta relativa en el módulo]
SP: [estimación]
DoD: módulo actualizado en __manifest__.py, tests pasando, versión bumpeada
```

### Consideraciones Odoo específicas
- Toda tarea que crea/modifica un modelo requiere verificar migración
- Toda tarea UI requiere traducción i18n (`_()`)
- Toda tarea de seguridad requiere validar grupos y reglas de registro
- Bumping de versión en `__manifest__.py` es parte de TODA tarea

---

## JAVA / SPRING BOOT

### Unidades técnicas estándar por capa

```
Historia de Usuario
├── Entity / JPA Entity        ← modelo de datos
├── Repository (interface)     ← acceso a datos (JPA/JPQL)
├── Service (interface + impl) ← lógica de negocio
├── Controller (REST)          ← endpoints HTTP
├── DTO + Mapper               ← transferencia de datos
├── Test unitario (Service)    ← JUnit + Mockito
└── Test integración (Controller) ← MockMvc / Testcontainers
```

### Patrones de tareas por tipo de historia

| Tipo de historia | Tareas típicas |
|-----------------|----------------|
| CRUD básico | Entity, Repository, Service+Impl, Controller, DTOs (Request+Response), Tests |
| Autenticación/Autorización | SecurityConfig, UserDetailsService, JwtFilter, AuthController, Test |
| Integración con API externa | Client (RestTemplate/WebClient), Config, Exception handling, Test (WireMock) |
| Evento asíncrono | EventPublisher, EventListener, @Async config, Test |
| Reporte/Export | Service de generación, Endpoint stream, Test |
| Migración de datos | Script Flyway/Liquibase, Test de migración |

### Formato de tarea técnica Spring
```
T-NNN: [Crear|Actualizar|Refactorizar] [capa] para [US]
Stack: Spring Boot [versión]
Capa: entity | repository | service | controller | dto | test-unit | test-integration | config
Paquete: com.[proyecto].[dominio].[capa]
SP: [estimación]
DoD: tests pasando (mvn test), endpoint documentado (si aplica), cobertura > umbral
```

### Consideraciones Spring específicas
- Los tests de integración usan `@SpringBootTest` + base de datos de test (H2 o Testcontainers)
- Cada endpoint REST documenta su contrato (OpenAPI/Swagger)
- Los errores siempre se manejan con `@ControllerAdvice` / `ProblemDetail`
- Profiles de Spring: `dev`, `test`, `prod` separados

---

## ANGULAR

### Unidades técnicas estándar

```
Historia de Usuario
├── Feature Module             ← agrupación de la funcionalidad
├── Component (Smart)          ← lógica de la vista
├── Component (Presentational) ← UI pura, sin lógica
├── Service                    ← comunicación con backend
├── Interface / Model          ← tipado de datos
├── Guard (si aplica)          ← protección de rutas
├── Pipe (si aplica)           ← transformación de datos
└── Spec (test)                ← Jasmine/Karma o Jest
```

### Patrones de tareas por tipo de historia

| Tipo de historia | Tareas típicas |
|-----------------|----------------|
| Pantalla con listado | Module, List Component, Table Component, Service (HTTP), Interface, Test |
| Formulario con validación | Form Component, Reactive Form Group, Validators, Service, Test |
| Autenticación | Auth Module, Login Component, AuthService, AuthGuard, AuthInterceptor, Test |
| Dashboard/Gráficas | Dashboard Component, Chart Component (wrapper), Data Service, Test |
| Integración con API | Service (HttpClient), Interface de respuesta, ErrorInterceptor, Test |
| Navegación compleja | Routing Module, Guard, Resolver, Test de rutas |

### Formato de tarea técnica Angular
```
T-NNN: [Crear|Actualizar] [tipo] [nombre] para [US]
Stack: Angular [versión]
Tipo: module | component-smart | component-presentational | service | guard | pipe | interface | spec
Ruta: src/app/[feature]/[nombre].[tipo].ts
SP: [estimación]
DoD: ng build sin errores, spec pasando (ng test), coverage > umbral
```

### Consideraciones Angular específicas
- Standalone components vs NgModules: elige según versión (v17+ prefiere standalone)
- Signals vs RxJS: en v17+ evaluar signals para estado local
- Lazy loading por feature module obligatorio en proyectos grandes
- Accesibilidad (a11y): aria-label en elementos interactivos

---

## REACT / NEXT.JS

### Unidades técnicas estándar

```
Historia de Usuario
├── Component                  ← UI con JSX/TSX
├── Hook (custom)              ← lógica reutilizable
├── Context / Provider         ← estado compartido (si aplica)
├── API Route (Next.js)        ← endpoint backend (si aplica)
├── Store / Slice (Zustand/Redux) ← estado global (si aplica)
├── Type / Interface           ← tipado TypeScript
└── Test (RTL + Vitest/Jest)   ← testing de comportamiento
```

### Patrones de tareas por tipo de historia

| Tipo de historia | Tareas típicas |
|-----------------|----------------|
| Listado con fetch | Component, useQuery hook, Interface, API Route (Next), Test |
| Formulario | Component, useForm hook (o react-hook-form), validación, API Route, Test |
| Autenticación | AuthProvider, useAuth hook, ProtectedRoute, API Route, Test |
| Estado global | Store/Slice, Selectors, Acciones, Test del store |
| Dashboard | Layout Component, Chart Component, useDashboardData hook, Test |
| Página estática (Next) | Page component, getStaticProps/generateStaticParams, Test |

### Formato de tarea técnica React
```
T-NNN: [Crear|Actualizar] [tipo] [nombre] para [US]
Stack: React [versión] / Next.js [versión]
Tipo: component | hook | context | api-route | store | type | test
Ruta: src/[feature]/[nombre].[tipo].tsx
SP: [estimación]
DoD: build sin errores, tests pasando (vitest run), sin warnings de TypeScript
```

### Consideraciones React/Next específicas
- Server Components vs Client Components: diferencia crucial en Next.js 13+
- `use client` solo cuando se necesita interactividad real
- Hydration errors: validar que SSR y CSR produzcan el mismo HTML
- Images: usar `next/image` siempre para optimización

---

## DJANGO

### Unidades técnicas estándar

```
Historia de Usuario
├── Model                      ← entidad de datos
├── Migration                  ← makemigrations resultado
├── Serializer (DRF)           ← validación y serialización
├── View / ViewSet (DRF)       ← lógica HTTP
├── URL pattern                ← routing
├── Admin (si aplica)          ← interfaz admin
└── Test                       ← TestCase / APITestCase
```

### Formato de tarea técnica Django
```
T-NNN: [Crear|Actualizar] [capa] [nombre] para [US]
Stack: Django [versión] / DRF [versión]
Capa: model | migration | serializer | view | url | admin | test
Archivo: [app]/[capa].py
SP: [estimación]
DoD: python manage.py test pasando, makemigrations sin cambios pendientes
```

### Consideraciones Django específicas
- Toda migración debe ser reversible (definir `reverse_sql` si usa RunSQL)
- Signals deben estar en `apps.py` (ready()), no en models.py
- `select_related` / `prefetch_related` para evitar N+1 queries
- Permisos DRF: `IsAuthenticated`, `IsAdminUser` o custom según historia

---

## NODE.JS / EXPRESS

### Unidades técnicas estándar

```
Historia de Usuario
├── Router                     ← definición de rutas
├── Controller                 ← lógica de endpoints
├── Service                    ← lógica de negocio
├── Middleware                 ← autenticación, validación
├── Model (Mongoose/Sequelize) ← esquema de datos
├── Validator (Joi/Zod)        ← validación de entrada
└── Test (Jest/Mocha)          ← pruebas unitarias e integración
```

### Formato de tarea técnica Node/Express
```
T-NNN: [Crear|Actualizar] [capa] [nombre] para [US]
Stack: Node.js [versión] / Express [versión]
Capa: router | controller | service | middleware | model | validator | test
Archivo: src/[feature]/[nombre].[capa].js|ts
SP: [estimación]
DoD: npm test pasando, eslint sin errores, validación de entrada en todos los endpoints públicos
```

---

## FASTAPI / PYTHON

### Unidades técnicas estándar

```
Historia de Usuario
├── Schema (Pydantic)          ← validación y tipado
├── Router                     ← agrupación de endpoints
├── Service                    ← lógica de negocio
├── Repository                 ← acceso a datos (SQLAlchemy)
├── Model (SQLAlchemy)         ← entidad de BD
├── Alembic migration          ← cambio de esquema
└── Test (pytest)              ← unit + integración
```

### Formato de tarea técnica FastAPI
```
T-NNN: [Crear|Actualizar] [capa] [nombre] para [US]
Stack: FastAPI [versión] / SQLAlchemy [versión]
Capa: schema | router | service | repository | model | migration | test
Archivo: app/[feature]/[nombre].[capa].py
SP: [estimación]
DoD: pytest pasando, alembic upgrade head sin errores, mypy sin errores de tipo
```

---

## PROYECTO GENÉRICO (sin stack definido)

Cuando el stack no es detectado o es mixto/personalizado:

### Capas universales

```
Historia de Usuario
├── Capa de datos              ← persistencia, acceso a BD
├── Lógica de negocio          ← reglas, validaciones, procesos
├── Interfaz/API               ← cómo se expone al mundo
├── Test                       ← prueba del comportamiento
└── Documentación              ← si la interfaz es pública
```

Para cada capa, define con el equipo:
- ¿Qué archivo/clase/función la implementa?
- ¿Cuál es la entrada y salida esperada?
- ¿Cómo se prueba?

---

## PROYECTOS MULTI-STACK (ej. Odoo + Angular, Spring + React)

### Patrón de coordinación

```
US-NNN: [historia]
├── Backend Tasks (Spring/Odoo): T-NNN-B-01, T-NNN-B-02 ...
└── Frontend Tasks (Angular/React): T-NNN-F-01, T-NNN-F-02 ...
```

**Regla de dependencia:** las tareas de frontend que consumen un endpoint no pueden marcarse Done hasta que el contrato del backend esté disponible (aunque sea como mock).

**Contrato de interfaz:** antes de empezar las tareas de frontend, documentar el contrato de API:
```
GET /api/[recurso]
Response: { id: number, nombre: string, ... }
```

---

## Tabla de referencia: Story Points por tipo de tarea

| Tipo de tarea | SP típicos | Notas |
|---------------|-----------|-------|
| CRUD completo (entity+repo+service+controller+test) | 5-8 | Depende de complejidad del modelo |
| Endpoint simple (service+controller+test) | 2-3 | Reutiliza repo existente |
| Modelo de datos con migración | 1-2 | Solo si la migración es simple |
| Componente UI con datos (service+component+test) | 3-5 | Depende de la UI |
| Componente presentacional simple | 1-2 | Sin lógica, solo props |
| Integración externa (client+test+mock) | 3-5 | Más si hay auth compleja |
| Configuración/infraestructura | 1-3 | Variable |
| Test de regresión / coverage | 1-2 | No incluye el test de la feature |
| Migración de base de datos | 1-3 | Más si requiere data transform |
| Corrección de bug | 1-3 | Depende de causa raíz |
