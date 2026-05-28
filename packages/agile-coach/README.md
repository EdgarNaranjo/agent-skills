# pi-agile-coach

> Universal agile coach for [pi coding agent](https://pi.dev) and Claude Code — structures any project into sprints, guides teams through the full delivery cycle, and adapts to any technology or project type.

![pi-agile-coach preview](https://raw.githubusercontent.com/EdgarNaranjo/agent-skills/main/assets/agile-coach-preview.png)

## What it does

### 🧠 Skill: `agile-coach`

Loaded automatically when you need to organize a project. Works for **any project type** — software, design, hardware, marketing campaigns, factory processes, operations, or research. Without being asked, the coach will:

- **Detect the project type** and adapt vocabulary — no technical jargon in non-tech projects
- **Detect the tech stack** automatically (Odoo, Spring, Angular, React, Django, Node, FastAPI, and more)
- **Propose the right depth** — Lite (1-2 people, short projects), Standard (2-5 people), or Full (5+ people, complex projects)
- **Guide through structured phases** — Init → Explore → Proposal → Spec → Design → Tasks → Apply → Verify → Archive
- **Generate all project artifacts** — backlog, sprint planning, risk register, burndown, retro, engram memory
- **Integrate with any skill** — works alone or alongside Superpowers, workflow-odoo19, code-review-excellence, or any custom skill

### 📋 Phase System

```
INIT → EXPLORE → PROPOSAL → SPEC → DESIGN → TASKS → APPLY → VERIFY → ARCHIVE
                                                      ↑________________________↑
                                               (sprint loop + continuous REFINEMENT)
```

Each phase has:
- **Gate conditions** — can't skip without explicit acknowledgment
- **Artifacts** — concrete files generated at each step
- **Contract envelope** — structured output with status, risks, and next steps

### 🔧 Tech Stack Adapters

When the project is software, the coach decomposes user stories into layer-specific tasks automatically:

| Stack | Tasks generated |
|-------|----------------|
| **Odoo** | Model, View (form/list/kanban), Wizard, Report, Cron, Security — delegates to `workflow-odoo19` |
| **Spring Boot** | Entity, Repository, Service, Controller, DTO, Unit Test, Integration Test |
| **Angular** | Module, Component (smart/presentational), Service, Guard, Pipe, Spec |
| **React/Next.js** | Component, Hook, Context, API Route, Store, Test (RTL/Vitest) |
| **Django** | Model, Migration, Serializer, ViewSet, URL, Admin, Test |
| **Node/Express** | Router, Controller, Service, Middleware, Model, Validator, Test |
| **FastAPI** | Router, Schema (Pydantic), Service, Repository, Model, Migration, Test |

### 📦 Artifacts Generated

Every sprint produces structured Markdown and JSON files:

```
.sdd/config.json           ← project configuration (persistent)
.sdd/phase-status.json     ← current phase state
.sdd/engram.json           ← decision memory across sessions
docs/scrum/project-charter.md
docs/scrum/product-backlog.md
docs/scrum/risk-register.md
docs/scrum/sprint-NNN/planning.md
docs/scrum/sprint-NNN/apply-log.md
docs/scrum/sprint-NNN/verify-report.md
docs/scrum/sprint-NNN/review.md
docs/scrum/sprint-NNN/retro.md
docs/sdd/explore.md
docs/sdd/proposal.md
docs/sdd/spec.md
docs/sdd/design.md
docs/architecture/ADR-NNN-*.md
```

### 🤝 Skill Integrations

The coach is a generic orchestrator — it never depends on external skills but enriches when they're available:

| Function | Compatible skills | Built-in fallback |
|----------|------------------|------------------|
| Brainstorming | `superpowers:brainstorming` | A/B/C proposals inline |
| Implementation plan | `superpowers:writing-plans` | Detailed `planning.md` |
| Execution with sub-agents | `superpowers:subagent-driven-development` | Sequential guided execution |
| Odoo development | `workflow-odoo19` | Generic task decomposition |
| Code review | `code-review-excellence` | Structured review checklist |
| Verification | `superpowers:verification-before-completion` | Evidence checklist (H-VERIFY) |

## Install

```bash
# With npx (recommended — works with pi and Claude Code)
npx skills add EdgarNaranjo/agent-skills@agile-coach -g -y

# With pi from npm
pi install npm:pi-agile-coach

# With pi from GitHub
pi install git:github.com/EdgarNaranjo/agent-skills@agile-coach

# Try without installing
pi -e git:github.com/EdgarNaranjo/agent-skills@agile-coach
```

## What makes this different

Most project management tools for AI agents are **templates** — they give you a backlog format or a sprint table. This skill gives the agent **judgment**: when to skip phases, how to adapt to a factory process vs. a marketing campaign, how to detect that a sprint is at risk, and how to integrate seamlessly with other skills without being told.

The **Engram Memory** is unique — decisions, preferences, and fixes are stored in `.sdd/engram.json` and recovered automatically in new sessions, so the agent never forgets what was decided three sprints ago.

## Gentle AI behaviors

The coach never overwhelms. Built-in rules enforce:
- Max 3 questions per turn
- Announces before generating large outputs
- Adapts vocabulary to the project type (no "commit" or "deploy" in a marketing campaign)
- Reminds the user they're in control after every long response
- Improves existing structure — never replaces without asking

## Compatible with

- [pi coding agent](https://pi.dev)
- Claude Code (`npx skills add`)
- Any project type: software, design, hardware, marketing, research, operations

## Works well alongside

- [`pi-odoo-workflow`](https://www.npmjs.com/package/pi-odoo-workflow) — Odoo 18/19 technical tasks
- [`superpowers-extended-cc`](https://github.com/badlogic/pi-superpowers) — execution engine with sub-agents, TDD, and verification
- [`code-review-excellence`](https://github.com/EdgarNaranjo/agent-skills) — structured code reviews

## References included

| File | Content |
|------|---------|
| `scrum-guide-summary.md` | Scrum Guide 2020: roles, events, artifacts, timeboxes |
| `scrum-ceremonies.md` | DoR, Risk Register, Burndown, Refinement, Retro methods, Stakeholder Map, onboarding |
| `tech-adapters.md` | Task decomposition by stack (Odoo, Spring, Angular, React, Django, Node, FastAPI) |
| `phase-contracts.md` | Detailed artifact contracts per phase |
| `skill-integration-protocol.md` | Generic protocol for integrating any external skill |
| `harnesses-detail.md` | Secondary harnesses: sub-agent isolation, scope review, model routing, backup/rollback |
| `architecture-checklist.md` | Architecture decision checklist for software projects |

## License

LGPL-3.0-or-later — see [LICENSE](LICENSE)
