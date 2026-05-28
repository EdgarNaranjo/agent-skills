# Changelog

All notable changes to `pi-agile-coach` are documented here.

Format: [Semantic Versioning](https://semver.org) — `MAJOR.MINOR.PATCH`

---

## [1.0.0] — 2026-05-28

### Added
- **Skill: `agile-coach`** — Universal agile coach for any project type
- **Universal project type detection** — software, design, hardware, marketing, research, operations, generic
- **Depth modes** — Lite (1-2 people), Standard (2-5 people), Full (5+ people)
- **Phase DAG** with gate conditions: Init → Explore → Proposal → Spec → Design → Tasks → Apply → Verify → Archive → Refinement
- **Gentle AI system (G1-G8)** — max 3 questions per turn, vocabulary adaptation, no tech jargon in non-tech projects
- **Tech stack adapters** — automatic task decomposition for Odoo, Spring Boot, Angular, React/Next.js, Django, Node/Express, FastAPI
- **Engram memory** — persistent decision storage in `.sdd/engram.json` across sessions
- **Generic skill integration protocol** — any external skill can register for any phase
- **Superpowers integration** — brainstorming, writing-plans, subagent-driven-development, verification-before-completion
- **Odoo integration** — delegates technical tasks to `workflow-odoo19` when detected
- **Definition of Ready (DoR)** — gate condition before pulling stories into a sprint
- **Risk Register** — live risk tracking updated every sprint
- **Burndown tracking** — mid-sprint progress with alerts (on track / at risk / sprint in danger)
- **Backlog Refinement** — continuous activity between archive and next sprint
- **Multiple retrospective methods** — Start/Stop/Continue, 4Ls, Sailboat, DAKI
- **Stakeholder Map** — for large projects in Full mode
- **Team onboarding** — mini Scrum intro for teams with no prior experience
- **Standalone mode** — 100% functional without any external skill
- **7 reference files** loaded on demand (scrum-ceremonies, tech-adapters, phase-contracts, skill-integration-protocol, harnesses-detail, scrum-guide-summary, architecture-checklist)
- **H-SECURITY** — confirmation required before irreversible operations
- **H-MEMORY / H-RECOVERY** — session compaction recovery from artifacts
