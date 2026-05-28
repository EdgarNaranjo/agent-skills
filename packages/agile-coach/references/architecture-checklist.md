# Architecture Checklist — Proyectos Grandes

Lista de verificación para definir y documentar la arquitectura antes de iniciar el desarrollo.

---

## 1. Decisiones de Alto Nivel

### Patrón arquitectónico
- [ ] ¿Cuál es el patrón principal? (Monolito modular / Microservicios / Serverless / Híbrido)
- [ ] ¿El patrón es apropiado para el tamaño del equipo y el presupuesto de mantenimiento?
- [ ] ¿Hay un plan de migración si el patrón necesita cambiar?

**Recomendación por tamaño de equipo:**
| Equipo | Patrón recomendado |
|--------|-------------------|
| 1-4 personas | Monolito modular |
| 5-10 personas | Monolito modular con separación clara por dominio |
| 10+ personas | Microservicios o módulos semi-independientes |

### Separación de responsabilidades
- [ ] ¿Los dominios de negocio están bien delimitados?
- [ ] ¿Hay un diagrama de componentes de alto nivel?
- [ ] ¿Las interfaces entre componentes están definidas (contratos)?

---

## 2. Datos y Persistencia

- [ ] ¿Qué tipo de base de datos? (Relacional / NoSQL / Híbrida)
- [ ] ¿Cuál es la estrategia de migración de esquema? (Alembic, Flyway, Prisma, manual)
- [ ] ¿Cómo se manejan los datos sensibles? (cifrado en reposo, en tránsito)
- [ ] ¿Hay una estrategia de backup y recuperación?
- [ ] ¿Se necesita caché? (Redis, Memcached, caché en aplicación)
- [ ] ¿Hay datos históricos o de auditoría que preservar?

---

## 3. Autenticación y Autorización

- [ ] ¿Cómo se autentica el usuario? (JWT / Session / OAuth2 / API Key / SAML)
- [ ] ¿Hay roles y permisos? ¿El modelo RBAC es suficiente o se necesita ABAC?
- [ ] ¿Cómo se manejan las sesiones expiradas?
- [ ] ¿Hay multi-tenancy? ¿Cómo se aíslan los datos por tenant?

---

## 4. Integraciones Externas

Para cada integración:
- [ ] ¿Cuál es el contrato de la API? (documentación, versión)
- [ ] ¿Cómo se manejan los errores / timeouts / retries?
- [ ] ¿Hay SLAs o rate limits a considerar?
- [ ] ¿La integración es crítica (bloquea funcionalidad core) o secundaria?
- [ ] ¿Hay un plan si la API de terceros cambia o falla?

---

## 5. Infraestructura y Despliegue

- [ ] ¿Dónde se despliega? (Cloud: AWS/GCP/Azure/VPS / On-premise / Híbrido)
- [ ] ¿Cuántos entornos hay? (dev / staging / prod — mínimo recomendado)
- [ ] ¿Cómo se despliega? (CI/CD: GitHub Actions / GitLab CI / Jenkins / manual)
- [ ] ¿Hay contenedores? (Docker / Kubernetes)
- [ ] ¿Cuál es la estrategia de rollback si falla un despliegue?
- [ ] ¿Hay auto-scaling o el sizing es fijo?

---

## 6. Observabilidad

- [ ] ¿Hay logging estructurado? ¿Dónde se almacenan los logs?
- [ ] ¿Hay métricas de aplicación? (tiempo de respuesta, error rate, uso de recursos)
- [ ] ¿Hay alertas configuradas para los umbrales críticos?
- [ ] ¿Hay trazabilidad de errores? (Sentry, Datadog, Prometheus+Grafana)
- [ ] ¿Cómo se hace debugging en producción sin exponer datos sensibles?

---

## 7. Seguridad

- [ ] ¿Se validan todas las entradas del usuario? (prevención de SQLi, XSS, SSRF)
- [ ] ¿Los secretos están en variables de entorno, nunca en código?
- [ ] ¿Hay headers de seguridad HTTP configurados?
- [ ] ¿Hay rate limiting en endpoints públicos?
- [ ] ¿Se tienen en cuenta las OWASP Top 10?
- [ ] ¿Hay un proceso de gestión de vulnerabilidades en dependencias?

---

## 8. Escalabilidad y Performance

- [ ] ¿Cuántos usuarios concurrentes se esperan? ¿En el lanzamiento? ¿En 1 año?
- [ ] ¿Cuáles son los endpoints / operaciones más costosas?
- [ ] ¿Hay estrategia de paginación para listados grandes?
- [ ] ¿Las queries de base de datos tienen índices apropiados?
- [ ] ¿Hay un plan de load testing antes del lanzamiento?

---

## 9. Estructura del Código

- [ ] ¿Hay una convención de estructura de carpetas documentada?
- [ ] ¿Los módulos/paquetes están organizados por dominio o por tipo?
- [ ] ¿Hay un linter y formatter configurados y obligatorios en CI?
- [ ] ¿Hay un estilo de branching definido? (GitFlow / Trunk-based / Feature branches)
- [ ] ¿Cuál es la política de code review? (cuántas aprobaciones, quién puede hacer merge)

---

## 10. Documentación Mínima Requerida

Antes de iniciar el Sprint 1, debe existir:
- [ ] `README.md` con cómo levantar el proyecto localmente
- [ ] `docs/architecture/` con al menos un ADR del patrón principal
- [ ] Variables de entorno documentadas (`.env.example`)
- [ ] Diagrama de componentes de alto nivel
- [ ] Guía de contribución (`CONTRIBUTING.md`) si hay múltiples developers

---

## Template de ADR (Architecture Decision Record)

```markdown
# ADR-NNN: [Título de la decisión]

**Fecha:** YYYY-MM-DD  
**Estado:** Propuesto | Aceptado | Deprecado | Reemplazado por ADR-XXX  
**Autores:** [nombres]

## Contexto

[Describe el problema o situación que motivó esta decisión. Incluye restricciones y fuerzas en juego.]

## Opciones consideradas

### Opción A: [nombre]
- **Ventajas:** ...
- **Desventajas:** ...

### Opción B: [nombre]
- **Ventajas:** ...
- **Desventajas:** ...

## Decisión

[Describe qué se decidió y por qué se eligió sobre las otras opciones.]

## Consecuencias

**Positivas:**
- ...

**Negativas / trade-offs:**
- ...

**Riesgos a monitorear:**
- ...
```
