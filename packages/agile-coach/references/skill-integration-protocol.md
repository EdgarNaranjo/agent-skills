# Skill Integration Protocol — Protocolo de Integración Genérico

Este protocolo define cómo el scrum-master se integra con **cualquier skill externo**, sin importar su origen, plataforma o propósito.

---

## Principio fundamental

El scrum-master **nunca depende** de un skill externo para funcionar. Los skills externos **amplían** lo que hace bien; no reemplazan funciones que el orquestador ya tiene internamente.

```
Scrum-master solo:   funciona al 100%
Scrum-master + X:    funciona al 100% + las capacidades de X
```

Si un skill no está disponible, el orquestador aplica su fallback interno y el usuario no nota la diferencia.

---

## Ciclo de vida de una integración

### 1. Descubrimiento (INIT)

Fuentes de descubrimiento:
- **Sistema**: los skills listados automáticamente en el contexto de la sesión
- **Usuario**: "tengo instalado X", "uso Y para Z"
- **Archivos**: presencia de configuraciones conocidas (`package.json`, `.claude/settings.json`, etc.)

Al descubrir un skill nuevo:
1. Identifica qué función cubre (ver tabla de funciones en Harness 14)
2. Pregunta al usuario si quiere integrarlo y en qué fase
3. Regístralo en `.sdd/config.json`

**No asumas que el usuario quiere integrar todos los skills que tiene.** Pregunta.

### 2. Registro en `.sdd/config.json`

```json
"skill_integrations": [
  {
    "name": "nombre-del-skill",
    "provides": "planning",
    "trigger_phase": "TASKS",
    "trigger_condition": "cuando hay más de 3 US en el sprint",
    "context_to_pass": ["sprint_goal", "us_list", "stack"],
    "expected_output": "plan de implementación por US",
    "fallback": "planning.md con pasos detallados por el orquestador",
    "available": true,
    "last_used": null
  }
]
```

### 3. Invocación en la fase correcta

Cuando el orquestador llega a la fase `trigger_phase`:
1. Comprueba si el skill está en `skill_integrations` y `available: true`
2. Anuncia la integración al usuario (G1 — Gentle AI):
   > "Para [función], voy a usar el skill `[nombre]`. ¿Procedo?"
3. Prepara el contexto mínimo (Harness 15)
4. Invoca el skill
5. Espera el resultado

### 4. Integración del resultado

Al recibir el output del skill:
- **Output válido**: incorpóralo al artefacto de la fase y documenta en el envelope (Harness 8)
- **Output parcial**: combínalo con lo que el orquestador genera por su cuenta
- **Sin output / error**: aplica el fallback interno, documenta `fallback` en el envelope

### 5. Feedback al sistema

Actualiza `.sdd/config.json`:
```json
{
  "name": "nombre-del-skill",
  "last_used": "[fecha ISO]",
  "last_result": "resolved | partial | fallback"
}
```

---

## Tabla de funciones cubribles por skills externos

| Función | Fase donde se activa | Qué recibe el skill | Qué entrega al orquestador |
|---------|---------------------|--------------------|-----------------------------|
| Brainstorming / exploración de ideas | PROPOSAL | `explore.md`, pregunta del usuario | Propuestas documentadas con trade-offs |
| Plan de implementación detallado | TASKS→APPLY | Sprint Backlog, `design.md` | Plan en markdown con pasos, archivos y tests |
| Ejecución con sub-agentes | APPLY | Plan de implementación, Sprint Goal | `apply-log.md` actualizado |
| TDD / metodología de desarrollo | APPLY (por tarea) | Descripción de la tarea, stack | Test escrito + implementación + commit |
| Verificación con evidencias | VERIFY | `apply-log.md`, criterios de aceptación | Evidencias reales (output, screenshots, métricas) |
| Code review | VERIFY/ARCHIVE | Diff del sprint, criterios de calidad | Lista de hallazgos categorizada |
| Debugging sistemático | APPLY/VERIFY | Descripción del bug, logs, contexto | Causa raíz + fix documentado |
| Workspace aislado (git) | Antes de APPLY | Nombre del branch, estrategia | Branch creado y activo |
| Diseño visual/UX | DESIGN | Spec de la historia, tipo de UI | Especificación de componentes, wireframe |
| Gestión de tickets externos (Jira, etc.) | TASKS/ARCHIVE | Sprint Backlog, Sprint Review | Tickets creados / actualizados en herramienta externa |
| Comunicación / notificaciones | ARCHIVE | Sprint Review resumido | Notificación enviada al canal/herramienta |
| Despliegue / CI-CD | APPLY/VERIFY | Lista de artefactos a desplegar | Estado del despliegue + URL/evidencia |

