# Scrum Guide 2020 — Resumen de Referencia

Fuente oficial: https://scrumguides.org/scrum-guide.html

---

## Definición de Scrum

Scrum es un framework ligero que ayuda a las personas, equipos y organizaciones a generar valor a través de soluciones adaptativas para problemas complejos.

**Pilares:** Transparencia · Inspección · Adaptación  
**Valores:** Compromiso · Enfoque · Apertura · Respeto · Coraje

---

## El Scrum Team

Un único equipo cohesionado de máximo **10 personas**. Sin jerarquías internas (excepto los roles definidos).

### Product Owner (1 persona)
- Maximiza el valor del producto
- Gestiona y prioriza el Product Backlog
- Representa los intereses de los stakeholders
- **Es una persona, no un comité**

### Scrum Master (1 persona)
- Hace posible el Scrum
- Elimina impedimentos
- Facilita eventos
- Protege al equipo de interrupciones externas
- Coaches: al Scrum Team, a la organización

### Developers (3-9 personas)
- Crean el Increment cada Sprint
- Auto-organizados y multifuncionales
- Crean el Sprint Backlog
- Se adaptan diariamente al Sprint Goal
- Definen la DoD (si no existe a nivel org)

---

## Eventos Scrum (Timeboxes)

### Sprint (contenedor de todos los eventos)
- **Duración:** 1-4 semanas (máximo 1 mes). **Recomendado: 2 semanas** para la mayoría de proyectos.
- Duración fija y consistente durante el proyecto
- No se cancelan sprints excepto en casos extremos (el PO puede cancelarlo si el Sprint Goal pierde sentido)
- Cada Sprint = una oportunidad de inspeccionar y adaptar

### Sprint Planning
| Sprint de 1 mes | Sprint de 2 semanas |
|-----------------|---------------------|
| 8 horas máximo  | 4 horas máximo      |

**Tres preguntas que responde:**
1. **¿Por qué es valioso este Sprint?** → Sprint Goal
2. **¿Qué se puede hacer este Sprint?** → Selección del Product Backlog
3. **¿Cómo se hará el trabajo elegido?** → Plan detallado (Sprint Backlog)

### Daily Scrum
- **Duración:** 15 minutos. Mismo lugar y hora.
- Solo para los Developers (el SM puede asistir como facilitador)
- Inspecciona el progreso hacia el Sprint Goal
- Las 3 preguntas son una sugerencia, no obligatorio

### Sprint Review
| Sprint de 1 mes | Sprint de 2 semanas |
|-----------------|---------------------|
| 4 horas máximo  | 2 horas máximo      |

- Presenta el Increment a stakeholders
- **No es una demo de ventas:** es una sesión de trabajo colaborativa
- Resultado: Product Backlog actualizado

### Sprint Retrospective
| Sprint de 1 mes | Sprint de 2 semanas |
|-----------------|---------------------|
| 3 horas máximo  | 1.5 horas máximo    |

- Inspecciona: personas, interacciones, procesos, herramientas, DoD
- Identifica mejoras para el siguiente Sprint
- Al menos **una mejora** debe convertirse en ítem del próximo Sprint Backlog

---

## Artefactos y Compromisos

### Product Backlog
**Compromiso:** Product Goal

- Lista ordenada de todo lo necesario para mejorar el producto
- El PO es responsable de su contenido, disponibilidad y ordenamiento
- Los ítems se refinan continuamente (Backlog Refinement: no más del 10% de la capacidad del Sprint)
- **Product Goal:** el estado futuro del producto. El equipo cumple un PG y luego pasa al siguiente.

### Sprint Backlog
**Compromiso:** Sprint Goal

- Compuesto por: Sprint Goal + ítems del PB seleccionados + plan de entrega
- Solo los Developers lo actualizan
- Visible y en tiempo real para todo el Scrum Team
- **Sprint Goal:** El único objetivo del Sprint. Da coherencia y foco. El equipo tiene flexibilidad en cómo alcanzarlo.

### Increment
**Compromiso:** Definition of Done

- Cada Increment es aditivo al anterior y verificado en conjunto
- Debe cumplir la DoD para ser presentado en la Review
- Un Sprint puede producir múltiples Increments
- La DoD es un compromiso formal de calidad. Si no hay DoD organizacional, el Scrum Team la define.

---

## Definition of Done (DoD) — Ejemplo base

Adapta según el proyecto. Mínimo recomendado:

- [ ] El código compila sin errores
- [ ] Los tests unitarios pasan (cobertura > umbral acordado)
- [ ] Revisión de código por al menos 1 par completada
- [ ] Criterios de aceptación verificados (manual o automatizado)
- [ ] Desplegado en entorno de staging/pre-producción
- [ ] Documentación actualizada (si aplica)
- [ ] Sin deuda técnica nueva no documentada

---

## Story Points — Escala de Fibonacci

| Puntos | Referencia de complejidad |
|--------|--------------------------|
| 1      | Cambio trivial, < 1 hora |
| 2      | Tarea simple, pocas horas |
| 3      | Tarea clara, medio día |
| 5      | Tarea moderada, 1-2 días |
| 8      | Compleja, múltiples partes, 2-4 días |
| 13     | Muy compleja o incierta, considerar partir |
| 21+    | Épica: partir antes de planificar |

**Velocity:** Promedio de story points completados en los últimos 3 sprints. Úsala para planificar, no como meta.

---

## Señales de Alerta Comunes

| Señal | Causa probable | Acción |
|-------|---------------|--------|
| Sprint Goal no se cumple 2+ veces seguidas | Sobreestimación, impedimentos no resueltos, o PB mal refinado | Revisión de capacidad + Retro enfocada |
| Daily Scrum dura > 15 min | Se usan para resolver problemas en vez de sincronizar | Separar sync de problem-solving |
| PB no refinado antes del Planning | PO no tiene tiempo / prioridades cambiantes | Bloquear tiempo fijo de refinement |
| Impedimentos acumulados | SM no tiene autoridad o falta de escalado | Escalar formalmente a gestión |
| DoD no se cumple pero se "acepta" | Presión de entrega | Deuda técnica explícita en el backlog |
| Velocidad muy variable sprint a sprint | Interrupciones externas o estimación inconsistente | Blindar el sprint + calibrar estimación |
