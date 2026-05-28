# Scrum Ceremonies — Referencia Completa

Guía detallada de conceptos y ceremonias Scrum para proyectos de cualquier tipo.

---

## Onboarding — Para Equipos Nuevos en Scrum

Si el equipo no tiene experiencia con Scrum, ofrece este resumen antes de comenzar:

### Scrum en 5 minutos

**¿Qué es Scrum?**
Un framework para trabajar en ciclos cortos llamados Sprints (1-4 semanas). Al final de cada Sprint el equipo entrega algo de valor real al usuario — no un avance interno, sino algo que el usuario puede ver o usar.

**Los 3 roles:**
- **Product Owner**: decide QUÉ construir y en qué orden. Dueño del backlog.
- **Scrum Master** (yo): facilita el proceso, elimina obstáculos.
- **El equipo**: decide CÓMO construir lo que el PO prioriza.

**Los 3 eventos por sprint:**
- **Sprint Planning**: ¿Qué haremos este sprint y cómo?
- **Daily** (opcional pero útil): sincronización diaria rápida (15 min)
- **Sprint Review + Retro**: ¿Qué entregamos? ¿Qué mejoraremos?

**Los 3 artefactos:**
- **Product Backlog**: lista ordenada de todo lo que queremos construir
- **Sprint Backlog**: lo que el equipo se comprometió a hacer en este sprint
- **Incremento**: lo que se entregó al final del sprint

**Lo más importante:** Scrum no es burocracia. Si algo no te sirve, lo adaptamos. El objetivo es entregar valor, no seguir reglas.

---

## Definition of Ready (DoR) — Checklist Completo

Una historia está lista para entrar al sprint cuando:

**Claridad:**
- [ ] El "Para [valor]" expresa beneficio real, no solo una acción técnica
- [ ] Los criterios de aceptación son observables (se puede ver, medir o probar)
- [ ] No quedan preguntas abiertas que bloqueen la implementación
- [ ] El equipo entiende qué hay que hacer sin necesitar reuniones adicionales

**Tamaño:**
- [ ] La historia cabe en un sprint (si no, partir antes de incluir)
- [ ] La estimación fue discutida por al menos 2 personas del equipo

**Dependencias:**
- [ ] Las dependencias externas (otras historias, sistemas, personas) están identificadas
- [ ] Las dependencias críticas están resueltas o tienen fecha de resolución antes del sprint

**Diseño:**
- [ ] Si la historia requiere decisiones de diseño/arquitectura, están tomadas o agendadas para los primeros días del sprint

**Regla práctica:** Si el equipo no puede empezar la historia el primer día del sprint sin hacer preguntas, la historia no está lista.

---

## Risk Register — Gestión de Riesgos

El Risk Register es un documento vivo en `docs/scrum/risk-register.md`. Se actualiza en cada Sprint Planning y Sprint Review.

### Formato del Risk Register

```markdown
# Risk Register — [nombre del proyecto]
Última actualización: [fecha]

| ID  | Riesgo | Probabilidad | Impacto | Score | Mitigación | Responsable | Estado |
|-----|--------|-------------|---------|-------|------------|-------------|--------|
| R-01 | [descripción] | Alta/Media/Baja | Alto/Medio/Bajo | [P×I] | [acción] | [quién] | Abierto/Cerrado |
```

**Score = Probabilidad × Impacto** (usando escala 1-3: Baja=1, Media=2, Alta=3)
- Score 6-9: Riesgo crítico → mitigación inmediata
- Score 3-4: Riesgo medio → plan de contingencia
- Score 1-2: Riesgo bajo → monitorear

### Tipos de riesgo comunes

**Software:** deuda técnica acumulada, dependencias de terceros sin SLA, falta de cobertura de tests, cambios de requisitos tardíos, ausencia de personal clave.

**Diseño/UX:** cambios de criterio del stakeholder, herramientas sin licencia, feedback de usuarios contradictorio.

**Marketing/Contenido:** aprobaciones lentas, cambios de plataforma, eventos externos que afectan el mensaje.

**General:** fechas límite inamovibles, presupuesto insuficiente, equipo sin disponibilidad, dependencias externas sin fecha.

