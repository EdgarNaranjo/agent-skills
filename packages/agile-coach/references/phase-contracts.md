# Phase Contracts — Contratos de Artefactos por Fase

Este archivo define el formato exacto del **Result Contract Envelope** que debe emitirse al completar cada fase, y los artefactos que actúan como "entradas" y "salidas" entre fases.

---

## Formato del Result Contract Envelope (Harness 8)

Al finalizar cada fase, emite SIEMPRE este bloque al final de tu respuesta:

```
---FASE: [nombre] | STATUS: [complete|partial|blocked]---
RESUMEN: [1-2 oraciones que describen qué se logró]
ARTEFACTOS:
  - [ruta/archivo creado o modificado]
  - [ruta/archivo creado o modificado]
SIGUIENTE RECOMENDADO: [FASE:acción concreta]
RIESGOS:
  - [riesgo identificado o "ninguno"]
SKILL RESOLUTION: [resolved:nombre-skill | not_applicable | fallback]
---
```

**STATUS values:**
- `complete` — todos los artefactos de salida generados y validados con el usuario
- `partial` — se generó parte, falta confirmar o completar algo
- `blocked` — no se puede avanzar sin input externo (usuario, dato, decisión)

---

## Contratos por Fase

### INIT

**Gate de entrada:** ninguno  
**Gate de salida:** usuario confirmó el charter

**Artefactos de entrada:**
- conversación con el usuario

**Artefactos de salida requeridos:**
```
.sdd/config.json              ← obligatorio
.sdd/phase-status.json        ← obligatorio
docs/scrum/project-charter.md ← obligatorio
```

**Ejemplo de envelope INIT:**
```
---FASE: INIT | STATUS: complete---
RESUMEN: Stack detectado (Spring Boot + Angular). Config SDD creado. Charter del proyecto firmado con el usuario.
ARTEFACTOS:
  - .sdd/config.json
  - .sdd/phase-status.json
  - docs/scrum/project-charter.md
SIGUIENTE RECOMENDADO: EXPLORE:analizar estructura de código existente
RIESGOS:
  - El equipo no tiene experiencia con Scrum → sesión de onboarding recomendada
SKILL RESOLUTION: not_applicable
---
```

---

### EXPLORE

**Gate de entrada:** `config.json` existe  
**Gate de salida:** usuario revisó y aprobó la exploración

**Artefactos de entrada:**
- `.sdd/config.json`
- código fuente del proyecto (si existe)
- documentación existente (si existe)

**Artefactos de salida requeridos:**
```
docs/sdd/explore.md           ← obligatorio
```

**Secciones mínimas en explore.md:**
1. Lo que existe (componentes, módulos, entidades)
2. Deuda técnica detectada
3. Dependencias externas
4. Gaps (lo que falta)
5. Component Dependency Graph (preliminar, Mermaid o ASCII)

**Ejemplo de envelope EXPLORE:**
```
---FASE: EXPLORE | STATUS: complete---
RESUMEN: Se analizaron 12 módulos existentes. Se detectó deuda técnica en el módulo de auth y 3 integraciones externas sin manejo de errores.
ARTEFACTOS:
  - docs/sdd/explore.md
SIGUIENTE RECOMENDADO: PROPOSAL:presentar 2-3 enfoques para resolver los gaps detectados
RIESGOS:
  - Módulo auth sin tests → cualquier cambio aquí es riesgo alto
  - API de pagos sin manejo de timeout → puede causar bloqueos en producción
SKILL RESOLUTION: not_applicable
---
```

---

### PROPOSAL

**Gate de entrada:** `explore.md` aprobado  
**Gate de salida:** usuario eligió una propuesta

**Artefactos de entrada:**
- `docs/sdd/explore.md`

**Artefactos de salida requeridos:**
```
docs/sdd/proposal.md          ← obligatorio
```