---

## Contrato mínimo de contexto (Harness 15 — Skill Digestion)

Cuando el orquestador invoca un skill, le pasa **solo** esto:

```markdown
## Contexto para [nombre-skill]

**Tarea concreta:** [descripción de lo que debe hacer]
**Tipo de proyecto:** [software | diseño | contenido | etc.]
**Stack/herramientas:** [solo las relevantes para esta tarea]
**Artefacto de entrada:** [ruta o contenido del archivo relevante]
**Resultado esperado:** [qué artefacto o acción debe producir]
**Restricciones activas:** [solo las que afectan esta tarea concreta]
**Contexto del sprint:** Sprint [N] — Goal: [Sprint Goal]
```

No pases: el SKILL.md completo, el engram entero, toda la conversación, ni documentos no relevantes para la tarea.

---

## Integración con Superpowers (ejemplo concreto)

Superpowers es un sistema de skills (`brainstorming`, `writing-plans`, `subagent-driven-development`, `verification-before-completion`, etc.). Se integra así:

| Fase scrum-master | Skill Superpowers | Función que cubre | Fallback |
|-------------------|-------------------|-------------------|----------|
| PROPOSAL | `brainstorming` | Exploración colaborativa de propuestas | Propuestas A/B del orquestador |
| TASKS→APPLY | `writing-plans` | Plan detallado con TDD por tarea | `planning.md` con pasos del orquestador |
| APPLY | `subagent-driven-development` | Sub-agente por tarea + 2 reviews | Ejecución secuencial guiada |
| APPLY por tarea | `test-driven-development` | Red-Green-Triangulate-Refactor | Guía TDD interna Harness 11 |
| APPLY cierre | `finishing-a-development-branch` | Cierre del branch del sprint | Instrucción manual al usuario |
| VERIFY | `verification-before-completion` | Evidencia real antes de Done | Checklist Harness 12 |
| VERIFY | `requesting-code-review` | Code review formal | Checklist interno |
| APPLY (bug) | `systematic-debugging` | Diagnóstico sistemático | Protocolo diagnóstico interno |

---

## Integración con workflow-odoo19 (ejemplo concreto)

Para proyectos Odoo, el orquestador delega el detalle técnico a `workflow-odoo19`:

| Fase scrum-master | Qué delega a workflow-odoo19 | Qué mantiene el orquestador |
|-------------------|-----------------------------|-----------------------------|
| DESIGN | Descomposición técnica de cada US (modelo, vista, etc.) | ADRs, architecture.md |
| APPLY por tarea | Implementación del artefacto Odoo | apply-log.md, progreso del sprint |
| VERIFY | Validación de estructura del módulo | Criterios de aceptación del sprint |

---

## Cómo agregar un skill propio

Si el usuario tiene un skill personalizado que no está en ningún mapa:

1. **Pregunta al usuario:**
   > "¿Qué hace el skill `[nombre]`? ¿En qué parte del proyecto te sería útil?"

2. **Clasifica** usando la tabla de funciones cubribles

3. **Registra** en `.sdd/config.json` con los campos del esquema

4. **Documenta** en el engram la integración descubierta:
   ```json
   {
     "type": "preference",
     "summary": "El usuario usa [nombre-skill] para [función] en la fase [X]",
     "rationale": "Detectado en la sesión de INIT del sprint N"
   }
   ```

5. En sesiones futuras, el Harness 30 (compaction recovery) recupera esta integración automáticamente desde el engram.

---

## Lo que el orquestador nunca delega a un skill externo

Estas funciones son **propias e indelegables** del scrum-master:

- La gestión del Phase DAG (qué fase viene, qué gates cumplir)
- El Sprint Goal y la Definition of Done
- La memoria del proyecto (engram.json)
- El Result Contract Envelope (Harness 8)
- La activación opcional y el consentimiento del usuario
- Las decisiones de arquitectura (ADRs) — puede consultarse con un skill, pero el orquestador es quien las documenta y custodia