### Cuándo actualizar
- **Sprint Planning**: revisa riesgos existentes, agrega los detectados en el planning
- **Daily**: menciona si un riesgo se materializa o escala
- **Sprint Review**: cierra los resueltos, actualiza estado de los abiertos

---

## Burndown — Seguimiento Mid-Sprint

### Setup en Sprint Planning

Registra en `docs/scrum/sprint-NNN/planning.md`:
```
Burndown Sprint [N]
SP totales: [X]
Días hábiles: [Y]
SP ideales por día: [X/Y]

Día 0 (inicio): [X] SP restantes
```

### Actualización en Daily

Cada Daily actualiza la tabla:
```
| Día | SP restantes | Línea ideal | Estado |
|-----|-------------|-------------|--------|
| 1   | [X]         | [X - X/Y]   | ✅/⚠️/❌ |
| 2   | [X]         | [X - 2×X/Y] | ...    |
```

**Interpretación:**
- **SP restantes < línea ideal**: ✅ Adelantados o en camino
- **SP restantes = línea ideal ±10%**: ✅ En camino
- **SP restantes > línea ideal 20%+**: ⚠️ Riesgo — revisar impedimentos
- **SP restantes > línea ideal 40%+**: ❌ Sprint en peligro — replanning urgente

**Para proyectos no-software:** reemplaza SP con cualquier unidad acordada (horas, entregables, puntos de esfuerzo). El concepto es el mismo.

### Si el burndown muestra peligro

> "El burndown muestra [X] SP restantes vs. [Y] ideales para este punto. Hay [Z] días hábiles restantes. Para terminar el sprint, el equipo necesitaría una velocidad de [X/Z] SP/día, vs. la histórica de [V] SP/día. Opciones: (A) reducir el alcance del sprint, (B) identificar y eliminar impedimentos que frenan el avance, (C) pedir apoyo externo."

---

## Seguimiento Mid-Sprint — Guía

### El seguimiento NO es una reunión de status

Existe para que el equipo detecte impedimentos y ajuste el rumbo hacia el Sprint Goal. No es para rendir cuentas — es para coordinarse.

### Las 3 preguntas útiles

1. ¿Qué avancé desde el último seguimiento hacia el Sprint Goal?
2. ¿Qué haré a continuación hacia el Sprint Goal?
3. ¿Hay algo que me impide avanzar?

### Señales de alarma durante el Daily

**El equipo siempre dice "todo bien":**
→ Probablemente hay problemas no dichos. En la siguiente retro: "¿Qué nos impide hablar de los impedimentos en el Daily?"

**Los mismos impedimentos aparecen día tras día:**
→ Después del Daily (no durante): "Este impedimento lleva [N] días. ¿Quién tiene autoridad para resolverlo? ¿Lo escalamos hoy?"

**Las respuestas no tienen relación con el Sprint Goal:**
→ El equipo está trabajando en cosas fuera del sprint. Preguntar: "¿Cómo contribuye lo que estás haciendo al Sprint Goal?"

**Alguien no participa:**
→ No forzar. Preguntar en privado si hay algo que le impide participar.

### Impedimentos: clasificación y acción

| Tipo | Ejemplo | Acción |
|------|---------|--------|
| Técnico bloqueante | "No puedo avanzar sin la API de pagos" | Buscar workaround o reasignar tarea |
| Organizacional | "Espero aprobación de [persona] desde hace 3 días" | Escalar al PO o management ese mismo día |
| De proceso | "No entiendo cómo funciona X" | Programar sesión de pair working |
| Personal | [no se menciona en Daily] | Conversación privada del SM |

**Regla:** si un impedimento lleva 2+ días sin resolverse → escalar ese día, no el siguiente.

---

## Retrospectiva — Métodos Alternativos

### Cuándo usar cada método

| Método | Cuándo usarlo |
|--------|--------------|
| **Start/Stop/Continue** | Equipo estable, sprint normal, < 6 meses trabajando juntos |
| **4Ls** | Equipo nuevo, sprint con muchos cambios, necesitan reflexionar más |
| **Sailboat** | Motivación baja, muchos impedimentos, equipo que siente que "el viento está en contra" |
| **DAKI** | Equipo que necesita definir qué prácticas retener, qué agregar |
| **Estrella de mar** | Necesitan matices: no solo stop/continue sino "hacer más/menos" |