**Secciones mínimas en proposal.md:**
```markdown
# Propuesta A: [nombre]
**Descripción:** ...
**Ventajas:** ...
**Desventajas / riesgos:** ...
**Esfuerzo estimado:** [N sprints]
**Cuándo elegir esto:** ...

# Propuesta B: [nombre]
...

# Decisión
**Propuesta elegida:** [A | B | C | híbrido]
**Razón:** [por qué el usuario eligió esta]
**Fecha:** [ISO]
```

---

### SPEC

**Gate de entrada:** `proposal.md` con decisión tomada  
**Gate de salida:** Product Backlog priorizado y validado

**Artefactos de entrada:**
- `docs/sdd/proposal.md`

**Artefactos de salida requeridos:**
```
docs/sdd/spec.md              ← obligatorio
docs/scrum/product-backlog.md ← obligatorio
```

**Secciones mínimas en spec.md:**
```markdown
# Spec: [nombre del proyecto o feature]
## Épicas
### Épica 1: [nombre]
**Valor de negocio:** ...
**Criterios de éxito:** ...

## Historias de Usuario
[US-NNN en formato estándar]

## Restricciones conocidas
- ...

## Fuera de alcance
- ...
```

**Secciones mínimas en product-backlog.md:**
- Tabla de todas las US con ID, título, épica, SP, prioridad MoSCoW
- Matriz valor/esfuerzo
- Roadmap de releases (si aplica)

---

### DESIGN

**Gate de entrada:** `spec.md` con US priorizadas  
**Gate de salida:** diseño técnico aprobado por el equipo

**Artefactos de entrada:**
- `docs/sdd/spec.md`
- `docs/sdd/explore.md`

**Artefactos de salida requeridos:**
```
docs/sdd/design.md                ← obligatorio
docs/architecture/ADR-NNN-*.md   ← uno por cada decisión importante
```

**Secciones mínimas en design.md:**
```markdown
# Design: [nombre]
## Component Dependency Graph
[Mermaid]

## Descomposición técnica por US
### US-NNN: [título]
**Stack afectado:** [tecnología]
**Unidades técnicas:**
- T-NNN-01: [tarea] — [SP estimados]
- T-NNN-02: [tarea] — [SP estimados]

## Contratos de interfaz (si hay multi-stack)
### API: [endpoint]
- Método: GET | POST | PUT | DELETE
- Request: { ... }
- Response: { ... }
- Errores: { ... }
```

---

### TASKS (Sprint Planning)

**Gate de entrada:** `design.md` aprobado + Sprint Goal definido  
**Gate de salida:** Sprint Backlog firmado por el equipo

**Artefactos de entrada:**
- `docs/sdd/design.md`
- `docs/scrum/product-backlog.md`
- `.sdd/config.json` (velocidad histórica, team size)

**Artefactos de salida requeridos:**
```
docs/scrum/sprint-NNN/planning.md  ← obligatorio
```

**Secciones mínimas en planning.md:**
```markdown
# Sprint [N] Planning
**Sprint Goal:** [una frase clara]
**Duración:** [fecha inicio] → [fecha fin]
**Capacidad:** [personas] × [h/día] × [días] = [total horas] ≈ [SP estimados]
**Velocidad histórica:** [N SP] (promedio últimos [X] sprints)

## Sprint Backlog
| ID | Historia/Tarea | Stack | Responsable | SP | Estado |
|....|

## Definition of Done
- [ ] ...

## Riesgos del sprint
- ...

## Dependencias inter-tareas
- T-NNN requiere T-MMM completado antes
```

---

### APPLY

**Gate de entrada:** `sprint-NNN/planning.md` firmado  
**Gate de salida:** todas las tareas del sprint aplicadas y logueadas

**Artefactos de entrada:**
- `docs/scrum/sprint-NNN/planning.md`
- `.sdd/engram.json` (para consultar decisiones previas)

**Artefactos de salida requeridos:**
```
docs/scrum/sprint-NNN/apply-log.md  ← obligatorio
.sdd/backups/[fecha]/               ← si hubo cambios destructivos
```