### Método: Start / Stop / Continue
- **Start**: ¿Qué deberíamos empezar a hacer?
- **Stop**: ¿Qué deberíamos dejar de hacer?
- **Continue**: ¿Qué está funcionando y debemos mantener?

### Método: 4Ls (Liked / Learned / Lacked / Longed For)
- **Liked**: ¿Qué disfrutamos de este sprint?
- **Learned**: ¿Qué aprendimos?
- **Lacked**: ¿Qué nos faltó (recursos, claridad, apoyo)?
- **Longed For**: ¿Qué hubiéramos querido tener?

### Método: Sailboat
- **Viento** (lo que nos impulsa): ¿Qué nos ayudó a avanzar?
- **Anclas** (lo que nos frena): ¿Qué nos ralentizó?
- **Arrecifes** (riesgos): ¿Qué riesgos vemos adelante?
- **Isla** (objetivo): ¿Qué queremos lograr?

### Método: DAKI (Drop / Add / Keep / Improve)
- **Drop**: ¿Qué deberíamos eliminar?
- **Add**: ¿Qué deberíamos incorporar que no tenemos?
- **Keep**: ¿Qué está funcionando bien?
- **Improve**: ¿Qué deberíamos mejorar (no eliminar, sino hacer mejor)?

### Método: Estrella de mar
5 categorías: Keep doing · Do more of · Do less of · Stop doing · Start doing

### Cuando el mismo problema aparece sprint tras sprint

Si un problema se repite 3+ veces en retros, es sistémico. No es un problema de proceso, es un problema organizacional o estructural. Acción:
1. Nombrar el patrón: "Este es el 3er sprint que aparece X"
2. Escalar al nivel correcto: ¿Es un problema del equipo, del PO, de la organización?
3. Crear una acción de mejora con fecha límite y responsable específico — no genérica

**Si una acción de retro no se cumple en 2 sprints, es una señal de que el equipo no tiene autoridad o recursos para implementarla → escalar.**

---

## Backlog Refinement — Guía Práctica

### Cuándo y cuánto

- **Cuándo**: entre el cierre de un sprint y el planning del siguiente
- **Cuánto**: máximo 10% de la capacidad del sprint (en un sprint de 2 semanas: ~1h total, en varias sesiones cortas)
- **Formato**: sesiones de 20-30 minutos, frecuentes, no una mega-reunión de 3 horas

### Qué se hace en Refinement

1. **Partir historias grandes**: cualquier historia >8 SP debe partirse antes de entrar al sprint
2. **Clarificar criterios de aceptación**: que todos los entiendan igual
3. **Re-estimar con nueva información**: si el contexto cambió desde la última estimación
4. **Descubrir dependencias ocultas**: qué necesita estar hecho antes
5. **Verificar DoR**: preparar las historias del próximo sprint
6. **Eliminar historias obsoletas**: si ya no tienen valor, sacarlas del backlog

### Señal de backlog mal refinado

Si en el Sprint Planning el equipo hace preguntas como:
- "¿Qué significa exactamente X?"
- "¿Esto depende de Y que todavía no está hecho?"
- "Esto es mucho más complejo de lo que parece, ¿lo partimos?"

→ El refinement no fue suficiente. Dedicar más tiempo la próxima vez.

---

## Stakeholder Map — Mapa de Interesados

Para proyectos grandes (modo Full), crear en `docs/scrum/project-charter.md`:

```markdown
## Stakeholders

| Nombre / Grupo | Rol | Interés en el proyecto | Influencia | Comunicación |
|----------------|-----|----------------------|------------|--------------|
| [nombre]       | [rol] | [qué le importa]   | Alta/Media/Baja | [canal y frecuencia] |
```

**Cuadrante de gestión:**

| | Influencia Alta | Influencia Baja |
|--|----------------|-----------------|
| **Interés Alto** | Gestionar de cerca (Sprint Reviews, consultas frecuentes) | Mantener informados (reportes regulares) |
| **Interés Bajo** | Mantener satisfechos (actualizaciones mínimas pero consistentes) | Monitorear (mínima inversión) |

**En Sprint Review:** invita siempre a los stakeholders de "Influencia Alta + Interés Alto". Su feedback directo es el más valioso para el Product Backlog.