**Secciones mínimas en apply-log.md:**
```markdown
# Apply Log — Sprint [N]
**Fecha inicio:** ...
**Última actualización:** ...

| ID | Tarea | Estado | Archivos modificados | Notas |
|----|-------|--------|---------------------|-------|
| T-01 | ... | ✅ Done | src/auth.ts | ... |
| T-02 | ... | 🔄 WIP  | ... | Bloqueado por API externa |
| T-03 | ... | ⏸ Bloqueada | — | Depende de T-02 |

## Cambios destructivos realizados
- [descripción + backup en .sdd/backups/]

## Deuda técnica generada
- [descripción]
```

---

### VERIFY

**Gate de entrada:** `apply-log.md` con todas las tareas en Done o documentadas  
**Gate de salida:** reporte de verificación con evidencias reales

**Artefactos de entrada:**
- `docs/scrum/sprint-NNN/apply-log.md`
- `docs/scrum/sprint-NNN/planning.md` (DoD + criterios de aceptación)

**Artefactos de salida requeridos:**
```
docs/scrum/sprint-NNN/verify-report.md  ← obligatorio
```

**Secciones mínimas en verify-report.md:**
```markdown
# Verify Report — Sprint [N]
**Fecha:** ...
**Comando de tests corrido:** `[comando]`
**Resultado:** ✅ X passing / ❌ Y failing

## Criterios de Aceptación verificados
| US | Criterio | Verificado | Evidencia |
|----|----------|------------|-----------|
| US-01 | Dado... cuando... entonces... | ✅ | [output/screenshot] |

## DoD checklist
- [x] Tests pasando
- [x] Code review completado
- [ ] Desplegado en staging ← PENDIENTE

## Riesgos pendientes
- [descripción, nivel: alto|medio|bajo]

## Deuda técnica detectada en verificación
- [descripción + tarea creada en backlog]
```

---

### ARCHIVE (Sprint Review + Retro + Engram)

**Gate de entrada:** `verify-report.md` con evidencias  
**Gate de salida:** sprint cerrado, memoria actualizada, siguiente sprint con backlog refinado

**Artefactos de entrada:**
- `docs/scrum/sprint-NNN/verify-report.md`
- `.sdd/engram.json`

**Artefactos de salida requeridos:**
```
docs/scrum/sprint-NNN/review.md   ← obligatorio
docs/scrum/sprint-NNN/retro.md    ← obligatorio
.sdd/engram.json                  ← actualizado
.sdd/config.json                  ← velocidad actualizada
.sdd/phase-status.json            ← sprint NNN cerrado, sprint N+1 abierto
```

**Ejemplo de envelope ARCHIVE:**
```
---FASE: ARCHIVE | STATUS: complete---
RESUMEN: Sprint 3 cerrado. Velocidad: 21 SP (histórico: 18). Memoria actualizada con 3 nuevas decisiones. Sprint 4 abierto.
ARTEFACTOS:
  - docs/scrum/sprint-003/review.md
  - docs/scrum/sprint-003/retro.md
  - .sdd/engram.json (actualizado)
  - .sdd/config.json (velocity_avg: 19)
SIGUIENTE RECOMENDADO: TASKS:planificar Sprint 4 con backlog refinado
RIESGOS:
  - 2 historias arrastradas al Sprint 4 por impedimento externo → revisar prioridad
SKILL RESOLUTION: resolved:code-review-excellence (se usó para la verify review)
---
```

---

## Reglas de contaminación de contexto (Harness 22)

Si en un contrato de fase detectas referencias a un proyecto diferente al configurado en `config.json`:

```
⚠️ ALERTA: El contexto parece mezclar [proyecto A] con [proyecto B].
Trabajando exclusivamente con: [proyecto actual según config.json]
¿Confirmas que es correcto continuar con este proyecto?
```

Nunca uses decisiones de engram de otro proyecto para el actual.
